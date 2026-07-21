#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const wheelAssetDir = path.join(projectRoot, "src", "icons", "wheel");
const wheelModes = {
  "generic-raster": {
    renderer: "WheelToolGeneric1x1",
    idleAsset: "reasoning-wheel-idle.png",
    plugin: null,
  },
  "plugin-wheel": {
    renderer: "CodexControlWheel___CodexControlReasoningWheel",
    idleAsset: "reasoning-wheel-idle.png",
    plugin: {
      name: "CodexControlWheel",
      version: "1.0.0",
      pluginFileName: "CodexControlWheelPlugin.dll",
    },
  },
};

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value) {
      throw new Error(`Invalid arguments near ${key ?? "<end>"}`);
    }
    parsed[key.slice(2)] = value;
  }
  return parsed;
}

const args = parseArgs(process.argv.slice(2));
if (!args.app || !args["wheel-mode"]) {
  throw new Error(
    "Usage: node validate-profile.mjs --app <com.openai.codex> --wheel-mode <plugin-wheel|generic-raster> [--baseline-app <com.openai.codex>]",
  );
}
const wheelMode = args["wheel-mode"];
const wheelImplementation = wheelModes[wheelMode];
if (!wheelImplementation) {
  throw new Error(
    `Unsupported wheel mode ${wheelMode}. Supported modes: ${Object.keys(wheelModes).join(", ")}`,
  );
}

const appRoot = path.resolve(args.app);
const profilesRoot = path.join(appRoot, "Profiles");
const profileDir = fs
  .readdirSync(profilesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(profilesRoot, entry.name))
  .find((candidate) => {
    const candidatePath = path.join(candidate, "ProfileInfo.json");
    if (!fs.existsSync(candidatePath)) return false;
    const candidateProfile = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
    return candidateProfile.applicationName === "com.openai.codex";
  });

if (!profileDir) throw new Error("No com.openai.codex profile found.");

const profilePath = path.join(profileDir, "ProfileInfo.json");
const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
const mode = profile.layout.layoutModes.find(
  (candidate) => candidate.modeName.toLowerCase() === "main",
);
const requiredWorkspaceNames = [
  "Command",
  "Agents",
  "Skills",
  "Create",
  "Operate",
  "Personal",
  "Quick Text",
];
const workspaceByName = new Map(
  mode.workspaces.map((workspace) => [workspace.displayName, workspace]),
);

for (const requiredName of requiredWorkspaceNames) {
  if (!workspaceByName.has(requiredName)) {
    throw new Error(`Missing workspace: ${requiredName}`);
  }
}
if (mode.workspaces.length !== 7) {
  throw new Error(`Expected exactly seven workspaces, found ${mode.workspaces.length}.`);
}

const profileActionNames = new Set(
  (profile.profileActions ?? []).map((action) => action.name),
);
const macroNames = new Set(
  (profile.macroCommands ?? []).map(
    (command) => `$@Generic___@Macro___${command.name}`,
  ),
);
const adjustmentNames = new Set(
  (profile.macroAdjustments ?? []).map(
    (adjustment) => `$@Generic___@MacroAdjustment___${adjustment.name}`,
  ),
);
const workspaceIds = new Set(mode.workspaces.map((workspace) => workspace.name));

function validateAction(action, location) {
  if (!action) return;
  if (profileActionNames.has(action)) return;
  if (macroNames.has(action)) return;
  if (adjustmentNames.has(action)) return;
  if (action.startsWith("$DefaultMac___")) return;
  if (action === "$@Generic___@None") return;
  if (action.startsWith("$@Generic___@ChangeWorkspace___")) {
    const workspaceId = action.split("|").at(-1);
    if (workspaceIds.has(workspaceId)) return;
  }
  throw new Error(`Unresolved action at ${location}: ${action}`);
}

for (const page of mode.touchPages) {
  page.controls.forEach((control, index) => {
    validateAction(control.pressAction, `touch ${page.name}/${index}/press`);
    validateAction(control.fnPressAction, `touch ${page.name}/${index}/fn`);
  });
}

for (const page of mode.encoderPages) {
  page.controls.forEach((control, index) => {
    validateAction(control.pressAction, `encoder ${page.name}/${index}/press`);
    validateAction(control.fnPressAction, `encoder ${page.name}/${index}/fn-press`);
    validateAction(control.rotateAction, `encoder ${page.name}/${index}/rotate`);
    validateAction(control.fnRotateAction, `encoder ${page.name}/${index}/fn-rotate`);
  });
}

for (const [pageName, page] of [
  ["round", profile.layout.roundPage],
  ["square", profile.layout.squarePage],
]) {
  page.controls.forEach((control, index) => {
    validateAction(control.pressAction, `${pageName}/${index}/press`);
    validateAction(control.fnPressAction, `${pageName}/${index}/fn`);
  });
}

