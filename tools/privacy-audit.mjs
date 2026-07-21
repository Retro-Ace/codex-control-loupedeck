#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "build",
  "bin",
  "obj",
  "logi-plugin-tool",
  "sdk",
]);
const forbidden = [
  { label: "personal name", pattern: /anthony\s+larosa|tony\s+larosa/gi },
  { label: "local user path", pattern: new RegExp(["/", "Users", "/"].join(""), "g") },
  {
    label: "private workspace name",
    pattern: new RegExp(["Codex", "Computer Operator"].join(" - "), "gi"),
  },
  { label: "private controller output", pattern: /Loupedeck Codex Control\/backups/gi },
  { label: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/g },
  { label: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/g },
  { label: "generic private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

function walk(directory, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, result);
    else result.push(fullPath);
  }
  return result;
}

function inspectBuffer(buffer, origin, failures) {
  const text = buffer.toString("latin1");
  for (const check of forbidden) {
    check.pattern.lastIndex = 0;
    if (check.pattern.test(text)) failures.push(`${check.label}: ${origin}`);
  }
}

function inspectArchive(archivePath, failures) {
  const list = spawnSync("unzip", ["-Z1", archivePath], { encoding: "utf8" });
  if (list.status !== 0) {
    failures.push(`unreadable archive: ${path.relative(projectRoot, archivePath)}`);
    return;
  }
  const entries = list.stdout.split(/\r?\n/).filter((entry) => entry && !entry.endsWith("/"));
  for (const entry of entries) {
    const extracted = spawnSync("unzip", ["-p", archivePath, entry], {
      encoding: null,
      maxBuffer: 64 * 1024 * 1024,
    });
    if (extracted.status === 0) {
      inspectBuffer(extracted.stdout, `${path.relative(projectRoot, archivePath)}::${entry}`, failures);
    }
  }
}

const failures = [];
const files = walk(projectRoot);
for (const filePath of files) {
  const relativePath = path.relative(projectRoot, filePath);
  inspectBuffer(fs.readFileSync(filePath), relativePath, failures);
  if (/\.(?:zip|lp4|lplug4)$/i.test(filePath)) inspectArchive(filePath, failures);
}

if (failures.length) {
  console.error("Privacy audit failed:");
  for (const failure of [...new Set(failures)].sort()) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Privacy audit passed across ${files.length} files, including compressed release contents.`);
