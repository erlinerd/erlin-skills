// social_raster.swift — 社媒宣传图栅格内核（被 make_social.mjs 调用）。
// 用法: swift social_raster.swift <render-vertical|render-wide> <截图.png> <输出.png> < spec.json
//
// spec 由 node 侧 buildSpec 组装（颜色已解析为 RGB 数组，字体文件已探测）。
// 布局与原 make_social.py 逐项对应：PIL 坐标系 y 轴向下，AppKit y 轴向上，
// 所有 PIL 坐标经 rectPIL() 换算，注释保留视觉位置描述。

import AppKit
import CoreImage
import CoreText

typealias RGB = [Int]

struct RenderSpec: Decodable {
    let canvasW: Int
    let canvasH: Int
    let decor: String
    let background: RGB
    let ink: RGB
    let accent: RGB
    let secondary: RGB
    let motif: [RGB]
    let logoText: String?
    let title1: String
    let title2: String?
    let title2Color: RGB
    let subtitle: String?
    let footer: String?
    let fileName: String
    let fontFile: String
}

// 请求字重 → 依次尝试的样式关键字（PingFang 用名字，Hiragino 用 W3/W6，STHeiti 用 Light/Medium）
let weightFallbacks: [String: [String]] = [
    "Semibold": ["Semibold", "W6", "Bold", "Medium", "W3", "Light"],
    "Medium": ["Medium", "W5", "W3", "Regular"],
    "Regular": ["Regular", "W3", "Light", "Medium"],
]

var canvasW = 0
var canvasH = 0
var canvasCtx: NSGraphicsContext!
var fontFile = ""
var fontCache: [String: NSFont] = [:]

func fail(_ message: String) -> Never {
    fputs("错误: \(message)\n", stderr)
    exit(1)
}

func nsColor(_ rgb: RGB, _ alpha: CGFloat = 1) -> NSColor {
    NSColor(red: CGFloat(rgb[0]) / 255, green: CGFloat(rgb[1]) / 255, blue: CGFloat(rgb[2]) / 255, alpha: alpha)
}

// PIL 坐标（左上原点，y 向下）→ AppKit rect（左下原点，y 向上）
func rectPIL(left: CGFloat, top: CGFloat, right: CGFloat, bottom: CGFloat) -> NSRect {
    NSRect(x: left, y: CGFloat(canvasH) - bottom, width: right - left, height: bottom - top)
}

// 在指定 ttc 内按字重关键字匹配字面（关键字外层、字面内层，与 python get_font 顺序一致）
func loadFont(size: CGFloat, weight: String) -> NSFont {
    let cacheKey = "\(Int(size))|\(weight)"
    if let cached = fontCache[cacheKey] { return cached }
    guard let fontURL = CFURLCreateWithFileSystemPath(nil, fontFile as CFString, .cfurlposixPathStyle, false),
          let descriptors = CTFontManagerCreateFontDescriptorsFromURL(fontURL) as? [CTFontDescriptor],
          !descriptors.isEmpty else {
        fail("找不到可用中文字体，请检查 FONT_CANDIDATES")
    }
    var matched: CTFontDescriptor?
    for keyword in weightFallbacks[weight] ?? [weight] {
        for descriptor in descriptors {
            let style = CTFontDescriptorCopyAttribute(descriptor, kCTFontStyleNameAttribute) as? String ?? ""
            if style.lowercased().contains(keyword.lowercased()) {
                matched = descriptor
                break
            }
        }
        if matched != nil { break }
    }
    // CTFontDescriptor ↔ NSFontDescriptor toll-free 桥接
    let nsDescriptor = (matched ?? descriptors[0]) as NSFontDescriptor
    let font = NSFont(descriptor: nsDescriptor, size: size) ?? NSFont.systemFont(ofSize: size)
    fontCache[cacheKey] = font
    return font
}

