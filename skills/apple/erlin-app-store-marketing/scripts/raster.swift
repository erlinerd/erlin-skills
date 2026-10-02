// erlin-app-store-marketing 栅格内核（被 compose.mjs / showcase.mjs / generate_frame.mjs 调用）。
// 用法:
//   swift raster.swift measure            行协议：每行 {"text","size","weight"} → {"w","capH"}
//   swift raster.swift compose            stdin JSON：画布 + 文字 + 屏幕截图 + 设备框
//   swift raster.swift showcase           stdin JSON：白底多图拼接 + 可选 GitHub 链接
//   swift raster.swift frame <输出.png>    生成 iPhone 设备框模板（常量与原 generate_frame.py 一致）
// 零 npm 依赖，替代原 PIL 脚本。JSON 里的坐标均为视觉左上原点（y 向下），内核统一换算到 CG 左下原点。

import AppKit
import CoreText
import ImageIO

// MARK: 字体（SF Pro Display Black 优先，回退 SFNS.ttf 变量字体拉 'wght'=900；regular 同理）
// 本机已无 /Library/Fonts/SF-Pro-Display-*.otf，实际走 SFNS 回退；
// 注意不能用 CTFontCreateWithName("SF Pro Display")——在本机 SDK 上会解析到 Helvetica。

var fontCache: [String: CTFont] = [:]

func fontDescriptorFromFile(_ path: String) -> CTFontDescriptor? {
    guard FileManager.default.fileExists(atPath: path) else { return nil }
    return CTFontDescriptorCreateWithAttributes([
        kCTFontURLAttribute: URL(fileURLWithPath: path),
    ] as CFDictionary)
}

func fontFor(weight: String, size: CGFloat) -> CTFont {
    let cacheKey = "\(weight)-\(Int(size))"
    if let cached = fontCache[cacheKey] { return cached }
    let primary = weight == "regular"
        ? "/Library/Fonts/SF-Pro-Display-Regular.otf"
        : "/Library/Fonts/SF-Pro-Display-Black.otf"
    let loaded: CTFont
    if let primaryDesc = fontDescriptorFromFile(primary) {
        loaded = CTFontCreateWithFontDescriptor(primaryDesc, size, nil)
    } else if let sfnsDesc = fontDescriptorFromFile("/System/Library/Fonts/SFNS.ttf") {
        let heavy = weight == "regular" ? 400 : 900
        // 0x7767_6874 = 'wght' 轴标签；SFNS 变量字体按字重取面
        let variation = [kCTFontVariationAttribute: [0x7767_6874: heavy] as CFDictionary] as CFDictionary
        let weightedDesc = CTFontDescriptorCreateCopyWithAttributes(sfnsDesc, variation)
        loaded = CTFontCreateWithFontDescriptor(weightedDesc, size, nil)
    } else {
        loaded = CTFontCreateWithName("Helvetica" as CFString, size, nil)
    }
    fontCache[cacheKey] = loaded
    return loaded
}

func textLine(text: String, font: CTFont) -> CTLine {
    let attributed = NSAttributedString(
        string: text,
        attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font]
    )
    return CTLineCreateWithAttributedString(attributed)
}

func textWidth(text: String, font: CTFont) -> CGFloat {
    CTLineGetTypographicBounds(textLine(text: text, font: font), nil, nil, nil)
}

// MARK: 画布 / 图片 / 坐标

func makeCanvas(width: Int, height: Int, opaque: Bool) -> CGContext {
    let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
    let alphaMode: CGImageAlphaInfo = opaque ? .noneSkipLast : .premultipliedLast
    return CGContext(
        data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
        space: colorSpace, bitmapInfo: alphaMode.rawValue
    )!
}

func savePNG(_ context: CGContext, path: String) {
    guard let image = context.makeImage() else {
        fputs("错误: PNG 编码失败\n", stderr); exit(1)
    }
    let rep = NSBitmapImageRep(cgImage: image)
    guard let png = rep.representation(using: NSBitmapImageRep.FileType.png, properties: [:]) else {
        fputs("错误: PNG 编码失败\n", stderr); exit(1)
    }
    do { try png.write(to: URL(fileURLWithPath: path)) } catch {
        fputs("错误: 写出失败 \(error)\n", stderr); exit(1)
    }
}