for (const page of mode.wheelPages) {
  if (page.templateName !== wheelImplementation.renderer) {
    throw new Error(`Unexpected wheel template for ${page.name}: ${page.templateName}`);
  }
  for (const parameter of ["actions", "adjustment"]) {
    const actions = (page.parameters?.[parameter] ?? "")
      .split(",")
      .filter(Boolean);
    actions.forEach((action) =>
      validateAction(action, `wheel ${page.name}/${parameter}`),
    );
  }
}

const workspaceSummary = {};
let assignedTouchButtons = 0;
for (const workspaceName of requiredWorkspaceNames) {
  const targetWorkspace = workspaceByName.get(workspaceName);
  const page = mode.touchPages.find(
    (candidate) => candidate.name === targetWorkspace.touchPageNames[0],
  );
  const assigned = page.controls
    .slice(0, 12)
    .map((control) => control.pressAction)
    .filter(Boolean);
  if (assigned.length !== 12) {
    throw new Error(`${workspaceName} has ${assigned.length}/12 assigned touch buttons.`);
  }
  assignedTouchButtons += assigned.length;
  workspaceSummary[workspaceName] = assigned;
}

const reviewFirstMacros = (profile.macroCommands ?? []).filter((command) =>
  command.displayName.startsWith("Skill · "),
);
if (reviewFirstMacros.length !== 12) {
  throw new Error(`Expected 12 review-first skill macros, found ${reviewFirstMacros.length}.`);
}
for (const command of reviewFirstMacros) {
  if (
    command.actions.length !== 1 ||
    !command.actions[0].startsWith("$@Generic___@TypeText___")
  ) {
    throw new Error(`${command.displayName} is not a paste-only skill macro.`);
  }
}

const expectedQuickTextDisplayNames = [
  "Finish It",
  "Status",
  "Root Cause",
  "Check Rest",
  "Update Docs",
  "Validate All",
  "Review Changes",
  "Make It Nice",
  "Simplify",
  "Best Judgment",
  "Handoff",
  "Match Visual",
];
const quickTextActionNames = new Set(workspaceSummary["Quick Text"]);
const quickTextMacros = (profile.macroCommands ?? []).filter((command) =>
  quickTextActionNames.has(`$@Generic___@Macro___${command.name}`),
);
if (quickTextMacros.length !== 12) {
  throw new Error(`Expected 12 quick-text macros, found ${quickTextMacros.length}.`);
}
const quickTextDisplayNames = new Set(
  quickTextMacros.map((command) => command.displayName),
);
for (const expectedName of expectedQuickTextDisplayNames) {
  if (!quickTextDisplayNames.has(expectedName)) {
    throw new Error(`Quick Text is missing the clean display name ${expectedName}.`);
  }
}
if (quickTextMacros.some((command) => command.displayName.startsWith("Quick · "))) {
  throw new Error("Quick Text display names still contain the Quick · prefix.");
}
for (const command of quickTextMacros) {
  if (
    command.actions.length !== 1 ||
    !command.actions[0].startsWith("$@Generic___@TypeText___")
  ) {
    throw new Error(`${command.displayName} is not a paste-only quick-text macro.`);
  }
}
if (new Set(quickTextMacros.map((command) => command.actions[0])).size !== 12) {
  throw new Error("Quick Text contains duplicate prompt bodies.");
}

const expectedPersonalPrompts = new Map([
  ["Inspect First", "Before changing anything, read AGENTS.md and the relevant project documentation, inspect the affected files and current behavior, then briefly state the implementation plan."],
  ["Find Root", "Identify the real project root and determine which instruction files apply before editing. Do not assume the currently open folder is the correct root."],
  ["Lock Scope", "Define what is in scope and what must not be touched. Stay inside the assigned task and do not change unrelated logic, UI, data, wording, files, or behavior."],
  ["Preserve", "Preserve all existing functionality and visual behavior unless the requested feature specifically requires changing it. Add around the current system instead of replacing it."],
  ["Small Fix", "Make the smallest practical and safe change that completely solves the problem. Avoid broad rewrites, unnecessary dependencies, or architecture changes."],
  ["Use Existing", "Reuse the project's existing components, patterns, utilities, styles, data flow, and dependencies before creating anything new."],
  ["Full Files", "Apply complete file rewrites for every file you change rather than giving partial snippets. Preserve all unrelated code and content."],
  ["Source Truth", "Treat the existing repository, data files, and established workflow as the source of truth. Do not create a parallel system, duplicate database, competing configuration, or second workflow."],
  ["No Guessing", "Do not invent commands, APIs, file paths, results, or capabilities. Verify them from the project or authoritative sources, and clearly identify anything that remains unknown."],
  ["Keep Going", "Use the context already available, make reasonable decisions, and complete the task without stopping for unnecessary questions. Continue through implementation, verification, and cleanup."],
  ["Deep Research", "Research this thoroughly using the browser. Keep digging through official documentation, GitHub, Reddit, forums, videos, public repositories, and relevant examples. Cite sources and separate verified facts from inference."],
  ["Audit Only", "Audit the project and classify findings as source code, documentation, assets, generated output, local/private content, safe cleanup, or risky/unknown. Do not delete or modify anything."],
]);
const personalActionNames = new Set(workspaceSummary.Personal);
const personalMacros = (profile.macroCommands ?? []).filter((command) =>
  personalActionNames.has(`$@Generic___@Macro___${command.name}`),
);
if (personalMacros.length !== 12) {
  throw new Error(`Expected 12 Personal macros, found ${personalMacros.length}.`);
}
for (const command of personalMacros) {
  const expectedText = expectedPersonalPrompts.get(command.displayName);
  if (!expectedText) {
    throw new Error(`Unexpected Personal prompt: ${command.displayName}.`);
  }
  if (
    command.groupName !== "Personal" ||
    command.actions.length !== 1 ||
    command.actions[0] !== `$@Generic___@TypeText___${expectedText}`
  ) {
    throw new Error(`${command.displayName} does not match the exact paste-only prompt.`);
  }
}
if (new Set(personalMacros.map((command) => command.actions[0])).size !== 12) {
  throw new Error("Personal contains duplicate prompt bodies.");
}