func drawDot(centerX: CGFloat, centerY: CGFloat, diameter: CGFloat, color: RGB) {
    // 装饰圆点: 主体 + 左上高光 + 底部阴影, 带落影
    let radius = diameter / 2
    let left = centerX - radius
    let top = centerY - radius
    // 落影: 主体 rect 下移 2px（视觉向下）
    nsColor([0, 0, 0], 46.0 / 255).setFill()
    NSBezierPath(ovalIn: rectPIL(left: left, top: top + 2, right: left + diameter, bottom: top + diameter + 2)).fill()
    nsColor(color).setFill()
    NSBezierPath(ovalIn: rectPIL(left: left, top: top, right: left + diameter, bottom: top + diameter)).fill()
    // 左上高光
    nsColor([255, 255, 255], 90.0 / 255).setFill()
    NSBezierPath(ovalIn: rectPIL(left: left + diameter * 0.18, top: top + diameter * 0.12,
                                 right: left + diameter * 0.60, bottom: top + diameter * 0.32)).fill()
    // 底部阴影
    nsColor([0, 0, 0], 30.0 / 255).setFill()
    NSBezierPath(ovalIn: rectPIL(left: left + diameter * 0.14, top: top + diameter * 0.74,
                                 right: left + diameter * 0.69, bottom: top + diameter * 0.90)).fill()
}

func drawDotStrip(centerX: CGFloat, centerY: CGFloat, diameter: CGFloat, gap: CGFloat, motif: [RGB]) {
    var stripeX = centerX - CGFloat(motif.count - 1) * gap / 2
    for color in motif {
        drawDot(centerX: stripeX, centerY: centerY, diameter: diameter, color: color)
        stripeX += gap
    }
}

func roundedPath(_ rect: NSRect, _ cornerRadius: CGFloat) -> NSBezierPath {
    NSBezierPath(roundedRect: rect, xRadius: cornerRadius, yRadius: cornerRadius)
}

func drawText(_ text: String, _ font: NSFont, _ color: RGB, xPil: CGFloat, yPil: CGFloat, centerIn: CGFloat? = nil) {
    // PIL anchor "ma"（水平居中于 centerIn）或 "la"（左对齐于 xPil）；两者都以 ascender 顶部为 y
    let attr = NSAttributedString(string: text, attributes: [.font: font, .foregroundColor: nsColor(color)])
    let textSize = attr.size()
    let screenX = centerIn != nil ? centerIn! - textSize.width / 2 : xPil
    let baselineY = CGFloat(canvasH) - yPil - font.ascender
    attr.draw(at: NSPoint(x: screenX, y: baselineY))
}

func drawPhoneCard(shot: NSImage, shotSize: CGSize, cardX: CGFloat, cardY: CGFloat,
                   cardW: CGFloat, cornerRadius: CGFloat) {
    // 截图白边圆角卡 + 柔影。高度按截图纵横比自适应。
    let cardH = cardW * shotSize.height / shotSize.width
    let card = rectPIL(left: cardX - 12, top: cardY - 12, right: cardX + cardW + 12, bottom: cardY + cardH + 12)
    // 柔影: 整幅透明层上画圆角矩形（下移 26px）→ 高斯模糊 → 合成（对应 python shadow_layer + GaussianBlur(25)）
    guard let shadowRep = NSBitmapImageRep(
        bitmapDataPlanes: nil, pixelsWide: canvasW, pixelsHigh: canvasH,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
    ), let shadowCtx = NSGraphicsContext(bitmapImageRep: shadowRep) else { fail("无法创建阴影层") }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = shadowCtx
    nsColor([0, 0, 0], 56.0 / 255).setFill()
    roundedPath(rectPIL(left: cardX - 12, top: cardY - 12 + 26,
                        right: cardX + cardW + 12, bottom: cardY + cardH + 12 + 26), cornerRadius + 12).fill()
    NSGraphicsContext.restoreGraphicsState()

    guard let shadowSource = shadowRep.cgImage else { fail("阴影层编码失败") }
    guard let blurFilter = CIFilter(name: "CIGaussianBlur") else { fail("无法创建模糊滤镜") }
    blurFilter.setValue(CIImage(cgImage: shadowSource).clampedToExtent(), forKey: kCIInputImageKey)
    blurFilter.setValue(25.0, forKey: kCIInputRadiusKey)
    guard let blurredImage = blurFilter.outputImage,
          let blurredCG = CIContext().createCGImage(blurredImage, from: CGRect(x: 0, y: 0, width: canvasW, height: canvasH)) else {
        fail("高斯模糊失败")
    }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = canvasCtx
    NSImage(cgImage: blurredCG, size: NSSize(width: canvasW, height: canvasH))
        .draw(at: NSPoint.zero, from: NSRect(x: 0, y: 0, width: canvasW, height: canvasH),
              operation: .sourceOver, fraction: 1)
    // 白色卡底
    nsColor([255, 255, 255]).setFill()
    roundedPath(card, cornerRadius + 12).fill()
    // 截图: 圆角裁切后铺进卡内（对应 python resize + mask paste）
    let inner = rectPIL(left: cardX, top: cardY, right: cardX + cardW, bottom: cardY + cardH)
    roundedPath(inner, cornerRadius).addClip()
    canvasCtx.imageInterpolation = NSImageInterpolation.high
    shot.draw(in: inner)
    NSGraphicsContext.restoreGraphicsState()
}

