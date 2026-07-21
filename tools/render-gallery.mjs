#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(projectRoot, "docs", "svg");
const outputDir = path.join(projectRoot, "docs", "images");
const buildDir = path.join(projectRoot, "build");
const rendererSource = path.join(projectRoot, "tools", "render-svg-preview.swift");
const renderer = path.join(buildDir, "render-svg-preview");
const moduleCache = path.join(buildDir, "swift-module-cache");

fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(moduleCache, { recursive: true });

const compile = spawnSync("swiftc", [rendererSource, "-o", renderer], {
  stdio: "inherit",
  env: {
    ...process.env,
    CLANG_MODULE_CACHE_PATH: moduleCache,
    SWIFT_MODULE_CACHE_PATH: moduleCache,
  },
});
if (compile.status !== 0) throw new Error("Could not compile the SVG preview renderer.");

const svgFiles = fs.readdirSync(sourceDir).filter((name) => name.endsWith(".svg")).sort();
for (const name of svgFiles) {
  const isSocial = name === "github-social-preview.svg";
  const width = isSocial ? "1280" : "1920";
  const height = isSocial ? "640" : "1080";
  const outputName = name.replace(/\.svg$/, ".png");
  const render = spawnSync(
    renderer,
    [path.join(sourceDir, name), path.join(outputDir, outputName), width, height],
    { stdio: "inherit" },
  );
  if (render.status !== 0) throw new Error(`Could not render ${name}.`);
  const resize = spawnSync(
    "sips",
    ["-z", height, width, path.join(outputDir, outputName)],
    { stdio: "ignore" },
  );
  if (resize.status !== 0) throw new Error(`Could not resize ${outputName}.`);
}

console.log(`Rendered ${svgFiles.length} web images in ${path.relative(projectRoot, outputDir)}`);
