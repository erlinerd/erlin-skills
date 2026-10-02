// icon_raster.swift — erlin-app-icon 栅格内核（render_icon.mjs / verify_icon.mjs / verify_icon.test.mjs 共用）。
// 传入坐标一律为顶部原点、y 向下（PIL 语义）；AppKit 绘图 y 轴向上，子命令内部负责换算。
// 用法: swift icon_raster.swift <子命令> [args...]
//   measure <fontSize> <text>                                        → {"bbox":[x0,y0,x1,y1],"advance":N}
//   draw <out.png> <fontSize> <originX> <baselineY> <text> <bg:r,g,b,a> <ink:r,g,b,a>
//   dot <in.png> <out.png> <cx> <cy> <r> <color:r,g,b,a>
//   scan <in.png>                                                    → {"width":W,"height":H,"accent":[..]|null,"ink":[..]|null}
//   fixture <out.png> <offset> <withAccent:0|1> <canvasSize> [withInk:0|1，缺省 1]   → 测试夹具（原 test_verify_icon.py 的 make_icon；withInk=0 且 withAccent=0 时为纯底色图）

import AppKit
import CoreText

let canvasSize = 1024

// scan 判定阈值：逐字源自原 verify_icon.py 的 ACCENT_MIN/ACCENT_MAX/INK_MIN。
// render 的强调色 (255,176,84) 与文字墨迹 (242,241,236) 必须落在区间内，
// 两个调用方共享此实现（单一来源），改动前先确认双侧语义。
let accentMinRed = 0.95 * 255.0
let accentMinGreen = 0.55 * 255.0
let accentMinBlue = 0.0
let accentMaxRed = 1.0 * 255.0
let accentMaxGreen = 0.85 * 255.0
let accentMaxBlue = 0.55 * 255.0
let inkMinRed = 0.9 * 255.0
let inkMinGreen = 0.9 * 255.0
let inkMinBlue = 0.85 * 255.0

func fail(_ message: String) -> Never {
    fputs("错误: \(message)\n", stderr)
    exit(1)
}

func number(_ raw: String) -> CGFloat {
    guard let value = Double(raw) else { fail("数字非法: \(raw)") }
    return CGFloat(value)
}

func parseColor(_ raw: String, label: String) -> NSColor {
    let parts = raw.split(separator: ",").compactMap { Double($0) }
    guard parts.count == 4 else { fail("\(label) 颜色格式应为 r,g,b,a: \(raw)") }
    return NSColor(red: parts[0] / 255, green: parts[1] / 255, blue: parts[2] / 255, alpha: parts[3] / 255)
}

func loadFont(_ fontSize: CGFloat) -> CTFont {
    // 原 .py 用 /System/Library/Fonts/SFNS.ttf face 0（regular）
    let fontURL = URL(fileURLWithPath: "/System/Library/Fonts/SFNS.ttf")
    let attributes = [kCTFontURLAttribute: fontURL] as CFDictionary
    let descriptor = CTFontDescriptorCreateWithAttributes(attributes)
    return CTFontCreateWithFontDescriptor(descriptor, fontSize, nil)
}

// kerning 关闭（对齐 PIL basic layout 的纯 advance 度量）
// color 必须显式放进属性串：CTLineDraw 默认不读 CGContext 填充色，缺省纯黑（踩过：黑底黑字）
func makeLine(_ text: String, fontSize: CGFloat, color: NSColor?) -> CTLine {
    let font = loadFont(fontSize)
    var attributes: [CFString: Any] = [kCTFontAttributeName: font, kCTKernAttributeName: 0]
    if let cgColor = color?.cgColor { attributes[kCTForegroundColorAttributeName] = cgColor }
    guard let attributed = CFAttributedStringCreate(nil, text as CFString, attributes as CFDictionary) else {
        fail("无法排版文本 \(text)")
    }
    return CTLineCreateWithAttributedString(attributed)
}