func readStdinJSON() -> [String: Any] {
    let raw = FileHandle.standardInput.readDataToEndOfFile()
    guard let parsed = try? JSONSerialization.jsonObject(with: raw) as? [String: Any] else {
        fputs("错误: stdin JSON 解析失败\n", stderr); exit(1)
    }
    return parsed
}

func cgImageFromPath(_ path: String) -> CGImage {
    guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
    else { fputs("错误: 无法读取图片 \(path)\n", stderr); exit(1) }
    return image
}

/// 视觉坐标（左上原点）→ CG 坐标（左下原点）
func cgRect(posX: CGFloat, yTop: CGFloat, rectWidth: CGFloat, rectHeight: CGFloat, canvasH: CGFloat) -> CGRect {
    CGRect(x: posX, y: canvasH - yTop - rectHeight, width: rectWidth, height: rectHeight)
}

// MARK: measure 行协议（文字宽度 + 大写字高；布局算法在 node 侧）

func runMeasure() {
    while let line = readLine() {
        guard let lineData = line.data(using: .utf8),
              let request = try? JSONSerialization.jsonObject(with: lineData) as? [String: Any],
              let text = request["text"] as? String,
              let size = request["size"] as? Double,
              let weight = request["weight"] as? String
        else {
            print(#"{"w":0,"capH":0}"#)
            fflush(stdout)
            continue
        }
        let font = fontFor(weight: weight, size: CGFloat(size))
        let response: [String: CGFloat] = ["w": textWidth(text: text, font: font), "capH": CTFontGetCapHeight(font)]
        let responseData: Data
        if let encoded = try? JSONSerialization.data(withJSONObject: response) {
            responseData = encoded
        } else {
            responseData = Data(#"{"w":0,"capH":0}"#.utf8)
        }
        print(String(data: responseData, encoding: .utf8)!)
        fflush(stdout)
    }
}

/// 视觉水平居中画一行字（entry 为 node 侧 JSON 文字条目）。
/// anchor "mt"=墨迹顶对齐 y；"mm"=墨迹中心对齐 y。
func drawCenteredText(_ context: CGContext, canvasW: Int, canvasH: Int, entry: [String: Any]) {
    guard let text = entry["text"] as? String,
          let size = entry["size"] as? Double,
          let topY = entry["y"] as? Double,
          let anchor = entry["anchor"] as? String,
          let colorRgb = entry["colorRgb"] as? [Int]
    else { fputs("错误: 文字条目字段缺失\n", stderr); exit(1) }
    let font = fontFor(weight: entry["weight"] as? String ?? "black", size: CGFloat(size))
    let capHeight = CTFontGetCapHeight(font)
    let baselineY: CGFloat = anchor == "mm"
        ? CGFloat(canvasH) - CGFloat(topY) - capHeight / 2
        : CGFloat(canvasH) - CGFloat(topY) - capHeight
    // 这个 SDK 的 CTLineDraw 不取 context 填充色，颜色必须走属性
    let foreground = CGColor(
        srgbRed: CGFloat(colorRgb[0]) / 255, green: CGFloat(colorRgb[1]) / 255,
        blue: CGFloat(colorRgb[2]) / 255, alpha: 1
    )
    let attributed = NSAttributedString(
        string: text,
        attributes: [
            NSAttributedString.Key(kCTFontAttributeName as String): font,
            NSAttributedString.Key(kCTForegroundColorAttributeName as String): foreground,
        ]
    )
    let line = CTLineCreateWithAttributedString(attributed)
    let lineW = CTLineGetTypographicBounds(line, nil, nil, nil)
    context.textMatrix = CGAffineTransform.identity
    context.textPosition = CGPoint(x: (CGFloat(canvasW) - lineW) / 2, y: baselineY)
    CTLineDraw(line, context)
}

// MARK: compose（1290×2796 App Store 截图成图）

func runCompose() {
    let layout = readStdinJSON()
    guard
        let canvasW = layout["canvasW"] as? Int,
        let canvasH = layout["canvasH"] as? Int,
        let bgRgb = layout["bgRgb"] as? [Int],
        let texts = layout["texts"] as? [[String: Any]],
        let outPath = layout["out"] as? String
    else { fputs("错误: compose JSON 字段缺失\n", stderr); exit(1) }
    let context = makeCanvas(width: canvasW, height: canvasH, opaque: true)

    // 背景底色
    context.setFillColor(CGColor(
        srgbRed: CGFloat(bgRgb[0]) / 255, green: CGFloat(bgRgb[1]) / 255,
        blue: CGFloat(bgRgb[2]) / 255, alpha: 1
    ))
    context.fill(CGRect(x: 0, y: 0, width: canvasW, height: canvasH))

    // 标题/描述文字
    for entry in texts {
        drawCenteredText(context, canvasW: canvasW, canvasH: canvasH, entry: entry)
    }

    // 屏幕区：圆角矩形黑底 + 截图（等宽缩放贴入，超出画布底部裁掉）
    if let screen = layout["screen"] as? [String: Any],
       let screenX = screen["x"] as? Int,
       let screenY = screen["y"] as? Int,
       let screenW = screen["w"] as? Int,
       let screenH = screen["h"] as? Int,
       let screenR = screen["r"] as? Int,
       let shot = screen["shot"] as? [String: Any],
       let shotPath = shot["path"] as? String,
       let shotH = shot["h"] as? Int {
        let screenRect = cgRect(
            posX: CGFloat(screenX), yTop: CGFloat(screenY),
            rectWidth: CGFloat(screenW), rectHeight: CGFloat(screenH), canvasH: CGFloat(canvasH)
        )
        context.saveGState()
        context.addPath(CGPath(
            roundedRect: screenRect,
            cornerWidth: CGFloat(screenR), cornerHeight: CGFloat(screenR), transform: nil
        ))
        context.clip()
        context.setFillColor(CGColor(srgbRed: 0, green: 0, blue: 0, alpha: 1))
        context.fill(screenRect)
        context.interpolationQuality = .high
        let shotRect = cgRect(
            posX: CGFloat(screenX), yTop: CGFloat(screenY),
            rectWidth: CGFloat(screenW), rectHeight: CGFloat(shotH), canvasH: CGFloat(canvasH)
        )
        context.draw(cgImageFromPath(shotPath), in: shotRect)
        context.restoreGState()
    }

    // 设备框模板贴到画布（可越出画布底部，天然被裁掉）
    if let frame = layout["frame"] as? [String: Any],
       let frameX = frame["x"] as? Int,
       let frameY = frame["y"] as? Int,
       let frameW = frame["w"] as? Int,
       let frameH = frame["h"] as? Int,
       let framePath = frame["path"] as? String {
        let frameRect = cgRect(
            posX: CGFloat(frameX), yTop: CGFloat(frameY),
            rectWidth: CGFloat(frameW), rectHeight: CGFloat(frameH), canvasH: CGFloat(canvasH)
        )
        context.draw(cgImageFromPath(framePath), in: frameRect)
    }

    savePNG(context, path: outPath)
}

// MARK: showcase（白底多图拼接 + 可选 GitHub 链接）

func runShowcase() {
    let layout = readStdinJSON()
    guard
        let canvasW = layout["canvasW"] as? Int,
        let canvasH = layout["canvasH"] as? Int,
        let shots = layout["shots"] as? [[String: Any]],
        let outPath = layout["out"] as? String
    else { fputs("错误: showcase JSON 字段缺失\n", stderr); exit(1) }
    let context = makeCanvas(width: canvasW, height: canvasH, opaque: true)
    context.setFillColor(CGColor(srgbRed: 1, green: 1, blue: 1, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: canvasW, height: canvasH))

    let padTop = CGFloat(layout["padTop"] as? Int ?? 60)
    let targetH = CGFloat(layout["targetH"] as? Int ?? 800)
    context.interpolationQuality = .high
    for shot in shots {
        guard let shotPath = shot["path"] as? String,
              let posX = shot["x"] as? Int,
              let shotW = shot["w"] as? Int
        else { fputs("错误: shots 条目字段缺失\n", stderr); exit(1) }
        let shotRect = cgRect(
            posX: CGFloat(posX), yTop: padTop,
            rectWidth: CGFloat(shotW), rectHeight: targetH, canvasH: CGFloat(canvasH)
        )
        context.draw(cgImageFromPath(shotPath), in: shotRect)
    }

    // GitHub 链接：墨迹中心对齐给定 y（对应 python 的 anchor="mm"）
    if var github = layout["github"] as? [String: Any], github["anchor"] == nil {
        github["anchor"] = "mm"
        drawCenteredText(context, canvasW: canvasW, canvasH: canvasH, entry: github)
    } else if let github = layout["github"] as? [String: Any] {
        drawCenteredText(context, canvasW: canvasW, canvasH: canvasH, entry: github)
    }

    savePNG(context, path: outPath)
}

// MARK: frame（iPhone 设备框模板，带透明屏幕开孔）

func runFrame(outPath: String) {
    let deviceW = 1030
    let deviceH = 2800
    let deviceCorner: CGFloat = 77
    let screenCorner: CGFloat = 62
    let bezel = 15
    let islandW = 130
    let islandH = 38
    let islandTop = 14
    let context = makeCanvas(width: deviceW, height: deviceH, opaque: false)
    let canvasHCGFloat = CGFloat(deviceH)

    func rectFromTop(_ posX: CGFloat, _ yTop: CGFloat, _ rectW: CGFloat, _ rectH: CGFloat) -> CGRect {
        cgRect(posX: posX, yTop: yTop, rectWidth: rectW, rectHeight: rectH, canvasH: canvasHCGFloat)
    }
    func roundedFill(_ rect: CGRect, _ radius: CGFloat, _ color: CGColor) {
        context.setFillColor(color)
        context.addPath(CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil))
        context.fillPath()
    }

    // 机身（深灰外框、更暗内层）
    let bodyColor = CGColor(srgbRed: 30/255, green: 30/255, blue: 30/255, alpha: 1)
    let innerColor = CGColor(srgbRed: 20/255, green: 20/255, blue: 20/255, alpha: 1)
    roundedFill(rectFromTop(0, 0, CGFloat(deviceW - 1), CGFloat(deviceH - 1)), deviceCorner, bodyColor)
    roundedFill(rectFromTop(1, 1, CGFloat(deviceW - 2), CGFloat(deviceH - 2)), deviceCorner - 1, innerColor)

    // 屏幕开孔（透明圆角矩形）
    context.saveGState()
    let screenRect = rectFromTop(
        CGFloat(bezel), CGFloat(bezel),
        CGFloat(deviceW - 2 * bezel), CGFloat(deviceH - 2 * bezel)
    )
    context.addPath(CGPath(
        roundedRect: screenRect,
        cornerWidth: screenCorner, cornerHeight: screenCorner, transform: nil
    ))
    context.clip()
    context.clear(screenRect.insetBy(dx: -2, dy: -2))
    context.restoreGState()

    // 灵动岛
    let islandRect = rectFromTop(
        CGFloat((deviceW - islandW) / 2), CGFloat(bezel + islandTop),
        CGFloat(islandW), CGFloat(islandH)
    )
    roundedFill(islandRect, CGFloat(islandH / 2), CGColor(srgbRed: 0, green: 0, blue: 0, alpha: 1))

    // 侧键（坐标继承 python 版；电源键 x∈[1030,1034]、左侧三键 x∈[-4,0]，均整体落在 1030 宽画布之外，实际不渲染——python 版 PIL 同样画不到，属继承的既有行为）
    let buttonColor = CGColor(srgbRed: 25/255, green: 25/255, blue: 25/255, alpha: 1)
    roundedFill(rectFromTop(CGFloat(deviceW), 340, 4, 120), 2, buttonColor)   // 电源键（右侧）
    roundedFill(rectFromTop(-4, 280, 4, 80), 2, buttonColor)                  // 音量上（左侧）
    roundedFill(rectFromTop(-4, 380, 4, 80), 2, buttonColor)                  // 音量下（左侧）
    roundedFill(rectFromTop(-4, 180, 4, 40), 2, buttonColor)                  // 静音键（左侧）

    savePNG(context, path: outPath)
}

// MARK: 入口

let mode = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : ""
switch mode {
case "measure":
    runMeasure()
case "compose":
    runCompose()
case "showcase":
    runShowcase()
case "frame":
    guard CommandLine.arguments.count > 2 else {
        fputs("错误: frame 需要输出路径\n", stderr); exit(1)
    }
    runFrame(outPath: CommandLine.arguments[2])
default:
    fputs("用法: swift raster.swift <measure|compose|showcase|frame <输出.png>>\n", stderr)
    exit(1)
}