const expectedCreatePrompts = new Map([
  ["Creative", "Use the Creative Production plugin and choose its best-fitting intake or production skill for this task."],
  ["Documents", "Use the Documents plugin and its Documents skill for this task. Preserve existing structure and formatting unless the request requires a change."],
  ["Sheets", "Use the Spreadsheets plugin for this workbook or data task. Preserve formulas, formatting, and workbook structure unless I request changes."],
  ["PDF", "Use the PDF skill for this task. Inspect, create, edit, or validate the PDF as needed and visually verify the final pages."],
  ["Slides", "Use the Presentations skill for this task. Build or refine the deck with clear hierarchy, cohesive visuals, and validated slide output."],
  ["Templates", "Use the Template Creator skill to create or update a reusable template that follows the requested workflow and established conventions."],
  ["Sites", "Use the Sites plugin and its applicable building or hosting skill for this website task."],
  ["Product Design", "Use the Product Design plugin and its best-fitting skill to audit, ideate, or implement this product-design task."],
  ["Expo", "Use the Expo plugin and its most applicable skill for this React Native or Expo task while preserving native platform behavior."],
  ["Remotion", "Use the Remotion skill and its established best practices for this video composition or rendering task."],
  ["LR HDR", "Use the $lightroom-classic-hdr-import skill for this SD-card import, auto-stack, or batch HDR task. Preserve the current Lightroom destination and settings."],
  ["ImageGen", "Use the ImageGen skill to create or edit the requested image, matching supplied references and preserving required text and layout constraints."],
]);

const expectedOperatePrompts = new Map([
  ["Browser", "Use the Browser plugin to inspect or operate the in-app browser for this task. Read the visible state before taking action."],
  ["Computer", "Use the Computer Use plugin to inspect or operate the relevant Mac app for this task, following the applicable safety and confirmation rules."],
  ["Gmail", "Use the Gmail plugin and its applicable skill for this task. Read first and stage consequential actions unless I explicitly authorize them."],
  ["Mail", "Use Computer Use with Apple Mail for this task. Follow the active workspace’s Mail rules, inspect the targeted message first, and do not mutate Mail unless I explicitly authorize it."],
  ["Lightroom", "Use Computer Use with Adobe Lightroom Classic for this task. Inspect the current catalog and app state first and preserve existing import, metadata, file, and destination settings."],
  ["Numbers", "Use Computer Use with Apple Numbers for this task. Preserve formulas, formatting, sheets, and data unless I request changes."],
  ["Pages", "Use Computer Use with Apple Pages for this task. Preserve document structure, styles, and content unless I request changes."],
  ["GitHub", "Use the GitHub plugin and its best-fitting skill for this repository or pull-request task. Inspect the current state before any external mutation."],
  ["Calendar", "Use the Google Calendar plugin for this task. Read current state first and do not create, edit, or delete events unless explicitly authorized."],
  ["Drive", "Use the Google Drive plugin for this task. Preserve ownership and sharing, and do not move or delete content unless explicitly requested."],
  ["OpenAI Docs", "Use the OpenAI Docs skill and official OpenAI sources for this OpenAI product or API task."],
  ["Canva", "Use the Canva plugin and its best-fitting skill for this design task, preserving brand and layout constraints."],
]);

function validateExactPromptWorkspace(workspaceName, expectedPrompts) {
  const commandByAction = new Map(
    (profile.macroCommands ?? []).map((command) => [
      `$@Generic___@Macro___${command.name}`,
      command,
    ]),
  );
  const commands = workspaceSummary[workspaceName].map((actionName) =>
    commandByAction.get(actionName),
  );
  if (commands.some((command) => !command) || commands.length !== expectedPrompts.size) {
    throw new Error(`${workspaceName} does not contain exactly ${expectedPrompts.size} macros.`);
  }
  const expectedEntries = [...expectedPrompts.entries()];
  commands.forEach((command, index) => {
    const [expectedName, expectedText] = expectedEntries[index];
    if (
      command.displayName !== expectedName ||
      command.groupName !== workspaceName ||
      command.actions.length !== 1 ||
      command.actions[0] !== `$@Generic___@TypeText___${expectedText}`
    ) {
      throw new Error(`${workspaceName} position ${index + 1} is not the exact paste-only ${expectedName} prompt.`);
    }
    if (/Return|Enter/.test(command.actions[0])) {
      throw new Error(`${workspaceName} position ${index + 1} contains an automatic submission action.`);
    }
  });
  if (new Set(commands.map((command) => command.actions[0])).size !== commands.length) {
    throw new Error(`${workspaceName} contains duplicate prompt bodies.`);
  }
  return commands;
}

