import CoreGraphics
import Foundation
import ImageIO

var failed = false

for path in CommandLine.arguments.dropFirst() {
    let url = URL(fileURLWithPath: path)
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        fputs("\(path): 无法读取图片\n", stderr)
        failed = true
        continue
    }

    let width = image.width
    let height = image.height
    guard let context = CGContext(
        data: nil,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: width * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ), let data = context.data else {
        fputs("\(path): 无法创建像素缓冲区\n", stderr)
        failed = true
        continue
    }

    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    let pixels = data.bindMemory(to: UInt8.self, capacity: width * height * 4)
    let step = max(1, width * height / 200_000)
    var sumR = 0
    var sumG = 0
    var sumB = 0
    var count = 0

    for index in stride(from: 0, to: width * height * 4, by: 4 * step) {
        sumR += Int(pixels[index])
        sumG += Int(pixels[index + 1])
        sumB += Int(pixels[index + 2])
        count += 1
    }

    guard count > 0 else {
        fputs("\(path): 没有可采样像素\n", stderr)
        failed = true
        continue
    }
    print("\(path): avg RGB = (\(sumR / count), \(sumG / count), \(sumB / count))")
}

if CommandLine.arguments.count < 2 {
    fputs("用法: swift avg_color.swift <image_path> ...\n", stderr)
    exit(1)
}

exit(failed ? 1 : 0)