// PIL anchor="ls" 语义（原点=左基线、y 向下）的墨迹 bbox 与 advance
func measureText(_ text: String, fontSize: CGFloat) -> (bbox: [Int], advance: Double) {
    let font = loadFont(fontSize)
    let line = makeLine(text, fontSize: fontSize, color: nil)
    var minX = CGFloat.greatestFiniteMagnitude, maxX = -CGFloat.greatestFiniteMagnitude
    var minY = CGFloat.greatestFiniteMagnitude, maxY = -CGFloat.greatestFiniteMagnitude
    guard let runs = CTLineGetGlyphRuns(line) as? [CTRun] else { fail("无法读取字形 run") }
    for run in runs {
        let glyphCount = CTRunGetGlyphCount(run)
        var glyphs = [CGGlyph](repeating: 0, count: glyphCount)
        CTRunGetGlyphs(run, CFRange(location: 0, length: glyphCount), &glyphs)
        var rects = [CGRect](repeating: .zero, count: glyphCount)
        CTFontGetBoundingRectsForGlyphs(font, .horizontal, glyphs, &rects, glyphCount)
        var advances = [CGSize](repeating: .zero, count: glyphCount)
        CTFontGetAdvancesForGlyphs(font, .horizontal, glyphs, &advances, glyphCount)
        var pen: CGFloat = 0
        for index in 0..<glyphCount {
            let rect = rects[index].offsetBy(dx: pen, dy: 0)
            minX = min(minX, rect.minX)
            maxX = max(maxX, rect.maxX)
            minY = min(minY, rect.minY)
            maxY = max(maxY, rect.maxY)
            pen += advances[index].width
        }
    }
    guard minX <= maxX else { fail("文本无可见字形 \(text)") }
    // CoreText y 轴向上 → PIL anchor="ls" y 轴向下：y0 = -maxY，y1 = -minY
    let bbox = [Int(minX.rounded()), Int((-maxY).rounded()), Int(maxX.rounded()), Int((-minY).rounded())]
    let advance = CTLineGetTypographicBounds(line, nil, nil, nil)
    return (bbox, advance)
}

func newCanvasRep(size: Int) -> NSBitmapImageRep {
    guard let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
    ) else { fail("无法创建画布") }
    rep.size = NSSize(width: size, height: size)
    return rep
}

func loadRep(_ path: String) -> NSBitmapImageRep {
    guard let data = FileManager.default.contents(atPath: path),
          let rep = NSBitmapImageRep(data: data) else { fail("无法读取 \(path)") }
    return rep
}

func writeRep(_ rep: NSBitmapImageRep, to path: String) {
    guard let png = rep.representation(using: NSBitmapImageRep.FileType.png, properties: [:]) else {
        fail("PNG 编码失败")
    }
    do {
        try png.write(to: URL(fileURLWithPath: path))
    } catch {
        fail("写出失败 \(path): \(error)")
    }
}

func mergeBox(_ box: [Int]?, _ pixelX: Int, _ pixelY: Int) -> [Int] {
    guard let box = box else { return [pixelX, pixelY, pixelX, pixelY] }
    return [min(box[0], pixelX), min(box[1], pixelY), max(box[2], pixelX), max(box[3], pixelY)]
}

func measureSubcommand(_ args: [String]) {
    guard args.count == 2 else { fail("measure 参数: <fontSize> <text>") }
    let (bbox, advance) = measureText(args[1], fontSize: number(args[0]))
    let advanceText = String(format: "%.3f", advance)
    print("{\"bbox\":[\(bbox[0]),\(bbox[1]),\(bbox[2]),\(bbox[3])],\"advance\":\(advanceText)}")
}

func drawSubcommand(_ args: [String]) {
    guard args.count == 7 else {
        fail("draw 参数: <out.png> <fontSize> <originX> <baselineY> <text> <bg:r,g,b,a> <ink:r,g,b,a>")
    }
    let outPath = args[0]
    let fontSize = number(args[1])
    let originX = number(args[2])
    let baselineY = number(args[3])
    let text = args[4]
    let backgroundColor = parseColor(args[5], label: "bg")
    let inkColor = parseColor(args[6], label: "ink")
    let rep = newCanvasRep(size: canvasSize)
    guard let ctx = NSGraphicsContext(bitmapImageRep: rep) else { fail("无法创建绘图上下文") }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = ctx
    backgroundColor.setFill()
    NSRect(x: 0, y: 0, width: canvasSize, height: canvasSize).fill()
    let drawContext = ctx.cgContext
    drawContext.textPosition = CGPoint(x: originX, y: CGFloat(canvasSize) - baselineY)
    CTLineDraw(makeLine(text, fontSize: fontSize, color: inkColor), drawContext)
    NSGraphicsContext.restoreGraphicsState()
    writeRep(rep, to: outPath)
}

func dotSubcommand(_ args: [String]) {
    guard args.count == 6 else { fail("dot 参数: <in.png> <out.png> <cx> <cy> <r> <color:r,g,b,a>") }
    let inPath = args[0]
    let outPath = args[1]
    let centerX = number(args[2])
    let centerYTop = number(args[3])
    let radius = number(args[4])
    let color = parseColor(args[5], label: "color")
    guard let source = NSImage(contentsOfFile: inPath) else { fail("无法读取 \(inPath)") }
    // 新建 deviceRGB rep 重绘（从文件加载的 rep 在新 macOS 上无法直接建 NSGraphicsContext）
    let rep = newCanvasRep(size: canvasSize)
    guard let ctx = NSGraphicsContext(bitmapImageRep: rep) else { fail("无法创建绘图上下文") }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = ctx
    ctx.imageInterpolation = NSImageInterpolation.none // 同尺寸 1:1 重绘，不做插值
    source.draw(in: NSRect(x: 0, y: 0, width: canvasSize, height: canvasSize))
    color.setFill()
    // 顶部原点圆心 (centerX, centerYTop) → AppKit 圆心 (centerX, height - centerYTop)
    let rect = NSRect(x: centerX - radius, y: CGFloat(canvasSize) - centerYTop - radius,
                      width: radius * 2, height: radius * 2)
    NSBezierPath(ovalIn: rect).fill()
    NSGraphicsContext.restoreGraphicsState()
    writeRep(rep, to: outPath)
}