const createMacros = validateExactPromptWorkspace("Create", expectedCreatePrompts);
const operateMacros = validateExactPromptWorkspace("Operate", expectedOperatePrompts);
if (
  new Set([...createMacros, ...operateMacros].map((command) => command.actions[0])).size !== 24
) {
  throw new Error("Create and Operate must contain 24 unique prompt bodies.");
}

const codexActions = (profile.profileActions ?? []).filter(
  (action) => action.groupName === "Codex Control",
);
const shortcutValues = codexActions.map(
  (action) => action.actionParameters.parameters.keyboardKey,
);
if (new Set(shortcutValues).size !== shortcutValues.length) {
  throw new Error("Duplicate Codex Control keyboard shortcuts detected.");
}

const expectedDictationShortcuts = new Map([
  ["Voice", "Command+Control+AltOrOption+Key9___1033___Cmd+Opt+Ctrl+9___"],
  ["Dictate", "Command+Control+AltOrOption+Key0___1033___Cmd+Opt+Ctrl+0___"],
]);
for (const [displayName, expectedShortcut] of expectedDictationShortcuts) {
  const action = codexActions.find(
    (candidate) => candidate.displayName === displayName,
  );
  const actualShortcut = action?.actionParameters.parameters.keyboardKey;
  if (actualShortcut !== expectedShortcut) {
    throw new Error(
      `${displayName} uses ${actualShortcut ?? "no shortcut"}; expected ${expectedShortcut}.`,
    );
  }
}

const codexAdjustments = (profile.macroAdjustments ?? []).filter(
  (adjustment) => adjustment.groupName === "Codex Control",
);
if (codexAdjustments.length !== 6) {
  throw new Error(`Expected 6 Codex Control adjustments, found ${codexAdjustments.length}.`);
}
for (const adjustment of codexAdjustments) {
  const editorNames = new Set(
    adjustment.actionEditorCommands.map((command) => command.name),
  );
  const referenced = [
    ...adjustment.actionsLeft,
    ...adjustment.actionsRight,
    ...adjustment.actionsReset,
  ];
  for (const actionName of referenced) {
    if (!editorNames.has(actionName)) {
      throw new Error(
        `${adjustment.displayName} references missing editor command ${actionName}.`,
      );
    }
  }
}

const reasoningDialAdjustment = codexAdjustments.find(
  (adjustment) => adjustment.displayName === "Reasoning Effort",
);
const reasoningWheelAdjustment = codexAdjustments.find(
  (adjustment) => adjustment.displayName === "Reasoning Wheel",
);
if (!reasoningDialAdjustment || !reasoningWheelAdjustment) {
  throw new Error("The compact reasoning dial and isolated reasoning wheel actions are required.");
}
const reasoningDialAction =
  `$@Generic___@MacroAdjustment___${reasoningDialAdjustment.name}`;
const reasoningWheelAction =
  `$@Generic___@MacroAdjustment___${reasoningWheelAdjustment.name}`;
for (const encoderPage of mode.encoderPages) {
  if (encoderPage.controls[3]?.rotateAction !== reasoningDialAction) {
    throw new Error(`Reasoning dial action changed on encoder page ${encoderPage.name}.`);
  }
}
for (const wheelPage of mode.wheelPages) {
  if (wheelPage.parameters?.adjustment !== reasoningWheelAction) {
    throw new Error(`Center wheel does not use its isolated action on ${wheelPage.name}.`);
  }
  if (
    !wheelImplementation.plugin &&
    wheelPage.parameters?.actions !== reasoningWheelAction
  ) {
    throw new Error(`Built-in center wheel action parameter is missing on ${wheelPage.name}.`);
  }
}

