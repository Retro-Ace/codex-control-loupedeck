#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildRoot = path.join(projectRoot, "build");
const distRoot = path.join(projectRoot, "dist");
const profileBase = path.join(projectRoot, "src", "profile-base", "com.openai.codex");
const wheelProject = path.join(projectRoot, "src", "wheel-plugin", "CodexControlWheelPlugin.csproj");
const wheelRoot = path.dirname(wheelProject);
const version = "1.0.0";
const profileId = "C0D1472659FDA0816544EA590C12CDE3";
const deterministicTime = new Date("2026-01-01T00:00:00.000Z");
const dotnet = process.env.DOTNET || "dotnet";

const artifacts = {
  full: `Codex-Control-Loupedeck-CT-v${version}.LP4`,
  lite: `Codex-Control-Loupedeck-CT-Lite-v${version}.LP4`,
  plugin: `CodexControlWheel-v${version}.lplug4`,
  keys: "codex-keybindings.json",
  all: `Codex-Control-Loupedeck-CT-v${version}.zip`,
  sums: "SHA256SUMS.txt",
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    env: options.env ?? process.env,
    encoding: options.encoding ?? "utf8",
    stdio: options.stdio ?? "inherit",
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}.`);
  }
  return result.stdout ?? "";
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function normalizeTimes(root) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) normalizeTimes(fullPath);
    fs.utimesSync(fullPath, deterministicTime, deterministicTime);
  }
  fs.utimesSync(root, deterministicTime, deterministicTime);
}

function relativeFiles(root) {
  return fs.readdirSync(root, { recursive: true })
    .filter((entry) => typeof entry === "string" && fs.statSync(path.join(root, entry)).isFile())
    .sort();
}

function resetGeneratedDirectory(root) {
  fs.mkdirSync(root, { recursive: true });
  for (const entry of fs.readdirSync(root)) {
    if (entry === ".DS_Store") continue;
    fs.rmSync(path.join(root, entry), {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}

function profileDirectory(appRoot) {
  return path.join(appRoot, "Profiles", profileId);
}

function packageProfile(appRoot, destination, { lite }) {
  const staging = path.join(buildRoot, lite ? "lp4-lite" : "lp4-full");
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(path.join(staging, "metadata"), { recursive: true });
  fs.mkdirSync(path.join(staging, "ActionImages"), { recursive: true });

  const sourceProfile = profileDirectory(appRoot);
  fs.copyFileSync(path.join(appRoot, "ApplicationInfo.json"), path.join(staging, "ApplicationInfo.json"));
  fs.copyFileSync(path.join(sourceProfile, "ProfileInfo.json"), path.join(staging, "ProfileInfo.json"));
  fs.cpSync(path.join(sourceProfile, "ActionIcons"), path.join(staging, "ActionIcons"), { recursive: true });
  fs.cpSync(path.join(sourceProfile, "ActionColors"), path.join(staging, "ActionColors"), { recursive: true });

  const displayName = lite ? "Codex Control Lite" : "Codex Control";
  fs.writeFileSync(
    path.join(staging, "metadata", "LoupedeckPackage.yaml"),
    `type: Profile5\nname: ${profileId}\ndisplayName: ${displayName}\nversion: ${version}\ndescription: Seven-workspace Codex controller for macOS\nauthor: Retro-Ace\ncopyright: Copyright 2026 Retro-Ace\nlicense: MIT\nhomePageUrl: https://github.com/Retro-Ace/codex-control-loupedeck\nminimumLoupedeckVersion: 6.3\n`,
  );
  fs.writeFileSync(
    path.join(staging, "metadata", "AdvancedInfo.json"),
    `${JSON.stringify({ additionalPluginNames: lite ? [] : ["CodexControlWheel"] }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(staging, "metadata", "ProfilePreview.json"),
    `${JSON.stringify({ buttonPages: [], encoderPages: [] }, null, 2)}\n`,
  );

  normalizeTimes(staging);
  fs.rmSync(destination, { force: true });
  run("zip", ["-X", "-q", "-r", destination, "."], { cwd: staging });
}

function archiveEntries(archivePath) {
  return run("unzip", ["-Z1", archivePath], { stdio: "pipe" })
    .split(/\r?\n/)
    .filter(Boolean);
}

function requireArchiveEntries(archivePath, required, forbidden = []) {
  const entries = archiveEntries(archivePath);
  for (const expected of required) {
    if (!entries.some((entry) => entry === expected || entry.startsWith(`${expected}/`))) {
      throw new Error(`${path.basename(archivePath)} is missing ${expected}.`);
    }
  }
  for (const rejected of forbidden) {
    if (entries.some((entry) => rejected.test(entry))) {
      throw new Error(`${path.basename(archivePath)} contains forbidden content matching ${rejected}.`);
    }
  }
}

function writeChecksums(names) {
  const lines = names.map((name) => `${sha256(path.join(distRoot, name))}  ${name}`);
  fs.writeFileSync(path.join(distRoot, artifacts.sums), `${lines.join("\n")}\n`);
}

resetGeneratedDirectory(buildRoot);
resetGeneratedDirectory(distRoot);

run(process.execPath, ["tools/generate-icons.mjs"]);
run(process.execPath, ["tools/render-gallery.mjs"]);
run(process.execPath, ["tools/bootstrap-logi-sdk.mjs"]);
run(dotnet, ["build", wheelProject, "-c", "Release"]);

for (const fileName of fs.readdirSync(path.join(wheelRoot, "bin"))) {
  if (fileName.toLowerCase().endsWith(".pdb")) {
    fs.rmSync(path.join(wheelRoot, "bin", fileName));
  }
}

const fullApp = path.join(buildRoot, "full", "com.openai.codex");
const liteApp = path.join(buildRoot, "lite", "com.openai.codex");
run(process.execPath, [
  "tools/build-profile.mjs",
  "--source-app", profileBase,
  "--output-app", fullApp,
  "--wheel-mode", "plugin-wheel",
]);
run(process.execPath, [
  "tools/build-profile.mjs",
  "--source-app", profileBase,
  "--output-app", liteApp,
  "--wheel-mode", "generic-raster",
]);
run(process.execPath, [
  "tools/validate-profile.mjs",
  "--app", fullApp,
  "--wheel-mode", "plugin-wheel",
  "--baseline-app", profileBase,
]);
run(process.execPath, [
  "tools/validate-profile.mjs",
  "--app", liteApp,
  "--wheel-mode", "generic-raster",
  "--baseline-app", profileBase,
]);

packageProfile(fullApp, path.join(distRoot, artifacts.full), { lite: false });
packageProfile(liteApp, path.join(distRoot, artifacts.lite), { lite: true });

const toolDll = path.join(buildRoot, "logi-plugin-tool", "tools", "net8.0", "any", "LogiPluginTool.dll");
const pluginStaging = path.join(buildRoot, "wheel-plugin-package");
fs.mkdirSync(path.join(pluginStaging, "bin"), { recursive: true });
fs.cpSync(path.join(wheelRoot, "metadata"), path.join(pluginStaging, "metadata"), { recursive: true });
for (const fileName of fs.readdirSync(path.join(wheelRoot, "bin"))) {
  if (!fileName.toLowerCase().endsWith(".pdb")) {
    fs.copyFileSync(
      path.join(wheelRoot, "bin", fileName),
      path.join(pluginStaging, "bin", fileName),
    );
  }
}
const pluginPackage = path.join(distRoot, artifacts.plugin);
run(dotnet, [toolDll, "pack", pluginStaging, pluginPackage]);

const normalizedPlugin = path.join(buildRoot, "wheel-plugin-normalized");
const normalizedPluginArchive = path.join(buildRoot, "CodexControlWheel-normalized.lplug4");
fs.rmSync(normalizedPlugin, { recursive: true, force: true });
fs.rmSync(normalizedPluginArchive, { force: true });
fs.mkdirSync(normalizedPlugin, { recursive: true });
run("unzip", ["-q", pluginPackage, "-d", normalizedPlugin]);
normalizeTimes(normalizedPlugin);
run("zip", ["-X", "-q", normalizedPluginArchive, ...relativeFiles(normalizedPlugin)], {
  cwd: normalizedPlugin,
});
fs.renameSync(normalizedPluginArchive, pluginPackage);

run(dotnet, [toolDll, "verify", pluginPackage]);
fs.copyFileSync(path.join(projectRoot, "src", "codex-keybindings.json"), path.join(distRoot, artifacts.keys));

requireArchiveEntries(
  path.join(distRoot, artifacts.full),
  ["ApplicationInfo.json", "ProfileInfo.json", "ActionIcons", "ActionColors", "metadata/LoupedeckPackage.yaml"],
  [/\.pdb$/i, /PluginApi\.dll$/i, /\.DS_Store$/],
);
requireArchiveEntries(
  path.join(distRoot, artifacts.lite),
  ["ApplicationInfo.json", "ProfileInfo.json", "ActionIcons", "ActionColors", "metadata/LoupedeckPackage.yaml"],
  [/\.pdb$/i, /PluginApi\.dll$/i, /\.DS_Store$/],
);
requireArchiveEntries(
  path.join(distRoot, artifacts.plugin),
  ["bin/CodexControlWheelPlugin.dll", "metadata/LoupedeckPackage.yaml"],
  [/\.pdb$/i, /PluginApi\.dll$/i, /\.DS_Store$/],
);

writeChecksums([artifacts.full, artifacts.lite, artifacts.plugin, artifacts.keys]);

const allInOne = path.join(buildRoot, "all-in-one");
fs.mkdirSync(allInOne, { recursive: true });
for (const name of [artifacts.full, artifacts.lite, artifacts.plugin, artifacts.keys, artifacts.sums]) {
  fs.copyFileSync(path.join(distRoot, name), path.join(allInOne, name));
}
fs.copyFileSync(path.join(projectRoot, "docs", "INSTALL.md"), path.join(allInOne, "INSTALL.md"));
fs.copyFileSync(path.join(projectRoot, "LICENSE"), path.join(allInOne, "LICENSE"));
normalizeTimes(allInOne);
run("zip", ["-X", "-q", "-r", path.join(distRoot, artifacts.all), "."], { cwd: allInOne });
writeChecksums([artifacts.all, artifacts.full, artifacts.lite, artifacts.plugin, artifacts.keys]);

requireArchiveEntries(
  path.join(distRoot, artifacts.all),
  [artifacts.full, artifacts.lite, artifacts.plugin, artifacts.keys, artifacts.sums, "INSTALL.md", "LICENSE"],
  [/\.pdb$/i, /PluginApi\.dll$/i, /\.DS_Store$/],
);

for (const filePath of fs.readdirSync(projectRoot, { recursive: true })) {
  if (typeof filePath !== "string" || !/\.(?:json|svg)$/i.test(filePath)) continue;
  const absolute = path.join(projectRoot, filePath);
  if (filePath.toLowerCase().endsWith(".json")) JSON.parse(fs.readFileSync(absolute, "utf8"));
  else run("xmllint", ["--noout", absolute]);
}

run(process.execPath, ["tools/check-keybindings.mjs", "--file", "src/codex-keybindings.json"]);
run(process.execPath, ["tools/privacy-audit.mjs"]);

console.log("Release artifacts:");
for (const name of Object.values(artifacts)) {
  const fullPath = path.join(distRoot, name);
  console.log(`- ${name} (${fs.statSync(fullPath).size} bytes)`);
}
