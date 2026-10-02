// 生成带角标的 iOS dev 图标栅格内核（被 make_dev_icon.mjs 调用）。
// 用法: swift dev_icon.swift <输入.png> <输出.png> [角标文字] [capsule|dot]
// 角标承自已退役的 make_dev_icon.py（git 39b3697）：左上角贴边、约占方形 1/9、仅右下角圆角——2026-08-17 用户要求

import AppKit

let args = CommandLine.arguments
guard args.count >= 3, args.count <= 5 else {
    print("用法: swift dev_icon.swift <输入.png> <输出.png> [角标文字, 默认 dev] [capsule|dot, 默认 capsule]")
    exit(1)
}
let inputPath = args[1]
let outputPath = args[2]
let label = args.count > 3 ? args[3] : "dev"
let style = args.count > 4 ? args[4] : "capsule"

let canvasSize = 1024
// 角标贴住图标上/左边缘（iOS 系统裁圆角时自然留出安全边）
let margin: CGFloat = 0
// 面积 ≈ 1024²/9（"约占方形 1/9"）
let badgeW: CGFloat = 400
let badgeH: CGFloat = 290
let dotR: CGFloat = 64

guard let image = NSImage(contentsOfFile: inputPath) else {
    fputs("错误: 无法读取输入图片 \(inputPath)\n", stderr); exit(1)
}

// 源图透明通道检查（App Store 图标不允许透明；这里仅警告，黑底兜底）
if let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) {
    let alphaInfo = cgImage.alphaInfo
    let byteIndex: Int?
    switch alphaInfo {
    case .premultipliedLast, .last, .noneSkipLast: byteIndex = 3
    case .premultipliedFirst, .first, .noneSkipFirst: byteIndex = 0
    default: byteIndex = nil
    }
    if let idx = byteIndex, let data = cgImage.dataProvider?.data, let ptr = CFDataGetBytePtr(data) {
        let bpr = cgImage.bytesPerRow, bpp = cgImage.bitsPerPixel / 8
        var minAlpha = 255
        for row in 0..<cgImage.height {
            let rowStart = row * bpr
            var col = rowStart + idx
            for _ in 0..<cgImage.width { minAlpha = min(minAlpha, Int(ptr[col])); col += bpp }
        }
        if minAlpha < 255 {
            print("警告: 源图含透明通道（App Store 图标不允许透明），透明区域将以黑底兜底")
        }
    }
}

guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: canvasSize, pixelsHigh: canvasSize,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
) else { fputs("错误: 无法创建画布\n", stderr); exit(1) }
rep.size = NSSize(width: canvasSize, height: canvasSize)

guard let ctx = NSGraphicsContext(bitmapImageRep: rep) else {
    fputs("错误: 无法创建绘图上下文\n", stderr); exit(1)
}
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = ctx

// 黑底画布（dev 图不进 App Store；正式图若有透明区域以黑底兜底）
NSColor.black.setFill()
NSRect(x: 0, y: 0, width: canvasSize, height: canvasSize).fill()

// 源图标铺满画布（AppKit 坐标系 y 轴向上，视觉位置由 rect 换算）
ctx.imageInterpolation = NSImageInterpolation.high
image.size = NSSize(width: canvasSize, height: canvasSize)
image.draw(in: NSRect(x: 0, y: 0, width: canvasSize, height: canvasSize))

if style == "dot" {
    // 左上角橙色圆点（呼应 TestFlight 橙 #FF9500）
    NSColor(red: 1, green: 149/255, blue: 0, alpha: 1).setFill()
    let rect = NSRect(x: margin, y: CGFloat(canvasSize) - margin - 2 * dotR, width: 2 * dotR, height: 2 * dotR)
    NSBezierPath(ovalIn: rect).fill()
} else {
    let badgeX = margin
    let badgeY = CGFloat(canvasSize) - margin - badgeH   // 视觉左上角
    let badge = NSRect(x: badgeX, y: badgeY, width: badgeW, height: badgeH)
    // 白色标签，仅视觉右下角圆角（半径 = 高/2）
    let cornerRadius = badgeH / 2
    let path = NSBezierPath()
    path.move(to: NSPoint(x: badge.minX, y: badge.minY))
    path.line(to: NSPoint(x: badge.maxX - cornerRadius, y: badge.minY))
    path.appendArc(from: NSPoint(x: badge.maxX - cornerRadius, y: badge.minY),
                   to: NSPoint(x: badge.maxX, y: badge.minY + cornerRadius),
                   radius: cornerRadius)
    path.line(to: NSPoint(x: badge.maxX, y: badge.maxY))
    path.line(to: NSPoint(x: badge.minX, y: badge.maxY))
    path.close()
    NSColor(red: 250/255, green: 250/255, blue: 250/255, alpha: 1).setFill()
    path.fill()

    // 字号从大到小收缩直到能放进胶囊（大胶囊配大字号）
    var chosen: (font: NSFont, width: CGFloat)?
    for size in stride(from: 150, through: 72, by: -2) {
        let font = NSFont.boldSystemFont(ofSize: CGFloat(size))
        let attrs: [NSAttributedString.Key: Any] = [.font: font]
        let width = NSAttributedString(string: label, attributes: attrs).size().width
        if width <= badgeW * 0.6 { chosen = (font, width); break }
    }
    guard let (font, textW) = chosen else { fputs("错误: 文字放不进胶囊\n", stderr); exit(1) }
    let attr = NSAttributedString(
        string: label,
        attributes: [.font: font, .foregroundColor: NSColor(red: 20/255, green: 20/255, blue: 20/255, alpha: 1)]
    )
    let textH = attr.size().height
    attr.draw(at: NSPoint(x: badgeX + (badgeW - textW) / 2, y: badgeY + (badgeH - textH) / 2))
}

NSGraphicsContext.restoreGraphicsState()

guard let png = rep.representation(using: NSBitmapImageRep.FileType.png, properties: [:]) else {
    fputs("错误: PNG 编码失败\n", stderr); exit(1)
}
do { try png.write(to: URL(fileURLWithPath: outputPath)) } catch {
    fputs("错误: 写出失败 \(error)\n", stderr); exit(1)
}
print("已生成 \(outputPath)")
