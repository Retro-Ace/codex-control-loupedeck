#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const referencePath = path.join(projectRoot, "src", "codex-keybindings.json");
const requestedIndex = process.argv.indexOf("--file");
const targetPath = requestedIndex >= 0
  ? path.resolve(process.argv[requestedIndex + 1] ?? "")
  : path.join(os.homedir(), ".codex", "keybindings.json");

if (!targetPath || !fs.existsSync(targetPath)) {
  console.error(`Keybindings file not found: ${targetPath || "<missing --file value>"}`);
  console.error("Open Codex → Keyboard Shortcuts and assign the ten documented chords manually.");
  process.exit(1);
}

function readJson(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${filePath} must contain a JSON array.`);
  return parsed;
}

function normalizeKey(key) {
  const aliases = new Map([
    ["control", "ctrl"],
    ["option", "alt"],
    ["cmd", "command"],
    ["meta", "command"],
  ]);
  const parts = String(key)
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .map((part) => aliases.get(part) ?? part);
  const modifiers = ["ctrl", "alt", "shift", "command"].filter((part) => parts.includes(part));
  const keys = parts.filter((part) => !modifiers.includes(part));
  return [...modifiers, ...keys].join("+");
}

const expected = readJson(referencePath);
const actual = readJson(targetPath);
const actualByCommand = new Map(actual.map((entry) => [entry.command, entry.key]));
const problems = [];

for (const entry of expected) {
  const actualKey = actualByCommand.get(entry.command);
  if (!actualKey) {
    problems.push(`Missing: ${entry.command} → ${entry.key}`);
  } else if (normalizeKey(actualKey) !== normalizeKey(entry.key)) {
    problems.push(`Mismatch: ${entry.command} is ${actualKey}; expected ${entry.key}`);
  }
}

const commandsByKey = new Map();
for (const entry of actual) {
  const normalized = normalizeKey(entry.key);
  const commands = commandsByKey.get(normalized) ?? [];
  commands.push(entry.command);
  commandsByKey.set(normalized, commands);
}
for (const [key, commands] of commandsByKey) {
  if (commands.length > 1 && expected.some((entry) => normalizeKey(entry.key) === key)) {
    problems.push(`Conflict: ${key} is assigned to ${commands.join(", ")}`);
  }
}

console.log(`Checked ${actual.length} bindings in ${targetPath}`);
if (problems.length) {
  for (const problem of problems) console.error(`- ${problem}`);
  console.error("No files were changed. Use Codex's Keyboard Shortcuts screen to fix the assignments.");
  process.exit(1);
}

console.log("All ten Codex Control bindings are present with no detected conflicts.");
console.log("This read-only check confirms JSON state; the Codex UI remains the activation authority.");
