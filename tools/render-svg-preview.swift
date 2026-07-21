#!/usr/bin/env swift

import AppKit
import WebKit

guard CommandLine.arguments.count == 3 || CommandLine.arguments.count == 5 else {
    fputs("Usage: swift render-svg-preview.swift <input.svg> <output.png> [width height]\n", stderr)
    exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1]).standardizedFileURL
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2]).standardizedFileURL
let outputWidth = CommandLine.arguments.count == 5 ? Int(CommandLine.arguments[3]) ?? 0 : 1920
let outputHeight = CommandLine.arguments.count == 5 ? Int(CommandLine.arguments[4]) ?? 0 : 1080

guard outputWidth > 0, outputHeight > 0 else {
    fputs("Width and height must be positive integers.\n", stderr)
    exit(2)
}

guard FileManager.default.fileExists(atPath: inputURL.path) else {
    fputs("Input SVG does not exist: \(inputURL.path)\n", stderr)
    exit(2)
}

final class SnapshotRenderer: NSObject, WKNavigationDelegate {
    let outputURL: URL
    let outputWidth: Int
    let outputHeight: Int

    init(outputURL: URL, outputWidth: Int, outputHeight: Int) {
        self.outputURL = outputURL
        self.outputWidth = outputWidth
        self.outputHeight = outputHeight
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            let configuration = WKSnapshotConfiguration()
            configuration.rect = NSRect(x: 0, y: 0, width: self.outputWidth, height: self.outputHeight)
            configuration.snapshotWidth = NSNumber(value: self.outputWidth)
            webView.takeSnapshot(with: configuration) { image, error in
                if let error {
                    fputs("Snapshot failed: \(error.localizedDescription)\n", stderr)
                    exit(1)
                }
                guard
                    let image,
                    let tiff = image.tiffRepresentation,
                    let bitmap = NSBitmapImageRep(data: tiff),
                    let png = bitmap.representation(using: .png, properties: [:])
                else {
                    fputs("Could not encode WebKit snapshot as PNG.\n", stderr)
                    exit(1)
                }
                do {
                    try FileManager.default.createDirectory(
                        at: self.outputURL.deletingLastPathComponent(),
                        withIntermediateDirectories: true
                    )
                    try png.write(to: self.outputURL, options: .atomic)
                    CFRunLoopStop(CFRunLoopGetMain())
                } catch {
                    fputs("Could not write PNG: \(error.localizedDescription)\n", stderr)
                    exit(1)
                }
            }
        }
    }

    func webView(
        _ webView: WKWebView,
        didFail navigation: WKNavigation!,
        withError error: Error
    ) {
        fputs("SVG load failed: \(error.localizedDescription)\n", stderr)
        exit(1)
    }
}

let configuration = WKWebViewConfiguration()
configuration.websiteDataStore = .nonPersistent()
let webView = WKWebView(
    frame: NSRect(x: 0, y: 0, width: outputWidth, height: outputHeight),
    configuration: configuration
)
let renderer = SnapshotRenderer(
    outputURL: outputURL,
    outputWidth: outputWidth,
    outputHeight: outputHeight
)
webView.navigationDelegate = renderer
webView.setValue(false, forKey: "drawsBackground")
webView.loadFileURL(inputURL, allowingReadAccessTo: inputURL.deletingLastPathComponent())
CFRunLoopRun()

print("Rendered \(inputURL.lastPathComponent) -> \(outputURL.path)")