const expectedIconNames = [
  ...codexActions.map((action) => action.name),
  ...codexAdjustments.map(
    (adjustment) => `$@Generic___@MacroAdjustment___${adjustment.name}`,
  ),
  ...reviewFirstMacros.map(
    (command) => `$@Generic___@Macro___${command.name}`,
  ),
  ...quickTextMacros.map(
    (command) => `$@Generic___@Macro___${command.name}`,
  ),
  ...personalMacros.map(
    (command) => `$@Generic___@Macro___${command.name}`,
  ),
  ...createMacros.map(
    (command) => `$@Generic___@Macro___${command.name}`,
  ),
  ...operateMacros.map(
    (command) => `$@Generic___@Macro___${command.name}`,
  ),
];
const expectedDeviceLabels = {
  Command: [
    "NEW CHAT",
    "QUICK CHAT",
    "SIDE CHAT",
    "SWITCH CHAT",
    "PROJECT",
    "FILES",
    "PHOTOS",
    "MODEL",
    "VOICE",
    "DICTATE",
    "PLAN",
    "FAST",
  ],
  Skills: [
    "PLAN",
    "BUILD",
    "DEBUG",
    "REVIEW",
    "TEST",
    "REFACTOR",
    "EXPLAIN",
    "DOCS",
    "RESEARCH",
    "UI POLISH",
    "VISUALS",
    "CONTINUE",
  ],
  "Quick Text": [
    "FINISH",
    "STATUS",
    "ROOT CAUSE",
    "CHECK REST",
    "UPDATE DOCS",
    "VALIDATE",
    "REVIEW",
    "MAKE NICE",
    "SIMPLIFY",
    "BEST JUDGMENT",
    "HANDOFF",
    "MATCH VISUAL",
  ],
  Personal: [
    "INSPECT FIRST",
    "FIND ROOT",
    "LOCK SCOPE",
    "PRESERVE",
    "SMALL FIX",
    "USE EXISTING",
    "FULL FILES",
    "SOURCE TRUTH",
    "NO GUESSING",
    "KEEP GOING",
    "DEEP RESEARCH",
    "AUDIT ONLY",
  ],
  Create: [
    "CREATIVE",
    "DOCUMENTS",
    "SHEETS",
    "PDF",
    "SLIDES",
    "TEMPLATES",
    "SITES",
    "PRODUCT DESIGN",
    "EXPO",
    "REMOTION",
    "LR HDR",
    "IMAGE GEN",
  ],
  Operate: [
    "BROWSER",
    "COMPUTER",
    "GMAIL",
    "MAIL",
    "LIGHTROOM",
    "NUMBERS",
    "PAGES",
    "GITHUB",
    "CALENDAR",
    "DRIVE",
    "OPENAI DOCS",
    "CANVA",
  ],
};
const labeledActionNames = new Map();
for (const [workspaceName, labels] of Object.entries(expectedDeviceLabels)) {
  const actions = workspaceSummary[workspaceName];
  if (actions.length !== labels.length) {
    throw new Error(`${workspaceName} has an unexpected labeled-icon count.`);
  }
  actions.forEach((actionName, index) => {
    labeledActionNames.set(actionName, labels[index]);
  });
}
if (labeledActionNames.size !== 72) {
  throw new Error(`Expected 72 labeled page actions, found ${labeledActionNames.size}.`);
}
const iconDir = path.join(profileDir, "ActionIcons");
let svgActionIcons = 0;
let rasterActionIcons = 0;
let reasoningWheelIconHash = null;
for (const actionName of expectedIconNames) {
  const iconPath = path.join(iconDir, `${actionName}.ict`);
  if (!fs.existsSync(iconPath)) throw new Error(`Missing action icon: ${iconPath}`);
  const icon = JSON.parse(fs.readFileSync(iconPath, "utf8"));
  const imageItem = icon.items.find((item) => item.itemType === "Image");
  if (!imageItem) throw new Error(`No image item in ${iconPath}`);
  const decodedBuffer = Buffer.from(imageItem.image, "base64");
  const isSvg = imageItem.imageFileName?.toLowerCase().endsWith(".svg");
  const isPng = imageItem.imageFileName?.toLowerCase().endsWith(".png");
  if (isSvg) {
    svgActionIcons += 1;
    const decoded = decodedBuffer.toString("utf8");
    if (!decoded.includes("<svg")) {
      throw new Error(`SVG filename does not contain SVG data: ${iconPath}`);
    }
    const expectedLabel = labeledActionNames.get(actionName);
    if (
      expectedLabel &&
      !decoded.includes(`data-device-label="${expectedLabel}"`)
    ) {
      throw new Error(`Labeled icon ${iconPath} is missing ${expectedLabel}.`);
    }
  } else if (isPng) {
    rasterActionIcons += 1;
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (!decodedBuffer.subarray(0, 8).equals(pngSignature)) {
      throw new Error(`PNG filename does not contain PNG data: ${iconPath}`);
    }
    const width = decodedBuffer.readUInt32BE(16);
    const height = decodedBuffer.readUInt32BE(20);
    if (width !== 1024 || height !== 1024) {
      throw new Error(`Wheel raster must be 1024x1024; found ${width}x${height}.`);
    }
    if (actionName === reasoningWheelAction) {
      reasoningWheelIconHash = crypto
        .createHash("sha256")
        .update(decodedBuffer)
        .digest("hex");
    }
  } else {
    throw new Error(`Unsupported icon backing for ${iconPath}.`);
  }
}

if (rasterActionIcons !== 1 || !reasoningWheelIconHash) {
  throw new Error(
    `Expected one isolated raster wheel icon, found ${rasterActionIcons}.`,
  );
}
const expectedWheelAssetPath = path.join(
  wheelAssetDir,
  wheelImplementation.idleAsset,
);
const expectedWheelAssetHash = crypto
  .createHash("sha256")
  .update(fs.readFileSync(expectedWheelAssetPath))
  .digest("hex");
