import AppKit
import Foundation
import Vision

var failed = false

for path in CommandLine.arguments.dropFirst() {
    guard let image = NSImage(contentsOfFile: path),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        fputs("\(path): 无法读取图片\n", stderr)
        failed = true
        continue
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["zh-Hans", "zh-Hant", "en-US"]
    request.usesLanguageCorrection = false

    do {
        try VNImageRequestHandler(cgImage: cgImage, options: [:]).perform([request])
    } catch {
        fputs("\(path): OCR 执行失败: \(error)\n", stderr)
        failed = true
        continue
    }

    let lines = (request.results ?? []).compactMap { observation -> String? in
        guard let text = observation.topCandidates(1).first?.string.trimmingCharacters(in: .whitespaces),
              !text.isEmpty else { return nil }
        let box = observation.boundingBox
        return "\(text) @(\(Int(box.midX * 100)),\(Int((1 - box.midY) * 100)))"
    }
    if lines.isEmpty {
        fputs("\(path): OCR 未识别到文字\n", stderr)
        failed = true
    } else {
        print("\((path as NSString).lastPathComponent): \(lines.joined(separator: " | "))")
    }
}

if CommandLine.arguments.count < 2 {
    fputs("用法: swift ocr_screens.swift <image_path> ...\n", stderr)
    exit(1)
}

exit(failed ? 1 : 0)
