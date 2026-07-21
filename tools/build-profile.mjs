#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const iconSourceDir = path.join(projectRoot, "src", "icons");
const labeledIconSourceDir = path.join(iconSourceDir, "labeled");
const wheelIconSourceDir = path.join(iconSourceDir, "wheel");
const profileRevisionUtc = "2026-01-01T00:00:00.000Z";
const pluginPackageRoot = path.join(projectRoot, "src", "wheel-plugin");

const wheelModes = {
  "generic-raster": {
    renderer: "WheelToolGeneric1x1",
    rendererVersion: "Loupedeck 6.3 built-in",
    idleAsset: "reasoning-wheel-idle.png",
    pulseAsset: "reasoning-wheel-pulse.png",
    supportsRuntimePulse: false,
    visualAcceptance: "safe-fallback",
    limitation:
      "The built-in 1x1 renderer preserves turn and tap but constrains action artwork to a small center icon; it cannot meet the 75% full-wheel fill target.",
  },
  "plugin-wheel": {
    renderer: "CodexControlWheel___CodexControlReasoningWheel",
    rendererVersion: "Codex Control Wheel 1.0.0",
    idleAsset: "reasoning-wheel-idle.png",
    pulseAsset: "reasoning-wheel-pulse.png",
    supportsRuntimePulse: true,
    visualAcceptance: "full-wheel",
    limitation: null,
    plugin: {
      name: "CodexControlWheel",
      version: "1.0.0",
      sdk: "LogiPluginTool 6.1.4.22672 / .NET 8",
      packageRoot: pluginPackageRoot,
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
if (!args["source-app"] || !args["output-app"] || !args["wheel-mode"]) {
  throw new Error(
    "Usage: node build-profile.mjs --source-app <com.openai.codex> --output-app <com.openai.codex> --wheel-mode <plugin-wheel|generic-raster>",
  );
}

const sourceAppRoot = path.resolve(args["source-app"]);
const outputAppRoot = path.resolve(args["output-app"]);
const wheelMode = args["wheel-mode"];
const wheelImplementation = wheelModes[wheelMode];

if (!wheelImplementation) {
  throw new Error(
    `Unsupported wheel mode ${wheelMode}. Supported modes: ${Object.keys(wheelModes).join(", ")}`,
  );
}

const wheelIdleAssetPath = path.join(
  wheelIconSourceDir,
  wheelImplementation.idleAsset,
);
const wheelPulseAssetPath = path.join(
  wheelIconSourceDir,
  wheelImplementation.pulseAsset,
);
for (const assetPath of [wheelIdleAssetPath, wheelPulseAssetPath]) {
  if (!fs.existsSync(assetPath)) {
    throw new Error(`Missing wheel asset: ${assetPath}`);
  }
}
const pluginDllPath = wheelImplementation.plugin
  ? path.join(
      wheelImplementation.plugin.packageRoot,
      "bin",
      wheelImplementation.plugin.pluginFileName,
    )
  : null;
if (pluginDllPath && !fs.existsSync(pluginDllPath)) {
  throw new Error(`Missing wheel plugin: ${pluginDllPath}`);
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

if (!fs.existsSync(path.join(sourceAppRoot, "ApplicationInfo.json"))) {
  throw new Error(`Not a Loupedeck application profile root: ${sourceAppRoot}`);
}

fs.mkdirSync(path.dirname(outputAppRoot), { recursive: true });
fs.cpSync(sourceAppRoot, outputAppRoot, { recursive: true, force: true });

const profilesRoot = path.join(outputAppRoot, "Profiles");
const profileDirectories = fs
  .readdirSync(profilesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(profilesRoot, entry.name));

const profileDir = profileDirectories.find((candidate) => {
  const profilePath = path.join(candidate, "ProfileInfo.json");
  if (!fs.existsSync(profilePath)) return false;
  const candidateProfile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
  return (
    candidateProfile.applicationName === "com.openai.codex" &&
    candidateProfile.deviceType === "Loupedeck20"
  );
});

if (!profileDir) {
  throw new Error("Could not find the Loupedeck CT ChatGPT/Codex profile.");
}

const profilePath = path.join(profileDir, "ProfileInfo.json");
const actionIconDir = path.join(profileDir, "ActionIcons");
const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
const mainMode = profile.layout?.layoutModes?.find(
  (mode) => mode.modeName?.toLowerCase() === "main",
);

if (!mainMode) throw new Error("The profile has no main layout mode.");

const baseWorkspaces = ["Command", "Agents", "Skills"];
for (const displayName of baseWorkspaces) {
  if (!mainMode.workspaces.some((workspace) => workspace.displayName === displayName)) {
    throw new Error(`Missing workspace: ${displayName}`);
  }
}

function stableId(namespace) {
  return crypto
    .createHash("sha256")
    .update(`Codex Control v1:${namespace}`)
    .digest("hex")
    .slice(0, 32)
    .toUpperCase();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureQuickTextWorkspace() {
  const existing = mainMode.workspaces.find(
    (entry) => entry.displayName === "Quick Text",
  );
  if (existing) return existing;

  const sourceWorkspace = mainMode.workspaces.find(
    (entry) => entry.displayName === "Skills",
  );
  const sourceTouchPage = mainMode.touchPages.find(
    (entry) => entry.name === sourceWorkspace.touchPageNames[0],
  );
  const sourceEncoderPage = mainMode.encoderPages.find(
    (entry) => entry.name === sourceWorkspace.encoderPageNames[0],
  );
  const sourceWheelPage = mainMode.wheelPages.find(
    (entry) => entry.name === sourceWorkspace.wheelPageNames[0],
  );
  if (!sourceTouchPage || !sourceEncoderPage || !sourceWheelPage) {
    throw new Error("Skills workspace is missing a page needed for Quick Text.");
  }

  const workspaceId = stableId("workspace:quick-text");
  const touchPageId = stableId("touch-page:quick-text");
  const encoderPageId = stableId("encoder-page:quick-text");
  const wheelPageId = stableId("wheel-page:quick-text");

  const quickWorkspace = clone(sourceWorkspace);
  quickWorkspace.name = workspaceId;
  quickWorkspace.displayName = "Quick Text";
  quickWorkspace.description = "Reusable completion and quality prompts";
  quickWorkspace.touchPageNames = [touchPageId];
  quickWorkspace.encoderPageNames = [encoderPageId];
  quickWorkspace.wheelPageNames = [wheelPageId];

  const quickTouchPage = clone(sourceTouchPage);
  quickTouchPage.name = touchPageId;
  quickTouchPage.displayName = "Quick Text";

  const quickEncoderPage = clone(sourceEncoderPage);
  quickEncoderPage.name = encoderPageId;

  const quickWheelPage = clone(sourceWheelPage);
  quickWheelPage.name = wheelPageId;

  mainMode.workspaces.push(quickWorkspace);
  mainMode.touchPages.push(quickTouchPage);
  mainMode.encoderPages.push(quickEncoderPage);
  mainMode.wheelPages.push(quickWheelPage);
  return quickWorkspace;
}

ensureQuickTextWorkspace();

function ensurePersonalWorkspace() {
  const existing = mainMode.workspaces.find(
    (entry) => entry.displayName === "Personal",
  );
  if (existing) return existing;

  const sourceWorkspace = mainMode.workspaces.find(
    (entry) => entry.displayName === "Skills",
  );
  const sourceTouchPage = mainMode.touchPages.find(
    (entry) => entry.name === sourceWorkspace.touchPageNames[0],
  );
  const sourceEncoderPage = mainMode.encoderPages.find(
    (entry) => entry.name === sourceWorkspace.encoderPageNames[0],
  );
  const sourceWheelPage = mainMode.wheelPages.find(
    (entry) => entry.name === sourceWorkspace.wheelPageNames[0],
  );
  if (!sourceTouchPage || !sourceEncoderPage || !sourceWheelPage) {
    throw new Error("Skills workspace is missing a page needed for Personal.");
  }

  const workspaceId = stableId("workspace:personal");
  const touchPageId = stableId("touch-page:personal");
  const encoderPageId = stableId("encoder-page:personal");
  const wheelPageId = stableId("wheel-page:personal");

  const personalWorkspace = clone(sourceWorkspace);
  personalWorkspace.name = workspaceId;
  personalWorkspace.displayName = "Personal";
  personalWorkspace.description = "Repository-safety and research prompts";
  personalWorkspace.touchPageNames = [touchPageId];
  personalWorkspace.encoderPageNames = [encoderPageId];
  personalWorkspace.wheelPageNames = [wheelPageId];

  const personalTouchPage = clone(sourceTouchPage);
  personalTouchPage.name = touchPageId;
  personalTouchPage.displayName = "Personal";

  const personalEncoderPage = clone(sourceEncoderPage);
  personalEncoderPage.name = encoderPageId;

  const personalWheelPage = clone(sourceWheelPage);
  personalWheelPage.name = wheelPageId;

  mainMode.workspaces.push(personalWorkspace);
  mainMode.touchPages.push(personalTouchPage);
  mainMode.encoderPages.push(personalEncoderPage);
  mainMode.wheelPages.push(personalWheelPage);
  return personalWorkspace;
}

ensurePersonalWorkspace();

function ensureGuidedToolWorkspace(displayName, slug, description) {
  const existing = mainMode.workspaces.find(
    (entry) => entry.displayName === displayName,
  );
  if (existing) return existing;

  const sourceWorkspace = mainMode.workspaces.find(
    (entry) => entry.displayName === "Skills",
  );
  const sourceTouchPage = mainMode.touchPages.find(
    (entry) => entry.name === sourceWorkspace.touchPageNames[0],
  );
  const sourceEncoderPage = mainMode.encoderPages.find(
    (entry) => entry.name === sourceWorkspace.encoderPageNames[0],
  );
  const sourceWheelPage = mainMode.wheelPages.find(
    (entry) => entry.name === sourceWorkspace.wheelPageNames[0],
  );
  if (!sourceTouchPage || !sourceEncoderPage || !sourceWheelPage) {
    throw new Error(`Skills workspace is missing a page needed for ${displayName}.`);
  }

  const workspaceId = stableId(`workspace:${slug}`);
  const touchPageId = stableId(`touch-page:${slug}`);
  const encoderPageId = stableId(`encoder-page:${slug}`);
  const wheelPageId = stableId(`wheel-page:${slug}`);

  const guidedWorkspace = clone(sourceWorkspace);
  guidedWorkspace.name = workspaceId;
  guidedWorkspace.displayName = displayName;
  guidedWorkspace.description = description;
  guidedWorkspace.touchPageNames = [touchPageId];
  guidedWorkspace.encoderPageNames = [encoderPageId];
  guidedWorkspace.wheelPageNames = [wheelPageId];

  const guidedTouchPage = clone(sourceTouchPage);
  guidedTouchPage.name = touchPageId;
  guidedTouchPage.displayName = displayName;

  const guidedEncoderPage = clone(sourceEncoderPage);
  guidedEncoderPage.name = encoderPageId;

  const guidedWheelPage = clone(sourceWheelPage);
  guidedWheelPage.name = wheelPageId;

  mainMode.workspaces.push(guidedWorkspace);
  mainMode.touchPages.push(guidedTouchPage);
  mainMode.encoderPages.push(guidedEncoderPage);
  mainMode.wheelPages.push(guidedWheelPage);
  return guidedWorkspace;
}

ensureGuidedToolWorkspace(
  "Create",
  "create",
  "Guided creative, document, design, and build tool prompts",
);
ensureGuidedToolWorkspace(
  "Operate",
  "operate",
  "Guided browser, app, communication, and service tool prompts",
);

const requiredWorkspaces = [
  "Command",
  "Agents",
  "Skills",
  "Create",
  "Operate",
  "Personal",
  "Quick Text",
];

function shortcut(machine, label) {
  return `${machine}___1033___${label}___`;
}

const customDigit = (digit) =>
  shortcut(
    `Command+Control+AltOrOption+Key${digit}`,
    `Cmd+Opt+Ctrl+${digit}`,
  );

const actionSpecs = [
  ["new-chat", "New Chat", shortcut("Command+KeyN", "Cmd+N"), "new-chat"],
  ["quick-chat", "Quick Chat", shortcut("Command+AltOrOption+KeyN", "Cmd+Opt+N"), "quick-chat"],
  ["side-chat", "Side Chat", shortcut("Command+AltOrOption+KeyS", "Cmd+Opt+S"), "side-chat"],
  ["search", "Switch Chat", customDigit(8), "search"],
  ["project", "Choose Project", shortcut("Command+AltOrOption+Shift+KeyO", "Cmd+Opt+Shift+O"), "project"],
  ["add-files", "Add Files", customDigit(6), "add-files"],
  ["add-photos", "Add Photos", customDigit(7), "add-photos"],
  ["model", "Choose Model", shortcut("Control+Shift+KeyM", "Ctrl+Shift+M"), "model"],
  ["voice", "Voice", customDigit(9), "voice"],
  ["dictate", "Dictate", customDigit(0), "dictate"],
  ["plan", "Plan Mode", customDigit(1), "plan"],
  ["fast", "Fast Mode", customDigit(2), "fast"],
  ["previous", "Previous Task", shortcut("Command+Shift+Oem4", "Cmd+Shift+Oem4"), "previous"],
  ["next", "Next Task", shortcut("Command+Shift+Oem6", "Cmd+Shift+Oem6"), "next"],
  ["approve", "Approve", shortcut("Enter", "Return"), "approve"],
  ["cancel", "Decline / Cancel", shortcut("Escape", "Escape"), "cancel"],
  ["reasoning-decrease", "Reasoning Down", customDigit(3), "reasoning"],
  ["reasoning-increase", "Reasoning Up", customDigit(4), "reasoning"],
  ["reasoning-cycle", "Cycle Reasoning", customDigit(5), "reasoning"],
  ["open-terminal", "Open Terminal", shortcut("Control+Oem3", "Ctrl+`"), "build"],
  ["zoom-reset", "Reset Zoom", shortcut("Command+Key0", "Cmd+0"), "zoom"],
];
const labeledCommandSlugs = new Set([
  "new-chat",
  "quick-chat",
  "side-chat",
  "search",
  "project",
  "add-files",
  "add-photos",
  "model",
  "voice",
  "dictate",
  "plan",
  "fast",
]);

for (let task = 1; task <= 9; task += 1) {
  actionSpecs.push([
    `task-${task}`,
    `Task ${task}`,
    shortcut(`Command+Key${task}`, `Cmd+${task}`),
    `task-${task}`,
  ]);
}

function createProfileAction([slug, displayName, keyboardKey, icon]) {
  const id = stableId(`profile-action:${slug}`);
  return {
    slug,
    icon,
    actionName: `$@Generic___@ProfileAction___${id}`,
    profileAction: {
      $type: "Loupedeck.Service.ApplicationProfileCommand, LoupedeckService",
      isCommand: true,
      name: `$@Generic___@ProfileAction___${id}`,
      templateActionName: "$@Generic___@KeyboardKey",
      actionParameters: {
        $type: "Loupedeck.ActionEditorActionParameters, PluginApi",
        parameters: {
          $type: "Loupedeck.StringDictionaryNoCase, PluginApi",
          keyboardKey,
        },
        count: 1,
      },
      displayName,
      description: `Codex Control · ${displayName}`,
      groupName: "Codex Control",
      superGroupName: "@macro",
      isProfileAction: true,
      isMultiState: false,
      isResetCommand: false,
      adjustmentName: null,
      states: null,
    },
  };
}

const generatedActions = actionSpecs.map(createProfileAction);
const actionBySlug = new Map(
  generatedActions.map((action) => [action.slug, action]),
);
const generatedActionNames = new Set(
  generatedActions.map((action) => action.actionName),
);

profile.profileActions = (profile.profileActions ?? []).filter(
  (action) => !generatedActionNames.has(action.name),
);
profile.profileActions.push(
  ...generatedActions.map((action) => action.profileAction),
);

function editorCommand(adjustmentSlug, direction, keyboardKey) {
  const name = stableId(`editor-command:${adjustmentSlug}:${direction}`);
  return {
    name,
    value: {
      $type: "Loupedeck.Service.MacroActionEditorCommand, LoupedeckService",
      name,
      templateName: "$@Generic___@KeyboardKey",
      actionParameters: {
        $type:
          "System.Collections.Generic.Dictionary`2[[System.String, System.Private.CoreLib],[System.String, System.Private.CoreLib]], System.Private.CoreLib",
        keyboardKey,
      },
    },
  };
}

const adjustmentSpecs = [
  {
    slug: "task-history",
    displayName: "Task History",
    icon: "task-history",
    left: shortcut("Command+Shift+Oem4", "Cmd+Shift+Oem4"),
    right: shortcut("Command+Shift+Oem6", "Cmd+Shift+Oem6"),
  },
  {
    slug: "scroll",
    displayName: "Transcript Scroll",
    icon: "scroll",
    left: shortcut("ArrowUp", "ArrowUp"),
    right: shortcut("ArrowDown", "ArrowDown"),
  },
  {
    slug: "zoom",
    displayName: "Interface Zoom",
    icon: "zoom",
    left: shortcut("Command+Minus", "Cmd+Minus"),
    right: shortcut("Command+Equals", "Cmd+Equals"),
    reset: shortcut("Command+Key0", "Cmd+0"),
  },
  {
    slug: "reasoning",
    displayName: "Reasoning Effort",
    icon: "reasoning",
    left: customDigit(3),
    right: customDigit(4),
    reset: customDigit(5),
  },
  {
    slug: "reasoning-wheel",
    displayName: "Reasoning Wheel",
    icon: wheelImplementation.idleAsset,
    iconType: "wheel-raster",
    left: customDigit(3),
    right: customDigit(4),
    reset: customDigit(5),
  },
  {
    slug: "tab-navigation",
    displayName: "Tab Navigation",
    icon: "task-history",
    left: shortcut("Control+Shift+Tab", "Ctrl+Shift+Tab"),
    right: shortcut("Control+Tab", "Ctrl+Tab"),
  },
];

function createAdjustment(spec) {
  const id = stableId(`macro-adjustment:${spec.slug}`);
  const left = editorCommand(spec.slug, "left", spec.left);
  const right = editorCommand(spec.slug, "right", spec.right);
  const reset = spec.reset
    ? editorCommand(spec.slug, "reset", spec.reset)
    : null;
  const actionEditorCommands = [left.value, right.value];
  if (reset) actionEditorCommands.push(reset.value);

  return {
    ...spec,
    id,
    actionName: `$@Generic___@MacroAdjustment___${id}`,
    macroAdjustment: {
      $type:
        "Loupedeck.Service.ApplicationProfileMacroAdjustment, LoupedeckService",
      isCommand: false,
      name: id,
      displayName: spec.displayName,
      description: `Codex Control · ${spec.displayName}`,
      groupName: "Codex Control",
      superGroupName: "@macro",
      supportedOs: "All",
      supportedModes: ["main"],
      showAsSingleAction: false,
      actionEditorCommands,
      actionsBefore: [],
      actionsLeft: [left.name],
      actionsRight: [right.name],
      actionsReset: reset ? [reset.name] : [],
      clickRateLimit: 9,
    },
  };
}

const generatedAdjustments = adjustmentSpecs.map(createAdjustment);
const adjustmentBySlug = new Map(
  generatedAdjustments.map((adjustment) => [adjustment.slug, adjustment]),
);
const generatedAdjustmentIds = new Set(
  generatedAdjustments.map((adjustment) => adjustment.id),
);

profile.macroAdjustments = (profile.macroAdjustments ?? []).filter(
  (adjustment) => !generatedAdjustmentIds.has(adjustment.name),
);
profile.macroAdjustments.push(
  ...generatedAdjustments.map((adjustment) => adjustment.macroAdjustment),
);

const skillMacros = {
  plan: "CC96A2EE2DD94B18ACAD8E5D33700CE0",
  build: "9437119AFC07454EA11E0E02D4AF25CF",
  debug: "00AD64EDE9474C53A423E195803FE3ED",
  review: "40E19C0B37A54E89B3C3BE9493B88E37",
  test: "3A3F57BD587A47E7A99ACBC02E95EBA8",
  refactor: "29494D515259486BAF75185FC335397D",
  explain: "5E3B7E1944E249E68B3D4C1FCD350F66",
  docs: "6DCDCC3644DF4C2595AABE1B69148E23",
  research: "F7CDF50C1CB74ABEA4FA179C66141E10",
  "ui-polish": "51C067C111C548358C0BFEC2AFCAE3C5",
  visuals: "E79FB64AF35E480582EF63485376EC9F",
  continue: "B94F3B94D3434530B903C0ACDBD17298",
};

const quickTextSpecs = [
  {
    slug: "finish-it",
    label: "Finish It",
    icon: "finish-it",
    text: "Continue working autonomously until this is genuinely complete. Fix anything still blocking the result, validate it, and tell me exactly what changed.",
  },
  {
    slug: "status-check",
    label: "Status",
    icon: "status-check",
    text: "Inspect the current state and give me a concise status: what is done, what is broken or uncertain, and the best next step.",
  },
  {
    slug: "root-cause",
    label: "Root Cause",
    icon: "root-cause",
    text: "Diagnose the root cause, implement the proper fix, and verify that the issue is actually resolved.",
  },
  {
    slug: "check-rest",
    label: "Check Rest",
    icon: "check-rest",
    text: "Check the rest of this carefully for related issues or missing pieces. Fix what is in scope and report anything that still needs me.",
  },
  {
    slug: "update-docs",
    label: "Update Docs",
    icon: "update-docs",
    text: "Update all relevant documentation and the appropriate worklog so they accurately match the final implementation.",
  },
  {
    slug: "validate-all",
    label: "Validate All",
    icon: "validate-all",
    text: "Run the appropriate tests and validation checks. Fix in-scope failures, then report the exact results honestly.",
  },
  {
    slug: "review-changes",
    label: "Review Changes",
    icon: "review-changes",
    text: "Review the current changes for bugs, regressions, security concerns, release risks, and missing tests. Lead with actionable findings.",
  },
  {
    slug: "make-nice",
    label: "Make It Nice",
    icon: "make-nice",
    text: "Polish this so it feels cohesive, intuitive, and production-ready while preserving the existing functionality.",
  },
  {
    slug: "simplify",
    label: "Simplify",
    icon: "simplify",
    text: "Simplify this implementation and remove unnecessary complexity without changing the intended behavior.",
  },
  {
    slug: "best-judgment",
    label: "Best Judgment",
    icon: "best-judgment",
    text: "Use your best judgment and make reasonable decisions to move this forward without waiting for minor clarifications. Flag only choices that materially change the outcome.",
  },
  {
    slug: "handoff",
    label: "Handoff",
    icon: "handoff",
    text: "Give me a clear handoff with what was completed, files changed, validation performed, remaining risks, and the next useful step.",
  },
  {
    slug: "match-visual",
    label: "Match Visual",
    icon: "match-visual",
    text: "Compare the implementation carefully against the provided screenshot or reference, identify visible differences, and fix the in-scope mismatches.",
  },
];

const personalSpecs = [
  {
    slug: "inspect-first",
    label: "Inspect First",
    icon: "inspect-first",
    text: "Before changing anything, read AGENTS.md and the relevant project documentation, inspect the affected files and current behavior, then briefly state the implementation plan.",
  },
  {
    slug: "find-root",
    label: "Find Root",
    icon: "find-root",
    text: "Identify the real project root and determine which instruction files apply before editing. Do not assume the currently open folder is the correct root.",
  },
  {
    slug: "lock-scope",
    label: "Lock Scope",
    icon: "lock-scope",
    text: "Define what is in scope and what must not be touched. Stay inside the assigned task and do not change unrelated logic, UI, data, wording, files, or behavior.",
  },
  {
    slug: "preserve",
    label: "Preserve",
    icon: "preserve",
    text: "Preserve all existing functionality and visual behavior unless the requested feature specifically requires changing it. Add around the current system instead of replacing it.",
  },
  {
    slug: "small-fix",
    label: "Small Fix",
    icon: "small-fix",
    text: "Make the smallest practical and safe change that completely solves the problem. Avoid broad rewrites, unnecessary dependencies, or architecture changes.",
  },
  {
    slug: "use-existing",
    label: "Use Existing",
    icon: "use-existing",
    text: "Reuse the project's existing components, patterns, utilities, styles, data flow, and dependencies before creating anything new.",
  },
  {
    slug: "full-files",
    label: "Full Files",
    icon: "full-files",
    text: "Apply complete file rewrites for every file you change rather than giving partial snippets. Preserve all unrelated code and content.",
  },
  {
    slug: "source-truth",
    label: "Source Truth",
    icon: "source-truth",
    text: "Treat the existing repository, data files, and established workflow as the source of truth. Do not create a parallel system, duplicate database, competing configuration, or second workflow.",
  },
  {
    slug: "no-guessing",
    label: "No Guessing",
    icon: "no-guessing",
    text: "Do not invent commands, APIs, file paths, results, or capabilities. Verify them from the project or authoritative sources, and clearly identify anything that remains unknown.",
  },
  {
    slug: "keep-going",
    label: "Keep Going",
    icon: "keep-going",
    text: "Use the context already available, make reasonable decisions, and complete the task without stopping for unnecessary questions. Continue through implementation, verification, and cleanup.",
  },
  {
    slug: "deep-research",
    label: "Deep Research",
    icon: "deep-research",
    text: "Research this thoroughly using the browser. Keep digging through official documentation, GitHub, Reddit, forums, videos, public repositories, and relevant examples. Cite sources and separate verified facts from inference.",
  },
  {
    slug: "audit-only",
    label: "Audit Only",
    icon: "audit-only",
    text: "Audit the project and classify findings as source code, documentation, assets, generated output, local/private content, safe cleanup, or risky/unknown. Do not delete or modify anything.",
  },
];

const createSpecs = [
  {
    slug: "creative",
    label: "Creative",
    icon: "creative",
    text: "Use the Creative Production plugin and choose its best-fitting intake or production skill for this task.",
  },
  {
    slug: "documents",
    label: "Documents",
    icon: "documents",
    text: "Use the Documents plugin and its Documents skill for this task. Preserve existing structure and formatting unless the request requires a change.",
  },
  {
    slug: "sheets",
    label: "Sheets",
    icon: "sheets",
    text: "Use the Spreadsheets plugin for this workbook or data task. Preserve formulas, formatting, and workbook structure unless I request changes.",
  },
  {
    slug: "pdf",
    label: "PDF",
    icon: "pdf",
    text: "Use the PDF skill for this task. Inspect, create, edit, or validate the PDF as needed and visually verify the final pages.",
  },
  {
    slug: "slides",
    label: "Slides",
    icon: "slides",
    text: "Use the Presentations skill for this task. Build or refine the deck with clear hierarchy, cohesive visuals, and validated slide output.",
  },
  {
    slug: "templates",
    label: "Templates",
    icon: "templates",
    text: "Use the Template Creator skill to create or update a reusable template that follows the requested workflow and established conventions.",
  },
  {
    slug: "sites",
    label: "Sites",
    icon: "sites",
    text: "Use the Sites plugin and its applicable building or hosting skill for this website task.",
  },
  {
    slug: "product-design",
    label: "Product Design",
    icon: "product-design",
    text: "Use the Product Design plugin and its best-fitting skill to audit, ideate, or implement this product-design task.",
  },
  {
    slug: "expo",
    label: "Expo",
    icon: "expo",
    text: "Use the Expo plugin and its most applicable skill for this React Native or Expo task while preserving native platform behavior.",
  },
  {
    slug: "remotion",
    label: "Remotion",
    icon: "remotion",
    text: "Use the Remotion skill and its established best practices for this video composition or rendering task.",
  },
  {
    slug: "lr-hdr",
    label: "LR HDR",
    icon: "lr-hdr",
    text: "Use the $lightroom-classic-hdr-import skill for this SD-card import, auto-stack, or batch HDR task. Preserve the current Lightroom destination and settings.",
  },
  {
    slug: "imagegen",
    label: "ImageGen",
    icon: "imagegen",
    text: "Use the ImageGen skill to create or edit the requested image, matching supplied references and preserving required text and layout constraints.",
  },
];

const operateSpecs = [
  {
    slug: "browser",
    label: "Browser",
    icon: "browser",
    text: "Use the Browser plugin to inspect or operate the in-app browser for this task. Read the visible state before taking action.",
  },
  {
    slug: "computer",
    label: "Computer",
    icon: "computer",
    text: "Use the Computer Use plugin to inspect or operate the relevant Mac app for this task, following the applicable safety and confirmation rules.",
  },
  {
    slug: "gmail",
    label: "Gmail",
    icon: "gmail",
    text: "Use the Gmail plugin and its applicable skill for this task. Read first and stage consequential actions unless I explicitly authorize them.",
  },
  {
    slug: "mail",
    label: "Mail",
    icon: "mail",
    text: "Use Computer Use with Apple Mail for this task. Follow the active workspace’s Mail rules, inspect the targeted message first, and do not mutate Mail unless I explicitly authorize it.",
  },
  {
    slug: "lightroom",
    label: "Lightroom",
    icon: "lightroom",
    text: "Use Computer Use with Adobe Lightroom Classic for this task. Inspect the current catalog and app state first and preserve existing import, metadata, file, and destination settings.",
  },
  {
    slug: "numbers",
    label: "Numbers",
    icon: "numbers",
    text: "Use Computer Use with Apple Numbers for this task. Preserve formulas, formatting, sheets, and data unless I request changes.",
  },
  {
    slug: "pages",
    label: "Pages",
    icon: "pages",
    text: "Use Computer Use with Apple Pages for this task. Preserve document structure, styles, and content unless I request changes.",
  },
  {
    slug: "github",
    label: "GitHub",
    icon: "github",
    text: "Use the GitHub plugin and its best-fitting skill for this repository or pull-request task. Inspect the current state before any external mutation.",
  },
  {
    slug: "calendar",
    label: "Calendar",
    icon: "calendar",
    text: "Use the Google Calendar plugin for this task. Read current state first and do not create, edit, or delete events unless explicitly authorized.",
  },
  {
    slug: "drive",
    label: "Drive",
    icon: "drive",
    text: "Use the Google Drive plugin for this task. Preserve ownership and sharing, and do not move or delete content unless explicitly requested.",
  },
  {
    slug: "openai-docs",
    label: "OpenAI Docs",
    icon: "openai-docs",
    text: "Use the OpenAI Docs skill and official OpenAI sources for this OpenAI product or API task.",
  },
  {
    slug: "canva",
    label: "Canva",
    icon: "canva",
    text: "Use the Canva plugin and its best-fitting skill for this design task, preserving brand and layout constraints.",
  },
];

const quickTextMacros = quickTextSpecs.map((spec) => {
  const id = stableId(`quick-text:${spec.slug}`);
  return {
    ...spec,
    id,
    actionName: `$@Generic___@Macro___${id}`,
    macroCommand: {
      $type: "Loupedeck.Service.ApplicationProfileMacroCommand, LoupedeckService",
      isCommand: true,
      name: id,
      displayName: spec.label,
      description: "Paste-only reusable Codex prompt",
      groupName: "Quick Text",
      superGroupName: "@macro",
      supportedOs: "All",
      supportedModes: ["main"],
      showAsSingleAction: true,
      actionEditorCommands: [],
      isMultiState: false,
      actions: [`$@Generic___@TypeText___${spec.text}`],
    },
  };
});

const quickTextIds = new Set(quickTextMacros.map((entry) => entry.id));
profile.macroCommands = (profile.macroCommands ?? []).filter(
  (command) => !quickTextIds.has(command.name),
);
profile.macroCommands.push(...quickTextMacros.map((entry) => entry.macroCommand));

const personalMacros = personalSpecs.map((spec) => {
  const id = stableId(`personal:${spec.slug}`);
  return {
    ...spec,
    id,
    actionName: `$@Generic___@Macro___${id}`,
    macroCommand: {
      $type: "Loupedeck.Service.ApplicationProfileMacroCommand, LoupedeckService",
      isCommand: true,
      name: id,
      displayName: spec.label,
      description: "Paste-only personal Codex prompt",
      groupName: "Personal",
      superGroupName: "@macro",
      supportedOs: "All",
      supportedModes: ["main"],
      showAsSingleAction: true,
      actionEditorCommands: [],
      isMultiState: false,
      actions: [`$@Generic___@TypeText___${spec.text}`],
    },
  };
});

const personalIds = new Set(personalMacros.map((entry) => entry.id));
profile.macroCommands = (profile.macroCommands ?? []).filter(
  (command) => !personalIds.has(command.name),
);
profile.macroCommands.push(...personalMacros.map((entry) => entry.macroCommand));

function createGuidedMacros(workspaceName, slugPrefix, specs) {
  return specs.map((spec) => {
    const id = stableId(`${slugPrefix}:${spec.slug}`);
    return {
      ...spec,
      id,
      actionName: `$@Generic___@Macro___${id}`,
      macroCommand: {
        $type: "Loupedeck.Service.ApplicationProfileMacroCommand, LoupedeckService",
        isCommand: true,
        name: id,
        displayName: spec.label,
        description: "Paste-only guided skill/tool prompt",
        groupName: workspaceName,
        superGroupName: "@macro",
        supportedOs: "All",
        supportedModes: ["main"],
        showAsSingleAction: true,
        actionEditorCommands: [],
        isMultiState: false,
        actions: [`$@Generic___@TypeText___${spec.text}`],
      },
    };
  });
}

const createMacros = createGuidedMacros("Create", "create", createSpecs);
const operateMacros = createGuidedMacros("Operate", "operate", operateSpecs);
const guidedMacroIds = new Set(
  [...createMacros, ...operateMacros].map((entry) => entry.id),
);
profile.macroCommands = (profile.macroCommands ?? []).filter(
  (command) => !guidedMacroIds.has(command.name),
);
profile.macroCommands.push(
  ...createMacros.map((entry) => entry.macroCommand),
  ...operateMacros.map((entry) => entry.macroCommand),
);

const availableMacroIds = new Set(
  (profile.macroCommands ?? []).map((command) => command.name),
);
for (const [skill, macroId] of Object.entries(skillMacros)) {
  if (!availableMacroIds.has(macroId)) {
    throw new Error(`Missing review-first macro for ${skill}: ${macroId}`);
  }
}

const direct = (slug) => actionBySlug.get(slug).actionName;
const adjustment = (slug) => adjustmentBySlug.get(slug).actionName;
const macro = (slug) => `$@Generic___@Macro___${skillMacros[slug]}`;
const quickMacro = (slug) =>
  quickTextMacros.find((entry) => entry.slug === slug).actionName;
const personalMacro = (slug) =>
  personalMacros.find((entry) => entry.slug === slug).actionName;
const createMacro = (slug) =>
  createMacros.find((entry) => entry.slug === slug).actionName;
const operateMacro = (slug) =>
  operateMacros.find((entry) => entry.slug === slug).actionName;
const workspace = (displayName) =>
  mainMode.workspaces.find((entry) => entry.displayName === displayName);
const changeWorkspace = (displayName) =>
  `$@Generic___@ChangeWorkspace___main|${workspace(displayName).name}`;

function assignTouchPage(workspaceName, actions) {
  const targetWorkspace = workspace(workspaceName);
  const page = mainMode.touchPages.find(
    (candidate) => candidate.name === targetWorkspace.touchPageNames[0],
  );
  if (!page || page.controls.length < actions.length) {
    throw new Error(`Touch page is incomplete for ${workspaceName}`);
  }
  page.displayName = workspaceName;
  actions.forEach((action, index) => {
    page.controls[index].pressAction = action;
    page.controls[index].fnPressAction = null;
  });
  for (let index = actions.length; index < page.controls.length; index += 1) {
    page.controls[index].pressAction = null;
    page.controls[index].fnPressAction = null;
  }
}

assignTouchPage("Command", [
  direct("new-chat"),
  direct("quick-chat"),
  direct("side-chat"),
  direct("search"),
  direct("project"),
  direct("add-files"),
  direct("add-photos"),
  direct("model"),
  direct("voice"),
  direct("dictate"),
  direct("plan"),
  direct("fast"),
]);

assignTouchPage("Agents", [
  direct("task-1"),
  direct("task-2"),
  direct("task-3"),
  direct("task-4"),
  direct("task-5"),
  direct("task-6"),
  direct("task-7"),
  direct("task-8"),
  direct("task-9"),
  direct("previous"),
  direct("next"),
  direct("search"),
]);

assignTouchPage("Skills", [
  macro("plan"),
  macro("build"),
  macro("debug"),
  macro("review"),
  macro("test"),
  macro("refactor"),
  macro("explain"),
  macro("docs"),
  macro("research"),
  macro("ui-polish"),
  macro("visuals"),
  macro("continue"),
]);

assignTouchPage(
  "Quick Text",
  quickTextSpecs.map((entry) => quickMacro(entry.slug)),
);

assignTouchPage(
  "Personal",
  personalSpecs.map((entry) => personalMacro(entry.slug)),
);

assignTouchPage(
  "Create",
  createSpecs.map((entry) => createMacro(entry.slug)),
);

assignTouchPage(
  "Operate",
  operateSpecs.map((entry) => operateMacro(entry.slug)),
);

const roundActions = [
  [changeWorkspace("Command"), null],
  [changeWorkspace("Agents"), null],
  [changeWorkspace("Skills"), null],
  [direct("new-chat"), direct("quick-chat")],
  [changeWorkspace("Create"), null],
  [changeWorkspace("Operate"), direct("fast")],
  [changeWorkspace("Personal"), direct("approve")],
  [changeWorkspace("Quick Text"), null],
];

roundActions.forEach(([pressAction, fnPressAction], index) => {
  profile.layout.roundPage.controls[index].pressAction = pressAction;
  profile.layout.roundPage.controls[index].fnPressAction = fnPressAction;
});

const squareActions = [
  [direct("approve"), null],
  [direct("new-chat"), direct("quick-chat")],
  [direct("previous"), direct("task-1")],
  [direct("next"), direct("task-2")],
  [direct("search"), direct("side-chat")],
  [direct("plan"), direct("fast")],
  [changeWorkspace("Personal"), direct("reasoning-increase")],
  [changeWorkspace("Quick Text"), direct("reasoning-decrease")],
  [changeWorkspace("Command"), null],
  [changeWorkspace("Agents"), null],
  [changeWorkspace("Skills"), null],
  [direct("cancel"), null],
];

squareActions.forEach(([pressAction, fnPressAction], index) => {
  profile.layout.squarePage.controls[index].pressAction = pressAction;
  profile.layout.squarePage.controls[index].fnPressAction = fnPressAction;
});

for (const targetWorkspace of mainMode.workspaces) {
  const encoderPage = mainMode.encoderPages.find(
    (candidate) => candidate.name === targetWorkspace.encoderPageNames[0],
  );
  if (!encoderPage || encoderPage.controls.length < 6) {
    throw new Error(`Encoder page is incomplete for ${targetWorkspace.displayName}`);
  }
  encoderPage.displayName = "Codex Dials";
  const encoderAssignments = [
    [direct("search"), adjustment("task-history")],
    [null, adjustment("scroll")],
    [direct("zoom-reset"), adjustment("zoom")],
    [direct("reasoning-cycle"), adjustment("reasoning")],
    ["$DefaultMac___ResetVolume", "$DefaultMac___Volume"],
    [direct("open-terminal"), adjustment("tab-navigation")],
  ];
  encoderAssignments.forEach(([pressAction, rotateAction], index) => {
    const control = encoderPage.controls[index];
    control.pressAction = pressAction;
    control.rotateAction = rotateAction;
    control.fnPressAction = null;
    control.fnRotateAction = null;
  });

  const wheelPage = mainMode.wheelPages.find(
    (candidate) => candidate.name === targetWorkspace.wheelPageNames[0],
  );
  if (!wheelPage) {
    throw new Error(`Wheel page is missing for ${targetWorkspace.displayName}`);
  }
  wheelPage.displayName = "Reasoning";
  wheelPage.description = "Turn to lower or raise reasoning effort; tap to cycle.";
  wheelPage.templateName = wheelImplementation.renderer;
  wheelPage.parameters = wheelImplementation.plugin
    ? {
        $type: "Loupedeck.StringDictionaryNoCase, PluginApi",
        adjustment: adjustment("reasoning-wheel"),
      }
    : {
        $type: "Loupedeck.StringDictionaryNoCase, PluginApi",
        actions: adjustment("reasoning-wheel"),
        adjustment: adjustment("reasoning-wheel"),
      };
}

workspace("Command").description = "Primary ChatGPT commands";
workspace("Agents").description = "Task and agent navigation";
workspace("Skills").description = "Review-first prompt starters";
workspace("Create").description =
  "Guided creative, document, design, and build tool prompts";
workspace("Operate").description =
  "Guided browser, app, communication, and service tool prompts";
workspace("Quick Text").description = "Reusable completion and quality prompts";
workspace("Personal").description = "Repository-safety and research prompts";
mainMode.homeWorkspaceName = workspace("Command").name;
profile.description =
  "Codex Control · commands, task navigation, guided create and operate tools, review-first skills, personal guardrails, and premium Codex Signal icons.";
profile.lastModifiedTimeUtc = profileRevisionUtc;

function writeActionIcon(actionName, iconSlug, labeledPage = null, iconType = "svg") {
  const iconPath = iconType === "wheel-raster"
    ? path.join(wheelIconSourceDir, iconSlug)
    : labeledPage
    ? path.join(labeledIconSourceDir, labeledPage, `${iconSlug}.svg`)
    : path.join(iconSourceDir, `${iconSlug}.svg`);
  if (!fs.existsSync(iconPath)) {
    throw new Error(`Missing icon source: ${iconPath}`);
  }
  const template = {
    backgroundColor: 4278190080,
    items: [
      {
        $type: "Loupedeck.Service.ActionIconImageItem, LoupedeckShared",
        image: fs.readFileSync(iconPath).toString("base64"),
        imageFileName: iconType === "wheel-raster"
          ? iconSlug
          : labeledPage
          ? `${labeledPage}-${iconSlug}.svg`
          : `${iconSlug}.svg`,
        imageColor: 4294967295,
        imageRotation: "None",
        isVisible: true,
        itemType: "Image",
        area: { x: 0, y: 0, width: 100, height: 100 },
      },
    ],
  };
  fs.writeFileSync(
    path.join(actionIconDir, `${actionName}.ict`),
    `${JSON.stringify(template, null, 2)}\n`,
  );
}

fs.mkdirSync(actionIconDir, { recursive: true });
for (const action of generatedActions) {
  writeActionIcon(
    action.actionName,
    action.icon,
    labeledCommandSlugs.has(action.slug) ? "command" : null,
  );
}
for (const adjustmentAction of generatedAdjustments) {
  writeActionIcon(
    adjustmentAction.actionName,
    adjustmentAction.icon,
    null,
    adjustmentAction.iconType,
  );
}
for (const [skill, macroId] of Object.entries(skillMacros)) {
  writeActionIcon(`$@Generic___@Macro___${macroId}`, skill, "skills");
}
for (const quickTextMacro of quickTextMacros) {
  writeActionIcon(quickTextMacro.actionName, quickTextMacro.icon, "quick-text");
}
for (const personalEntry of personalMacros) {
  writeActionIcon(personalEntry.actionName, personalEntry.icon, "personal");
}
for (const createEntry of createMacros) {
  writeActionIcon(createEntry.actionName, createEntry.icon, "create");
}
for (const operateEntry of operateMacros) {
  writeActionIcon(operateEntry.actionName, operateEntry.icon, "operate");
}

fs.writeFileSync(profilePath, `${JSON.stringify(profile, null, 4)}\n`);

// Loupedeck stores the colored workspace-button rings beside ProfileInfo.json.
// Preserve every current workspace color from the fresh source snapshot and append
// only the new Create and Operate colors.
const actionColorsDir = path.join(profileDir, "ActionColors");
fs.mkdirSync(actionColorsDir, { recursive: true });
const actionColorsPath = path.join(actionColorsDir, "ActionColors.json");
const actionColors = fs.existsSync(actionColorsPath)
  ? JSON.parse(fs.readFileSync(actionColorsPath, "utf8"))
  : {};
actionColors[changeWorkspace("Create")] = 0xff9a2e;
actionColors[changeWorkspace("Operate")] = 0x15c7b7;
fs.writeFileSync(
  actionColorsPath,
  `${JSON.stringify(actionColors, null, 4)}\n`,
);

const customBindings = [
  ["Ctrl+Opt+Cmd+1", "Plan mode"],
  ["Ctrl+Opt+Cmd+2", "Fast mode"],
  ["Ctrl+Opt+Cmd+3", "Reasoning effort down"],
  ["Ctrl+Opt+Cmd+4", "Reasoning effort up"],
  ["Ctrl+Opt+Cmd+5", "Cycle reasoning effort"],
  ["Ctrl+Opt+Cmd+6", "Add files"],
  ["Ctrl+Opt+Cmd+7", "Add photos"],
  ["Ctrl+Opt+Cmd+8", "Switch chat"],
  ["Ctrl+Opt+Cmd+9", "Hold-to-dictate hotkey"],
  ["Ctrl+Opt+Cmd+0", "Toggle dictation hotkey"],
];

const manifest = {
  formatVersion: 1,
  generatedAt: profileRevisionUtc,
  sourceAppRoot: path.relative(projectRoot, sourceAppRoot),
  outputAppRoot: path.basename(outputAppRoot),
  profileId: profile.name,
  applicationName: profile.applicationName,
  deviceType: profile.deviceType,
  style: "Codex Signal",
  workspaces: {
    Command: [
      "New Chat",
      "Quick Chat",
      "Side Chat",
      "Switch Chat",
      "Choose Project",
      "Add Files",
      "Add Photos",
      "Choose Model",
      "Voice · hold to dictate",
      "Dictate",
      "Plan Mode",
      "Fast Mode",
    ],
    Agents: [
      "Task 1",
      "Task 2",
      "Task 3",
      "Task 4",
      "Task 5",
      "Task 6",
      "Task 7",
      "Task 8",
      "Task 9",
      "Previous Task",
      "Next Task",
      "Switch Chat",
    ],
    Skills: Object.keys(skillMacros),
    Create: createSpecs.map((entry) => entry.label),
    Operate: operateSpecs.map((entry) => entry.label),
    "Quick Text": quickTextSpecs.map((entry) => entry.label),
    Personal: personalSpecs.map((entry) => entry.label),
  },
  controls: {
    roundButtons: [
      "Command workspace",
      "Agents workspace",
      "Skills workspace",
      "New Chat",
      "Create workspace · Fn empty",
      "Operate workspace · Fn Fast Mode",
      "Personal workspace · Fn Approve",
      "Quick Text workspace",
    ],
    dials: [
      "Task History",
      "Transcript Scroll",
      "Interface Zoom",
      "Reasoning Effort",
      "System Volume",
      "Tab Navigation",
    ],
    centerWheel: "Reasoning effort down / up; tap to cycle",
    bottomRightDialPress: "Open Terminal",
    voiceControl: "Hold Voice to dictate; press Dictate once to start or stop",
    declineControl: "Bottom-right square button",
    rightSquareButtons: [
      "A · Personal workspace · Fn Reasoning Up",
      "B · Agents workspace",
      "C · Quick Text workspace · Fn Reasoning Down",
      "D · Skills workspace",
      "Fn · Activate FN layer",
      "E · Decline / Cancel",
    ],
  },
  centerWheel: {
    implementationMode: wheelMode,
    renderer: wheelImplementation.renderer,
    rendererVersion: wheelImplementation.rendererVersion,
    plugin: wheelImplementation.plugin
      ? {
          name: wheelImplementation.plugin.name,
          version: wheelImplementation.plugin.version,
          sdk: wheelImplementation.plugin.sdk,
          packagePath: path.relative(
            projectRoot,
            wheelImplementation.plugin.packageRoot,
          ),
          pluginFileName: wheelImplementation.plugin.pluginFileName,
          pluginFileSha256: sha256File(pluginDllPath),
        }
      : null,
    visualAcceptance: wheelImplementation.visualAcceptance,
    limitation: wheelImplementation.limitation,
    actionName: adjustment("reasoning-wheel"),
    compactDialActionName: adjustment("reasoning"),
    idleAsset: {
      filename: wheelImplementation.idleAsset,
      workspacePath: path.relative(projectRoot, wheelIdleAssetPath),
      sha256: sha256File(wheelIdleAssetPath),
    },
    pulseAsset: {
      filename: wheelImplementation.pulseAsset,
      workspacePath: path.relative(projectRoot, wheelPulseAssetPath),
      sha256: sha256File(wheelPulseAssetPath),
      durationMs: 220,
      runtimeSupported: wheelImplementation.supportsRuntimePulse,
    },
    behavior: {
      turnLeft: "Control + Option + Command + 3",
      turnRight: "Control + Option + Command + 4",
      tap: "Control + Option + Command + 5",
      persistentReasoningLevel: false,
      pulseMeaning: "Input acknowledgement only; not an authoritative reasoning level",
    },
  },
  customBindings: customBindings.map(([keys, purpose]) => ({ keys, purpose })),
  counts: {
    profileActions: generatedActions.length,
    macroAdjustments: generatedAdjustments.length,
    reviewFirstSkillMacros: Object.keys(skillMacros).length,
    quickTextMacros: quickTextMacros.length,
    personalMacros: personalMacros.length,
    createMacros: createMacros.length,
    operateMacros: operateMacros.length,
    labeledPageActionIcons:
      labeledCommandSlugs.size +
      Object.keys(skillMacros).length +
      quickTextMacros.length +
      personalMacros.length +
      createMacros.length +
      operateMacros.length,
    actionIcons:
      generatedActions.length +
      generatedAdjustments.length +
      Object.keys(skillMacros).length +
      quickTextMacros.length +
      personalMacros.length +
      createMacros.length +
      operateMacros.length,
  },
};

const manifestPath = path.join(path.dirname(outputAppRoot), "install-manifest.json");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const reparsed = JSON.parse(fs.readFileSync(profilePath, "utf8"));
const assignedTouchButtons = reparsed.layout.layoutModes[0].touchPages.reduce(
  (total, page) =>
    total + page.controls.filter((control) => control.pressAction).length,
  0,
);
if (assignedTouchButtons !== 84) {
  throw new Error(`Expected 84 assigned touch buttons, found ${assignedTouchButtons}`);
}
if (reparsed.profileActions.length < generatedActions.length) {
  throw new Error("Generated keyboard actions were not saved.");
}

console.log(`Built profile: ${profilePath}`);
console.log(`Install manifest: ${manifestPath}`);
console.log(`Assigned touch buttons: ${assignedTouchButtons}`);
console.log(`Generated action icons: ${manifest.counts.actionIcons}`);
console.log(`Center wheel mode: ${wheelMode} (${wheelImplementation.renderer})`);