if (reasoningWheelIconHash !== expectedWheelAssetHash) {
  throw new Error("Installed wheel icon does not match the canonical idle asset.");
}

const manifestPath = args.manifest
  ? path.resolve(args.manifest)
  : path.join(path.dirname(appRoot), "install-manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const manifestWorkspaceNames = Object.keys(manifest.workspaces ?? {});
  for (const workspaceName of requiredWorkspaceNames) {
    if (!manifestWorkspaceNames.includes(workspaceName)) {
      throw new Error(`Install manifest is missing ${workspaceName}.`);
    }
  }
  if (
    manifest.counts?.createMacros !== 12 ||
    manifest.counts?.operateMacros !== 12 ||
    manifest.counts?.labeledPageActionIcons !== 72 ||
    manifest.counts?.actionIcons !== 96
  ) {
    throw new Error("Install manifest Create/Operate or icon counts are stale.");
  }
  if (manifest.centerWheel?.implementationMode !== wheelMode) {
    throw new Error("Install manifest wheel mode does not match validator mode.");
  }
  if (manifest.centerWheel?.renderer !== wheelImplementation.renderer) {
    throw new Error("Install manifest wheel renderer does not match the profile.");
  }
  if (manifest.centerWheel?.idleAsset?.sha256 !== expectedWheelAssetHash) {
    throw new Error("Install manifest idle wheel hash is stale.");
  }
  if (wheelImplementation.plugin) {
    const plugin = manifest.centerWheel?.plugin;
    if (
      plugin?.name !== wheelImplementation.plugin.name ||
      plugin?.version !== wheelImplementation.plugin.version ||
      plugin?.pluginFileName !== wheelImplementation.plugin.pluginFileName
    ) {
      throw new Error("Install manifest wheel plugin metadata is stale.");
    }
    const pluginDllPath = path.join(
      projectRoot,
      plugin.packagePath,
      "bin",
      plugin.pluginFileName,
    );
    if (!fs.existsSync(pluginDllPath)) {
      throw new Error(`Wheel plugin DLL is missing: ${pluginDllPath}`);
    }
    const pluginHash = crypto
      .createHash("sha256")
      .update(fs.readFileSync(pluginDllPath))
      .digest("hex");
    if (pluginHash !== plugin.pluginFileSha256) {
      throw new Error("Install manifest wheel plugin hash is stale.");
    }
  } else if (manifest.centerWheel?.plugin !== null) {
    throw new Error("Generic wheel mode must not declare a plugin.");
  }
}

if (mode.homeWorkspaceName !== workspaceByName.get("Command").name) {
  throw new Error("Command is not the home workspace.");
}

const quickWorkspaceAction =
  `$@Generic___@ChangeWorkspace___main|${workspaceByName.get("Quick Text").name}`;
if (profile.layout.roundPage.controls[7].pressAction !== quickWorkspaceAction) {
  throw new Error("Round button 8 does not open Quick Text.");
}
const personalWorkspaceAction =
  `$@Generic___@ChangeWorkspace___main|${workspaceByName.get("Personal").name}`;
if (profile.layout.roundPage.controls[6].pressAction !== personalWorkspaceAction) {
  throw new Error("Round button 7 does not open Personal.");
}
const createWorkspaceAction =
  `$@Generic___@ChangeWorkspace___main|${workspaceByName.get("Create").name}`;
const operateWorkspaceAction =
  `$@Generic___@ChangeWorkspace___main|${workspaceByName.get("Operate").name}`;