func renderVertical(spec: RenderSpec, shot: NSImage, shotSize: CGSize) {
    let widthF = CGFloat(spec.canvasW)
    let heightF = CGFloat(spec.canvasH)

    if spec.decor == "dots" && spec.motif.count >= 3 {
        drawDot(centerX: widthF * 0.074, centerY: heightF * 0.958, diameter: widthF * 0.037, color: spec.motif[1])
        drawDot(centerX: widthF * 0.932, centerY: heightF * 0.904, diameter: widthF * 0.047, color: spec.motif[3])
        drawDot(centerX: widthF * 0.879, centerY: heightF * 0.958, diameter: widthF * 0.024, color: spec.motif[5])
    }

    var cursorY = heightF * 0.045
    if let logoText = spec.logoText {
        drawDot(centerX: widthF * 0.085, centerY: cursorY + widthF * 0.016,
                diameter: widthF * 0.032, color: spec.accent)
        drawText(logoText, loadFont(size: CGFloat(Int(widthF * 0.034)), weight: "Semibold"),
                 spec.ink, xPil: widthF * 0.113, yPil: cursorY)
        cursorY += widthF * 0.09
    }

    let titleFont = loadFont(size: CGFloat(Int(widthF * 0.084)), weight: "Semibold")
    drawText(spec.title1, titleFont, spec.ink, xPil: widthF * 0.065, yPil: cursorY)
    cursorY += widthF * 0.084 * 1.3
    if let title2 = spec.title2 {
        drawText(title2, titleFont, spec.title2Color, xPil: widthF * 0.065, yPil: cursorY)
        cursorY += widthF * 0.084 * 1.3
    }
    if let subtitle = spec.subtitle {
        drawText(subtitle, loadFont(size: CGFloat(Int(widthF * 0.029)), weight: "Regular"),
                 spec.secondary, xPil: widthF * 0.068, yPil: cursorY + widthF * 0.004)
        cursorY += widthF * 0.075
    }

    cursorY += widthF * 0.02
    // 截图卡自适应宽度：保证卡片底 + 底部装饰条不溢出画布。
    let maxHeight = heightF - heightF * 0.12 - cursorY
    let fitWidth = maxHeight * shotSize.width / shotSize.height
    let cardWidth = min(widthF * 0.47, fitWidth)
    if cardWidth < widthF * 0.22 {
        fputs("警告: \(spec.fileName) 截图纵横比过陡（\(Int(shotSize.width))×\(Int(shotSize.height))），"
            + "卡片只能缩到非常小 —— 换 wide 布局或选更矮的截图\n", stderr)
    }
    drawPhoneCard(shot: shot, shotSize: shotSize, cardX: (widthF - cardWidth) / 2, cardY: cursorY,
                  cardW: cardWidth, cornerRadius: widthF * 0.045)

    if spec.decor == "dots" {
        drawDotStrip(centerX: widthF / 2, centerY: heightF * 0.915,
                     diameter: widthF * 0.021, gap: widthF * 0.032, motif: spec.motif)
    }
    if let footer = spec.footer {
        drawText(footer, loadFont(size: CGFloat(Int(widthF * 0.027)), weight: "Medium"),
                 spec.secondary, xPil: 0, yPil: heightF * 0.934, centerIn: widthF / 2)
    }
}