func scanSubcommand(_ args: [String]) {
    guard args.count == 1 else { fail("scan 参数: <in.png>") }
    let rep = loadRep(args[0])
    // NSBitmapImageRep 的 bitmapData 第 0 行 = 图像顶部行；仅支持 RGB/RGBA 8bit PNG（本 skill 自产图）
    guard let base = rep.bitmapData else {
        fail("无位图数据 \(args[0])")
    }
    // 扫描按 8bit RGB/RGBA 逐像素读三通道；灰度/16bit 输入会错位读出假墨迹（假绿），直接拒绝
    guard rep.samplesPerPixel >= 3, rep.bitsPerPixel == 32 else {
        fail("scan 仅支持 8bit RGB/RGBA PNG，实际 \(args[0]): \(rep.bitsPerPixel)bit/\(rep.samplesPerPixel)通道")
    }
    let width = rep.pixelsWide
    let height = rep.pixelsHigh
    let bytesPerRow = rep.bytesPerRow
    let bytesPerPixel = max(rep.bitsPerPixel / 8, rep.samplesPerPixel)
    var accent: [Int]?
    var ink: [Int]?
    for row in 0..<height {
        let rowBase = base + row * bytesPerRow
        for column in 0..<width {
            let offset = column * bytesPerPixel
            let red = Double(rowBase[offset])
            let green = Double(rowBase[offset + 1])
            let blue = Double(rowBase[offset + 2])
            if accentMinRed <= red && red <= accentMaxRed,
               accentMinGreen <= green && green <= accentMaxGreen,
               accentMinBlue <= blue && blue <= accentMaxBlue {
                accent = mergeBox(accent, column, row)
            } else if red >= inkMinRed && green >= inkMinGreen && blue >= inkMinBlue {
                ink = mergeBox(ink, column, row)
            }
        }
    }
    func boxJson(_ box: [Int]?) -> String {
        guard let box = box else { return "null" }
        return "[\(box[0]),\(box[1]),\(box[2]),\(box[3])]"
    }
    print("{\"width\":\(width),\"height\":\(height),\"accent\":\(boxJson(accent)),\"ink\":\(boxJson(ink))}")
}

func fixtureSubcommand(_ args: [String]) {
    guard args.count == 4 || args.count == 5 else { fail("fixture 参数: <out.png> <offset> <withAccent:0|1> <canvasSize> [withInk:0|1]") }
    let outPath = args[0]
    let offset = number(args[1])
    let withAccent = args[2] == "1"
    let size = Int(number(args[3]))
    let withInk = args.count < 5 || args[4] == "1"
    let rep = newCanvasRep(size: size)
    guard let ctx = NSGraphicsContext(bitmapImageRep: rep) else { fail("无法创建绘图上下文") }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = ctx
    NSColor(red: 10 / 255, green: 10 / 255, blue: 12 / 255, alpha: 1).setFill()
    NSRect(x: 0, y: 0, width: size, height: size).fill()
    if withInk {
        NSColor(red: 242 / 255, green: 241 / 255, blue: 236 / 255, alpha: 1).setFill()
        // 墨迹方块 (412+offset,412)-(612+offset,612)（顶部原点）
        NSRect(x: 412 + offset, y: CGFloat(size) - 612, width: 200, height: 200).fill()
    }
    if withAccent {
        NSColor(red: 1, green: 176 / 255, blue: 84 / 255, alpha: 1).setFill()
        // 强调色方块 (480,480)-(544,544)（顶部原点；原 .py 为 draw.ellipse 真圆，移植改矩形——外接 bbox 与中心 (512,512) 相同，scan 判定等效）
        NSRect(x: 480, y: CGFloat(size) - 544, width: 64, height: 64).fill()
    }
    NSGraphicsContext.restoreGraphicsState()
    writeRep(rep, to: outPath)
}

let args = Array(CommandLine.arguments.dropFirst())
let usage = """
用法: swift icon_raster.swift <子命令> [args...]
  measure / draw / dot / scan / fixture
"""
guard let subcommand = args.first else { fail(usage) }
switch subcommand {
case "measure": measureSubcommand(Array(args.dropFirst()))
case "draw": drawSubcommand(Array(args.dropFirst()))
case "dot": dotSubcommand(Array(args.dropFirst()))
case "scan": scanSubcommand(Array(args.dropFirst()))
case "fixture": fixtureSubcommand(Array(args.dropFirst()))
default: fail("未知子命令 \(subcommand)\n\(usage)")
}