const fastAction = codexActions.find(
  (action) => action.displayName === "Fast Mode",
);
if (
  profile.layout.roundPage.controls[4].pressAction !== createWorkspaceAction ||
  (profile.layout.roundPage.controls[4].fnPressAction ?? null) !== null
) {
  throw new Error("Round button 5 must open Create with an empty Fn branch.");
}
if (
  profile.layout.roundPage.controls[5].pressAction !== operateWorkspaceAction ||
  profile.layout.roundPage.controls[5].fnPressAction !== fastAction?.name
) {
  throw new Error("Round button 6 must open Operate with Fn Fast Mode.");
}
for (const displayName of ["Voice", "Dictate", "Plan Mode"]) {
  const action = codexActions.find((candidate) => candidate.displayName === displayName);
  if (!action || !workspaceSummary.Command.includes(action.name)) {
    throw new Error(`${displayName} is not preserved on the Command touchscreen.`);
  }
}
const actionColorsPath = path.join(profileDir, "ActionColors", "ActionColors.json");
if (!fs.existsSync(actionColorsPath)) {
  throw new Error("Workspace action colors are missing from the profile package.");
}
const actionColors = JSON.parse(fs.readFileSync(actionColorsPath, "utf8"));
const expectedWorkspaceActionColors = new Map([
  ["Create", 0xff9a2e],
  ["Operate", 0x15c7b7],
]);
for (const [workspaceName, expectedColor] of expectedWorkspaceActionColors) {
  const actionName =
    `$@Generic___@ChangeWorkspace___main|${workspaceByName.get(workspaceName).name}`;
  if (actionColors[actionName] !== expectedColor) {
    throw new Error(`${workspaceName} workspace button color is not preserved.`);
  }
}
let baselineWorkspaceActionColorsPreserved = 0;
if (args["baseline-app"]) {
  const baselineAppRoot = path.resolve(args["baseline-app"]);
  const baselineProfilesRoot = path.join(baselineAppRoot, "Profiles");
  const baselineProfileDir = fs
    .readdirSync(baselineProfilesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(baselineProfilesRoot, entry.name))
    .find((candidate) => {
      const candidatePath = path.join(candidate, "ProfileInfo.json");
      if (!fs.existsSync(candidatePath)) return false;
      const candidateProfile = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
      return candidateProfile.applicationName === "com.openai.codex";
    });
  if (!baselineProfileDir) {
    throw new Error("No com.openai.codex profile found in the baseline app.");
  }
  const baselineProfile = JSON.parse(
    fs.readFileSync(path.join(baselineProfileDir, "ProfileInfo.json"), "utf8"),
  );
  const baselineMode = baselineProfile.layout.layoutModes.find(
    (candidate) => candidate.modeName.toLowerCase() === "main",
  );
  const baselineWorkspaceByName = new Map(
    baselineMode.workspaces.map((entry) => [entry.displayName, entry]),
  );
  for (const legacyWorkspaceName of [
    "Command",
    "Agents",
    "Skills",
    "Personal",
    "Quick Text",
  ]) {
    const baselineWorkspace = baselineWorkspaceByName.get(legacyWorkspaceName);
    const currentWorkspace = workspaceByName.get(legacyWorkspaceName);
    if (JSON.stringify(baselineWorkspace) !== JSON.stringify(currentWorkspace)) {
      throw new Error(`${legacyWorkspaceName} workspace metadata changed from baseline.`);
    }
    for (const [pageKey, pageCollection] of [
      ["touchPageNames", "touchPages"],
      ["encoderPageNames", "encoderPages"],
      ["wheelPageNames", "wheelPages"],
    ]) {
      const baselinePage = baselineMode[pageCollection].find(
        (entry) => entry.name === baselineWorkspace[pageKey][0],
      );
      const currentPage = mode[pageCollection].find(
        (entry) => entry.name === currentWorkspace[pageKey][0],
      );
      const comparableBaselinePage = structuredClone(baselinePage);
      const comparableCurrentPage = structuredClone(currentPage);
      if (pageCollection === "wheelPages") {
        delete comparableBaselinePage.templateName;
        delete comparableCurrentPage.templateName;
        delete comparableBaselinePage.parameters?.actions;
        delete comparableCurrentPage.parameters?.actions;
      }
      if (
        JSON.stringify(comparableBaselinePage) !==
        JSON.stringify(comparableCurrentPage)
      ) {
        throw new Error(`${legacyWorkspaceName} ${pageCollection} changed from baseline.`);
      }
    }
  }
  if (
    JSON.stringify(baselineProfile.layout.squarePage.controls) !==
    JSON.stringify(profile.layout.squarePage.controls)
  ) {
    throw new Error("One or more square-button mappings changed from baseline.");
  }
  for (const index of [0, 1, 2, 3, 6, 7]) {
    if (
      JSON.stringify(baselineProfile.layout.roundPage.controls[index]) !==
      JSON.stringify(profile.layout.roundPage.controls[index])
    ) {
      throw new Error(`Legacy round-button mapping ${index + 1} changed from baseline.`);
    }
  }
  for (const [collectionName, idKey] of [
    ["profileActions", "name"],
    ["macroAdjustments", "name"],
    ["macroCommands", "name"],
  ]) {
    const currentById = new Map(
      (profile[collectionName] ?? []).map((entry) => [entry[idKey], entry]),
    );
    for (const baselineEntry of baselineProfile[collectionName] ?? []) {
      if (
        JSON.stringify(baselineEntry) !==
        JSON.stringify(currentById.get(baselineEntry[idKey]))
      ) {
        throw new Error(`Legacy ${collectionName} entry changed: ${baselineEntry[idKey]}.`);
      }
    }
  }
  const baselineActionColorsPath = path.join(
    baselineProfileDir,
    "ActionColors",
    "ActionColors.json",
  );
  const baselineActionColors = JSON.parse(
    fs.readFileSync(baselineActionColorsPath, "utf8"),
  );
  for (const [actionName, color] of Object.entries(baselineActionColors)) {
    if (actionColors[actionName] !== color) {
      throw new Error(`Baseline workspace color changed for ${actionName}.`);
    }
    baselineWorkspaceActionColorsPreserved += 1;
  }
  const expectedColorKeys = new Set([
    ...Object.keys(baselineActionColors),
    createWorkspaceAction,
    operateWorkspaceAction,
  ]);
  if (
    Object.keys(actionColors).length !== expectedColorKeys.size ||
    Object.keys(actionColors).some((actionName) => !expectedColorKeys.has(actionName))
  ) {
    throw new Error("ActionColors contains changes beyond the baseline plus Create and Operate.");
  }
  const baselineIconDir = path.join(baselineProfileDir, "ActionIcons");
  for (const iconName of fs.readdirSync(baselineIconDir)) {
    if (!iconName.endsWith(".ict")) continue;
    const baselineIconPath = path.join(baselineIconDir, iconName);
    const currentIconPath = path.join(iconDir, iconName);
    if (
      !fs.existsSync(currentIconPath) ||
      !fs.readFileSync(baselineIconPath).equals(fs.readFileSync(currentIconPath))
    ) {
      throw new Error(`Legacy action icon changed from baseline: ${iconName}.`);
    }
  }
}
const declineAction = codexActions.find(
  (action) => action.displayName === "Decline / Cancel",
);
if (profile.layout.squarePage.controls[11].pressAction !== declineAction?.name) {
  throw new Error("Decline / Cancel is not preserved on the bottom-right square button.");
}
const approveAction = codexActions.find(
  (action) => action.displayName === "Approve",
);
if (
  profile.layout.squarePage.controls[0].pressAction !== approveAction?.name ||
  profile.layout.roundPage.controls[6].fnPressAction !== approveAction?.name
) {
  throw new Error("Approve is not preserved on the left square and Fn + round button 7.");
}
const reasoningUpAction = codexActions.find(
  (action) => action.displayName === "Reasoning Up",
);
const reasoningDownAction = codexActions.find(
  (action) => action.displayName === "Reasoning Down",
);
const expectedRightSquareControls = [
  [6, personalWorkspaceAction, reasoningUpAction?.name, "A · Personal"],
  [9, `$@Generic___@ChangeWorkspace___main|${workspaceByName.get("Agents").name}`, null, "B · Agents"],
  [7, quickWorkspaceAction, reasoningDownAction?.name, "C · Quick Text"],
  [10, `$@Generic___@ChangeWorkspace___main|${workspaceByName.get("Skills").name}`, null, "D · Skills"],
  [11, declineAction?.name, null, "E · Decline"],
];
for (const [index, pressAction, fnPressAction, label] of expectedRightSquareControls) {
  const control = profile.layout.squarePage.controls[index];
  if (
    control.pressAction !== pressAction ||
    (control.fnPressAction ?? null) !== fnPressAction
  ) {
    throw new Error(`${label} does not match the intended workspace layout.`);
  }
}
const preservedReservedCommandControl = profile.layout.squarePage.controls[8];
if (
  preservedReservedCommandControl.pressAction !==
    `$@Generic___@ChangeWorkspace___main|${workspaceByName.get("Command").name}` ||
  (preservedReservedCommandControl.fnPressAction ?? null) !== null
) {
  throw new Error("The reserved Fn-layer profile slot lost its preserved Command action.");
}