func renderWide(spec: RenderSpec, shot: NSImage, shotSize: CGSize) {
    let widthF = CGFloat(spec.canvasW)
    let heightF = CGFloat(spec.canvasH)

    if spec.decor == "dots" && spec.motif.count >= 3 {
        drawDot(centerX: widthF * 0.038, centerY: heightF * 0.07, diameter: widthF * 0.028, color: spec.motif[1])
        drawDot(centerX: widthF * 0.073, centerY: heightF * 0.045, diameter: widthF * 0.016, color: spec.motif[3])
    }

    let phoneH = heightF * 0.87
    let phoneW = min(phoneH * shotSize.width / shotSize.height, widthF * 0.62)
    let phoneX = widthF - phoneW - widthF * 0.05

    let titleSize = floor(heightF * 0.085)
    let title = spec.title1 + (spec.title2 != nil ? "，" + spec.title2! : "")
    drawText(title, loadFont(size: titleSize, weight: "Semibold"),
             spec.ink, xPil: widthF * 0.06, yPil: heightF * 0.33)

    var cursorY = heightF * 0.33 + titleSize * 1.45
    if let subtitle = spec.subtitle {
        let subSize = floor(heightF * 0.038)
        drawText(subtitle, loadFont(size: subSize, weight: "Regular"),
                 spec.secondary, xPil: widthF * 0.0625, yPil: cursorY)
        cursorY += subSize * 1.65
    }
    if spec.decor == "dots" {
        drawDotStrip(centerX: min(widthF * 0.3, phoneX / 2), centerY: heightF * 0.68,
                     diameter: heightF * 0.031, gap: heightF * 0.06, motif: spec.motif)
    }
    if let footer = spec.footer {
        drawText(footer, loadFont(size: CGFloat(Int(heightF * 0.033)), weight: "Medium"),
                 spec.secondary, xPil: widthF * 0.06, yPil: heightF * 0.91)
    }

    drawPhoneCard(shot: shot, shotSize: shotSize, cardX: phoneX, cardY: heightF * 0.065,
                  cardW: phoneW, cornerRadius: widthF * 0.03)
}

// ── 入口 ──────────────────────────────────────────────────────────────

let arguments = CommandLine.arguments
guard arguments.count == 4, arguments[1] == "render-vertical" || arguments[1] == "render-wide" else {
    fputs("用法: swift social_raster.swift <render-vertical|render-wide> <截图.png> <输出.png> < spec.json\n", stderr)
    exit(1)
}
let command = arguments[1]
let shotPath = arguments[2]
let outputPath = arguments[3]

let spec: RenderSpec
do {
    let jsonData = FileHandle.standardInput.readDataToEndOfFile()
    spec = try JSONDecoder().decode(RenderSpec.self, from: jsonData)
} catch {
    fail("配置解析失败 \(error)")
}
canvasW = spec.canvasW
canvasH = spec.canvasH
canvasCtx = nil
fontFile = spec.fontFile

guard let canvasRep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: canvasW, pixelsHigh: canvasH,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
), let graphicsCtx = NSGraphicsContext(bitmapImageRep: canvasRep) else { fail("无法创建画布") }
canvasRep.size = NSSize(width: canvasW, height: canvasH)
canvasCtx = graphicsCtx

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = canvasCtx
nsColor(spec.background).setFill()
NSRect(x: 0, y: 0, width: canvasW, height: canvasH).fill()

guard let shot = NSImage(contentsOfFile: shotPath),
      let shotCG = shot.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    fail("无法读取截图 \(shotPath)")
}
let shotSize = CGSize(width: shotCG.width, height: shotCG.height)

if command == "render-wide" {
    renderWide(spec: spec, shot: shot, shotSize: shotSize)
} else {
    renderVertical(spec: spec, shot: shot, shotSize: shotSize)
}
NSGraphicsContext.restoreGraphicsState()

// 输出 PNG：画布背景铺满、处处不透明，直接保存 RGBA PNG。
// 与 python convert("RGB") 的差别仅在文件带 alpha=255 通道，像素一致
// （NSGraphicsContext 位图上下文要求带 alpha，纯 RGB 位图无法直接落盘）。
guard let pngData = canvasRep.representation(using: NSBitmapImageRep.FileType.png, properties: [:]) else {
    fail("PNG 编码失败")
}
do {
    try pngData.write(to: URL(fileURLWithPath: outputPath))
} catch {
    fail("写出失败 \(error)")
}
print("wrote \(outputPath)")
