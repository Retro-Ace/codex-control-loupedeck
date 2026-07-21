#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildRoot = path.join(projectRoot, "build");
const packageVersion = "6.1.4.22672";
const packageName = `logiplugintool.${packageVersion}.nupkg`;
const packageUrl = `https://api.nuget.org/v3-flatcontainer/logiplugintool/${packageVersion}/${packageName}`;
const expectedSha256 = "b2f77c7abf767af2aea46a3bf52c126c1a1424dc69420bbbbd931f882a248545";
const cachedPackage = path.join(buildRoot, packageName);
const extractedRoot = path.join(buildRoot, "logi-plugin-tool");
const toolRoot = path.join(extractedRoot, "tools", "net8.0", "any");
const sdkRoot = path.join(buildRoot, "sdk");
const sdkTarget = path.join(sdkRoot, "PluginApi.dll");

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

async function download(url, destination) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`SDK download failed: ${response.status} ${response.statusText}`);
  }
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

fs.mkdirSync(buildRoot, { recursive: true });

const suppliedPackage = process.env.LOGI_PLUGIN_TOOL_NUPKG;
if (suppliedPackage) {
  fs.copyFileSync(path.resolve(suppliedPackage), cachedPackage);
} else if (!fs.existsSync(cachedPackage)) {
  console.log(`Downloading Logitech LogiPluginTool ${packageVersion} from NuGet...`);
  await download(packageUrl, cachedPackage);
}

const actualSha256 = sha256(cachedPackage);
if (actualSha256 !== expectedSha256) {
  throw new Error(
    `Unexpected LogiPluginTool SHA-256: ${actualSha256}. Expected ${expectedSha256}.`,
  );
}

fs.rmSync(extractedRoot, { recursive: true, force: true });
fs.mkdirSync(extractedRoot, { recursive: true });
const unzip = spawnSync("unzip", ["-q", cachedPackage, "-d", extractedRoot], {
  stdio: "inherit",
});
if (unzip.status !== 0) {
  throw new Error("Could not extract the official LogiPluginTool package.");
}

const sdkSource = path.join(toolRoot, "PluginApi.dll");
if (!fs.existsSync(sdkSource)) {
  throw new Error(`PluginApi.dll is missing from ${packageName}.`);
}
fs.mkdirSync(sdkRoot, { recursive: true });
fs.copyFileSync(sdkSource, sdkTarget);

console.log(`Logitech SDK ready: ${path.relative(projectRoot, sdkTarget)}`);
console.log(`LogiPluginTool ready: ${path.relative(projectRoot, path.join(toolRoot, "LogiPluginTool.dll"))}`);