const roundButtonsAssigned = profile.layout.roundPage.controls.filter(
  (control) => control.pressAction,
).length;
const squareButtonsAssigned = profile.layout.squarePage.controls.filter(
  (control) => control.pressAction,
).length;
const encoderPagesConfigured = mode.encoderPages.filter(
  (page) => page.controls.filter((control) => control.rotateAction).length === 6,
).length;
const wheelPagesConfigured = mode.wheelPages.filter(
  (page) => page.templateName === wheelImplementation.renderer,
).length;
if (
  assignedTouchButtons !== 84 ||
  svgActionIcons !== 95 ||
  rasterActionIcons !== 1 ||
  roundButtonsAssigned !== 8 ||
  squareButtonsAssigned !== 12 ||
  encoderPagesConfigured !== 7 ||
  wheelPagesConfigured !== 7
) {
  throw new Error(
    `Unexpected final counts: touch=${assignedTouchButtons}, svg=${svgActionIcons}, raster=${rasterActionIcons}, round=${roundButtonsAssigned}, square=${squareButtonsAssigned}, encoderPages=${encoderPagesConfigured}, wheelPages=${wheelPagesConfigured}.`,
  );
}

const result = {
  valid: true,
  profilePath,
  applicationName: profile.applicationName,
  deviceType: profile.deviceType,
  homeWorkspace: "Command",
  assignedTouchButtons,
  profileActions: codexActions.length,
  macroAdjustments: codexAdjustments.length,
  reviewFirstSkillMacros: reviewFirstMacros.length,
  quickTextMacros: quickTextMacros.length,
  personalMacros: personalMacros.length,
  createMacros: createMacros.length,
  operateMacros: operateMacros.length,
  labeledPageActionIcons: labeledActionNames.size,
  workspaceActionColors: Object.keys(actionColors).length,
  baselineWorkspaceActionColorsPreserved,
  svgActionIcons,
  rasterActionIcons,
  centerWheelMode: wheelMode,
  centerWheelRenderer: wheelImplementation.renderer,
  centerWheelIdleAssetSha256: reasoningWheelIconHash,
  roundButtonsAssigned,
  squareButtonsAssigned,
  encoderPagesConfigured,
  wheelPagesConfigured,
  workspaceSummary,
};

console.log(JSON.stringify(result, null, 2));
