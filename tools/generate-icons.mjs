import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const iconDir = path.join(projectRoot, "src", "icons");
const labeledIconDir = path.join(iconDir, "labeled");
const wheelIconDir = path.join(iconDir, "wheel");
const outputDir = path.join(projectRoot, "docs", "svg");

fs.mkdirSync(iconDir, { recursive: true });
fs.mkdirSync(labeledIconDir, { recursive: true });
fs.mkdirSync(wheelIconDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const wheelAssets = {
  idle: path.join(wheelIconDir, "reasoning-wheel-idle.png"),
  pulse: path.join(wheelIconDir, "reasoning-wheel-pulse.png"),
};
for (const assetPath of Object.values(wheelAssets)) {
  if (!fs.existsSync(assetPath)) {
    throw new Error(`Missing premium wheel asset: ${assetPath}`);
  }
}
const sha256File = (filePath) =>
  crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
const wheelIdleData = fs.readFileSync(wheelAssets.idle).toString("base64");

fs.writeFileSync(
  path.join(wheelIconDir, "manifest.json"),
  `${JSON.stringify(
    {
      style: "Codex Signal · Premium Reasoning Wheel",
      size: "1024x1024",
      generatedWith: "ImageGen",
      behavior: {
        turnLeft: "Decrease reasoning effort",
        turnRight: "Increase reasoning effort",
        tap: "Cycle reasoning effort",
        pulseMeaning: "Input acknowledgement only; not reasoning-level state",
      },
      assets: {
        idle: {
          filename: path.basename(wheelAssets.idle),
          sha256: sha256File(wheelAssets.idle),
        },
        pulse: {
          filename: path.basename(wheelAssets.pulse),
          sha256: sha256File(wheelAssets.pulse),
          intendedDurationMs: 220,
        },
      },
    },
    null,
    2,
  )}\n`,
);

const colors = {
  cyan: "#35D9FF",
  blue: "#67A7FF",
  violet: "#A77BFF",
  amber: "#FFB84D",
  green: "#6BEA8D",
  coral: "#FF6B72",
  slate: "#B5C4D8",
};

const line = (body) =>
  `<g fill="none" stroke="#F7FBFF" stroke-width="13" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;

const glyphs = {
  "new-chat": line('<path d="M54 66h124a24 24 0 0 1 24 24v62a24 24 0 0 1-24 24h-66l-35 27v-27H54a24 24 0 0 1-24-24V90a24 24 0 0 1 24-24Z"/><path d="M116 96v48M92 120h48"/>'),
  "quick-chat": line('<path d="M50 72h106a22 22 0 0 1 22 22v42a22 22 0 0 1-22 22H98l-30 24v-24H50a22 22 0 0 1-22-22V94a22 22 0 0 1 22-22Z"/><path d="m164 55-25 45h24l-11 46 42-60h-25l16-31Z"/>'),
  "side-chat": line('<rect x="35" y="48" width="82" height="122" rx="20"/><rect x="139" y="84" width="82" height="122" rx="20"/><path d="M70 98h18M165 134h30M165 160h20"/>'),
  search: line('<circle cx="108" cy="106" r="55"/><path d="m149 147 54 54"/>'),
  project: line('<path d="M30 76a20 20 0 0 1 20-20h55l22 24h79a20 20 0 0 1 20 20v88a20 20 0 0 1-20 20H50a20 20 0 0 1-20-20Z"/><path d="M31 102h194"/>'),
  "add-files": line('<path d="M62 30h88l44 44v152H62Z"/><path d="M150 30v52h44M128 112v58M99 141h58"/>'),
  "add-photos": line('<rect x="28" y="48" width="200" height="158" rx="22"/><circle cx="87" cy="96" r="16"/><path d="m50 182 52-54 35 33 28-29 42 50M188 28v48M164 52h48"/>'),
  model: line('<path d="m128 28 82 47v106l-82 47-82-47V75Z"/><path d="m46 75 82 48 82-48M128 123v105"/>'),
  voice: line('<rect x="89" y="29" width="78" height="126" rx="39"/><path d="M61 124a67 67 0 0 0 134 0M128 191v35M92 226h72"/>'),
  dictate: line('<path d="M37 133v-18M67 160V88M97 184V65M128 202V49M159 184V65M189 160V88M219 133v-18"/>'),
  plan: line('<rect x="46" y="36" width="164" height="188" rx="20"/><path d="M84 83h84M84 124h84M84 165h44"/><path d="m150 173 18 18 35-43"/>'),
  fast: line('<path d="m145 20-83 119h58l-10 97 84-128h-57Z"/>'),
  previous: line('<path d="m151 52-76 76 76 76"/>'),
  next: line('<path d="m105 52 76 76-76 76"/>'),
  "workspace-command": line('<rect x="28" y="43" width="200" height="170" rx="25"/><path d="m64 91 36 34-36 34M124 163h58"/>'),
  "workspace-agents": line('<circle cx="128" cy="55" r="24"/><circle cx="58" cy="180" r="24"/><circle cx="198" cy="180" r="24"/><path d="M117 77 72 157M139 77l45 80M82 180h92"/>'),
  "workspace-skills": line('<path d="m128 25 16 51 51 16-51 16-16 51-16-51-51-16 51-16Z"/><path d="m190 146 9 29 29 9-29 9-9 29-9-29-29-9 29-9Z"/>'),
  build: line('<path d="m82 45-45 83 45 83M174 45l45 83-45 83M150 65l-44 126"/>'),
  debug: line('<path d="M73 96h110v89a47 47 0 0 1-47 47h-16a47 47 0 0 1-47-47Z"/><path d="M95 96V70a33 33 0 0 1 66 0v26M43 120h30M183 120h30M43 166h30M183 166h30M62 70l22 18M194 70l-22 18M128 104v116"/>'),
  review: line('<path d="M50 32h112l44 44v143H50Z"/><path d="M162 32v52h44"/><circle cx="113" cy="142" r="34"/><path d="m138 168 38 38"/>'),
  test: line('<path d="M99 28h58M112 28v64l-60 102a23 23 0 0 0 20 34h112a23 23 0 0 0 20-34L144 92V28"/><path d="M83 174h90M99 198l20 18 41-48"/>'),
  refactor: line('<path d="M47 92a86 86 0 0 1 143-35l22 22M209 47l3 32-32 3M209 164a86 86 0 0 1-143 35l-22-22M47 209l-3-32 32-3"/>'),
  explain: line('<circle cx="128" cy="128" r="96"/><path d="M128 118v60M128 78h.1"/>'),
  docs: line('<path d="M34 48h76a29 29 0 0 1 29 29v145H63a29 29 0 0 0-29 29ZM222 48h-76a29 29 0 0 0-29 29v145h76a29 29 0 0 1 29 29Z"/>'),
  research: line('<circle cx="109" cy="109" r="70"/><path d="M39 109h140M109 39c25 24 37 47 37 70s-12 46-37 70c-25-24-37-47-37-70s12-46 37-70ZM158 158l56 56"/>'),
  "ui-polish": line('<path d="m70 191 103-103M157 47l16 41 41 16-41 16-16 41-16-41-41-16 41-16ZM65 137l9 24 24 9-24 9-9 24-9-24-24-9 24-9Z"/>'),
  visuals: line('<rect x="28" y="48" width="200" height="160" rx="22"/><circle cx="82" cy="96" r="15"/><path d="m49 181 50-52 34 32 28-28 45 48M188 24l9 24 24 9-24 9-9 24-9-24-24-9 24-9Z"/>'),
  continue: line('<path d="M58 63v64h64M61 126a76 76 0 1 1 20 75"/><path d="m117 89 63 39-63 39Z"/>'),
  reasoning: line('<path d="M72 158a62 62 0 0 1-4-115 38 38 0 0 1 60 13 38 38 0 0 1 60-13 62 62 0 0 1-4 115M82 94c14-15 31-16 46-2M174 94c-14-15-31-16-46-2M90 126c12-10 25-11 38-3M166 126c-12-10-25-11-38-3"/><path d="M52 205a84 84 0 0 1 152 0M128 205l45-60"/><circle cx="128" cy="205" r="10"/>'),
  "task-history": line('<path d="M55 83a84 84 0 1 1-9 101"/><path d="M55 83H25V53M128 70v62l43 25"/><circle cx="128" cy="132" r="9"/><path d="M70 211h116"/>'),
  scroll: line('<path d="m128 30-42 44M128 30l42 44M128 226l-42-44M128 226l42-44M128 44v168"/>'),
  zoom: line('<circle cx="108" cy="106" r="55"/><path d="m149 147 54 54M82 106h52M108 80v52"/>'),
  volume: line('<path d="M35 103h43l55-45v140l-55-45H35Z"/><path d="M166 93a49 49 0 0 1 0 70M192 65a87 87 0 0 1 0 126"/>'),
  approve: line('<circle cx="128" cy="128" r="94"/><path d="m76 128 35 37 72-78"/>'),
  cancel: line('<circle cx="128" cy="128" r="94"/><path d="m86 86 84 84M170 86l-84 84"/>'),
  "finish-it": line('<path d="M48 222V38M54 48h132l-24 36 24 36H54"/><circle cx="134" cy="172" r="42"/><path d="m112 172 16 17 31-36"/>'),
  "status-check": line('<rect x="38" y="38" width="180" height="180" rx="25"/><path d="M78 86h92M78 128h92M78 170h58"/><path d="m155 176 14 14 28-34"/>'),
  "root-cause": line('<circle cx="116" cy="128" r="82"/><circle cx="116" cy="128" r="48"/><circle cx="116" cy="128" r="14"/><path d="m128 116 70-70M170 46h28v28"/>'),
  "check-rest": line('<path d="M43 43h126v170H43Z"/><path d="m67 82 12 12 22-27M112 83h31M67 128l12 12 22-27M112 129h31"/><circle cx="175" cy="174" r="38"/><path d="m202 201 25 25"/>'),
  "update-docs": line('<path d="M52 31h104l43 43v151H52Z"/><path d="M156 31v51h43M82 111h86M82 145h58"/><path d="M93 196a44 44 0 0 0 67 6M91 178v18h18M169 188v-18h-18"/>'),
  "validate-all": line('<path d="m128 26 82 32v61c0 52-31 91-82 111-51-20-82-59-82-111V58Z"/><path d="m82 128 31 32 62-67"/>'),
  "review-changes": line('<path d="M40 55h120M40 95h80M40 135h100M53 43v24M41 55h24M98 83v24M86 95h24"/><circle cx="164" cy="166" r="44"/><path d="m196 198 29 29"/>'),
  "make-nice": line('<path d="m128 25 15 48 48 15-48 15-15 48-15-48-48-15 48-15Z"/><path d="m190 142 9 29 29 9-29 9-9 29-9-29-29-9 29-9ZM62 144l8 24 24 8-24 8-8 24-8-24-24-8 24-8Z"/>'),
  simplify: line('<path d="M40 58h48l40 48 40-48h48M40 128h67l21 22 21-22h67M40 198h88M128 150v48"/>'),
  "best-judgment": line('<circle cx="128" cy="128" r="94"/><path d="m159 83-22 54-54 22 22-54Z"/><circle cx="128" cy="128" r="8"/>'),
  handoff: line('<rect x="28" y="60" width="74" height="136" rx="18"/><rect x="154" y="60" width="74" height="136" rx="18"/><path d="M85 105h85M142 77l28 28-28 28M171 151H86M114 123l-28 28 28 28"/>'),
  "match-visual": line('<rect x="31" y="47" width="132" height="132" rx="20"/><rect x="93" y="79" width="132" height="132" rx="20"/><path d="M119 126h80M119 160h80"/>'),
  "inspect-first": line('<circle cx="111" cy="111" r="67"/><path d="m160 160 48 48M74 111c22-34 52-34 74 0-22 34-52 34-74 0Z"/><circle cx="111" cy="111" r="13"/>'),
  "find-root": line('<path d="M128 35v44M62 79h132M62 79v52M128 79v52M194 79v52"/><circle cx="62" cy="158" r="27"/><circle cx="128" cy="158" r="27"/><circle cx="194" cy="158" r="27"/><path d="M128 185v37"/>'),
  "lock-scope": line('<path d="M57 54H35v44M199 54h22v44M57 202H35v-44M199 202h22v-44"/><rect x="82" y="112" width="92" height="78" rx="16"/><path d="M102 112V89a26 26 0 0 1 52 0v23M128 144v22"/>'),
  preserve: line('<path d="m128 28 82 32v61c0 52-31 91-82 111-51-20-82-59-82-111V60Z"/><path d="M82 139c14-40 58-59 92-43-8 45-43 70-82 62M91 158c21-17 42-30 69-45"/>'),
  "small-fix": line('<path d="M54 202 147 109M139 55a43 43 0 0 0 52 52l-31 31-42-42 31-31a43 43 0 0 0-10-10ZM47 209l-10-34 25 8 8 25Z"/><path d="m190 34 7 19 19 7-19 7-7 19-7-19-19-7 19-7Z"/>'),
  "use-existing": line('<path d="M53 92a80 80 0 0 1 137-35l22 22M209 47l3 32-32 3M203 164a80 80 0 0 1-137 35l-22-22M47 209l-3-32 32-3"/><path d="m102 128 18 18 39-44"/>'),
  "full-files": line('<path d="M68 31h91l37 37v142H68Z"/><path d="M159 31v46h37M91 112h82M91 148h82M91 184h58"/><path d="M45 66H30v159h121v-15"/>'),
  "source-truth": line('<ellipse cx="128" cy="61" rx="80" ry="31"/><path d="M48 61v116c0 17 36 31 80 31s80-14 80-31V61M48 119c0 17 36 31 80 31s80-14 80-31"/><path d="m96 174 20 20 45-48"/>'),
  "no-guessing": line('<circle cx="108" cy="109" r="67"/><path d="m156 157 52 52M91 91a19 19 0 1 1 28 17c-12 7-13 13-13 24M106 155h.1M51 51l114 114"/>'),
  "keep-going": line('<path d="M39 79h80l39 49-39 49H39l39-49ZM118 79h80l39 49-39 49h-80l39-49Z"/>'),
  "deep-research": line('<circle cx="105" cy="105" r="72"/><path d="M33 105h144M105 33c25 23 38 47 38 72s-13 49-38 72c-25-23-38-47-38-72s13-49 38-72ZM156 156l60 60M73 64h64M73 146h64"/>'),
  "audit-only": line('<path d="M57 47h142v176H57Z"/><path d="M93 47V31h70v32H93ZM88 102h80M88 141h55M88 180h45"/><circle cx="171" cy="174" r="31"/><path d="m194 197 24 24"/>'),
  creative: line('<path d="m128 25 16 50 50 16-50 16-16 50-16-50-50-16 50-16Z"/><path d="M48 184c39-8 66 2 81 30 10-38 39-57 78-58"/><circle cx="50" cy="184" r="10"/><circle cx="207" cy="156" r="10"/>'),
  documents: line('<path d="M51 31h106l47 47v147H51Z"/><path d="M157 31v56h47M83 119h90M83 157h90M83 195h58"/>'),
  sheets: line('<rect x="35" y="39" width="186" height="178" rx="18"/><path d="M35 92h186M35 145h186M96 39v178M158 39v178"/>'),
  pdf: line('<path d="M53 30h102l48 48v148H53Z"/><path d="M155 30v57h48M78 181c31-54 60-86 83-97M83 141c25 24 58 33 95 27M108 89c-4 47 6 83 30 109"/>'),
  slides: line('<rect x="29" y="45" width="198" height="137" rx="20"/><path d="M128 182v39M86 221h84M65 145l38-41 31 29 29-32 29 44M75 78h61"/>'),
  templates: line('<rect x="34" y="38" width="188" height="180" rx="20"/><path d="M34 91h188M92 91v127M62 64h.1M88 64h.1M114 64h.1M120 126h70M120 160h48"/>'),
  sites: line('<circle cx="128" cy="128" r="94"/><path d="M34 128h188M128 34c30 28 46 59 46 94s-16 66-46 94c-30-28-46-59-46-94s16-66 46-94ZM56 78h144M56 178h144"/>'),
  "product-design": line('<path d="M39 55h178v146H39Z"/><path d="M39 95h178M88 95v106M65 75h.1M91 75h.1M117 75h.1"/><rect x="117" y="121" width="73" height="53" rx="12"/>'),
  expo: line('<path d="m128 31 91 159-43 35-48-91-48 91-43-35Z"/><path d="M98 187h60"/>'),
  remotion: line('<circle cx="128" cy="128" r="92"/><path d="M112 83v90l72-45Z"/><path d="M55 71c24-23 49-35 73-35M55 185c24 23 49 35 73 35"/>'),
  "lr-hdr": line('<rect x="31" y="45" width="194" height="166" rx="22"/><circle cx="128" cy="128" r="47"/><path d="M128 81v94M81 128h94M49 68l20 20M207 68l-20 20M49 188l20-20M207 188l-20-20"/>'),
  imagegen: line('<rect x="29" y="43" width="198" height="170" rx="22"/><circle cx="82" cy="91" r="15"/><path d="m49 186 49-54 34 33 30-31 45 52M188 22l9 25 25 9-25 9-9 25-9-25-25-9 25-9Z"/>'),
  browser: line('<circle cx="128" cy="128" r="94"/><path d="M34 128h188M128 34c30 28 46 59 46 94s-16 66-46 94c-30-28-46-59-46-94s16-66 46-94ZM56 78h144M56 178h144"/>'),
  computer: line('<rect x="28" y="38" width="200" height="145" rx="20"/><path d="M128 183v36M85 219h86M61 73h134v77H61Z"/>'),
  gmail: line('<rect x="29" y="58" width="198" height="141" rx="20"/><path d="m39 77 89 70 89-70M39 188l59-55M217 188l-59-55"/>'),
  mail: line('<rect x="29" y="58" width="198" height="141" rx="20"/><path d="m39 77 89 70 89-70M39 188l59-55M217 188l-59-55"/>'),
  lightroom: line('<rect x="35" y="35" width="186" height="186" rx="32"/><path d="M78 78v100h55M150 178v-65M150 135c12-17 27-25 45-25"/>'),
  numbers: line('<rect x="34" y="39" width="188" height="178" rx="18"/><path d="M68 178v-38M105 178v-75M142 178v-51M179 178V78M61 178h127"/>'),
  pages: line('<path d="M53 30h102l48 48v148H53Z"/><path d="M155 30v57h48M82 121h92M82 158h92M82 195h61"/>'),
  github: line('<path d="M128 35a93 93 0 0 0-29 181c5 1 7-2 7-5v-18c-29 6-35-12-35-12-5-12-12-15-12-15-10-7 1-7 1-7 11 1 17 11 17 11 10 17 25 12 31 9 1-7 4-12 7-15-23-3-47-12-47-50 0-11 4-21 11-28-1-3-5-13 1-28 0 0 9-3 30 11a103 103 0 0 1 55 0c21-14 30-11 30-11 6 15 2 25 1 28 7 7 11 17 11 28 0 38-24 47-47 50 4 3 7 10 7 20v36c0 3 2 6 7 5A93 93 0 0 0 128 35Z"/>'),
  calendar: line('<rect x="32" y="52" width="192" height="172" rx="22"/><path d="M32 98h192M78 31v43M178 31v43M72 135h24M116 135h24M160 135h24M72 176h24M116 176h24"/>'),
  drive: line('<path d="m103 33-67 116 31 53h60l-30-53 61-106Z"/><path d="m158 43 62 106-31 53h-62l31-53H97"/>'),
  "openai-docs": line('<path d="M53 31h102l48 48v147H53Z"/><path d="M155 31v57h48M83 124h90M83 160h90M83 196h57"/><circle cx="83" cy="81" r="15"/>'),
  canva: line('<path d="M190 72c-19-27-62-33-95-9-39 28-48 84-15 119 31 34 86 32 111-2M81 181c-13 20-8 43 11 45 30 3 44-34 62-63 13-21 25-30 39-28 12 2 17 13 13 27"/>'),
};

const iconSpecs = [
  ["new-chat", "New Chat", "cyan"],
  ["quick-chat", "Quick Chat", "cyan"],
  ["side-chat", "Side Chat", "blue"],
  ["search", "Search", "cyan"],
  ["project", "Project", "cyan"],
  ["add-files", "Add Files", "cyan"],
  ["add-photos", "Add Photos", "blue"],
  ["model", "Model", "violet"],
  ["voice", "Voice", "amber"],
  ["dictate", "Dictate", "amber"],
  ["plan", "Plan", "violet"],
  ["fast", "Fast", "violet"],
  ["previous", "Previous", "blue"],
  ["next", "Next", "blue"],
  ["workspace-command", "Command", "cyan"],
  ["workspace-agents", "Agents", "blue"],
  ["workspace-skills", "Skills", "violet"],
  ["build", "Build", "cyan"],
  ["debug", "Debug", "coral"],
  ["review", "Review", "green"],
  ["test", "Test", "green"],
  ["refactor", "Refactor", "blue"],
  ["explain", "Explain", "amber"],
  ["docs", "Docs", "slate"],
  ["research", "Research", "cyan"],
  ["ui-polish", "UI Polish", "violet"],
  ["visuals", "Visuals", "violet"],
  ["continue", "Continue", "cyan"],
  ["reasoning", "Reasoning", "violet"],
  ["task-history", "Task History", "blue"],
  ["scroll", "Scroll", "slate"],
  ["zoom", "Zoom", "cyan"],
  ["volume", "Volume", "amber"],
  ["approve", "Approve", "green"],
  ["cancel", "Cancel", "coral"],
  ["finish-it", "Finish It", "cyan"],
  ["status-check", "Status", "blue"],
  ["root-cause", "Root Cause", "coral"],
  ["check-rest", "Check Rest", "cyan"],
  ["update-docs", "Update Docs", "slate"],
  ["validate-all", "Validate All", "green"],
  ["review-changes", "Review Changes", "green"],
  ["make-nice", "Make It Nice", "violet"],
  ["simplify", "Simplify", "blue"],
  ["best-judgment", "Best Judgment", "amber"],
  ["handoff", "Handoff", "blue"],
  ["match-visual", "Match Visual", "violet"],
  ["inspect-first", "Inspect First", "cyan"],
  ["find-root", "Find Root", "blue"],
  ["lock-scope", "Lock Scope", "amber"],
  ["preserve", "Preserve", "green"],
  ["small-fix", "Small Fix", "amber"],
  ["use-existing", "Use Existing", "blue"],
  ["full-files", "Full Files", "slate"],
  ["source-truth", "Source Truth", "green"],
  ["no-guessing", "No Guessing", "coral"],
  ["keep-going", "Keep Going", "cyan"],
  ["deep-research", "Deep Research", "violet"],
  ["audit-only", "Audit Only", "slate"],
  ["creative", "Creative", "violet"],
  ["documents", "Documents", "slate"],
  ["sheets", "Sheets", "green"],
  ["pdf", "PDF", "coral"],
  ["slides", "Slides", "amber"],
  ["templates", "Templates", "blue"],
  ["sites", "Sites", "cyan"],
  ["product-design", "Product Design", "violet"],
  ["expo", "Expo", "cyan"],
  ["remotion", "Remotion", "coral"],
  ["lr-hdr", "LR HDR", "amber"],
  ["imagegen", "ImageGen", "violet"],
  ["browser", "Browser", "cyan"],
  ["computer", "Computer", "blue"],
  ["gmail", "Gmail", "coral"],
  ["mail", "Mail", "blue"],
  ["lightroom", "Lightroom", "violet"],
  ["numbers", "Numbers", "green"],
  ["pages", "Pages", "amber"],
  ["github", "GitHub", "slate"],
  ["calendar", "Calendar", "coral"],
  ["drive", "Drive", "green"],
  ["openai-docs", "OpenAI Docs", "cyan"],
  ["canva", "Canva", "violet"],
];

for (let number = 1; number <= 9; number += 1) {
  iconSpecs.push([`task-${number}`, `Task ${number}`, "blue"]);
}

const digitSegments = {
  a: "M90 65h76",
  b: "M174 73v47",
  c: "M174 136v47",
  d: "M90 191h76",
  e: "M82 136v47",
  f: "M82 73v47",
  g: "M90 128h76",
};

const digitLayouts = {
  1: ["b", "c"],
  2: ["a", "b", "g", "e", "d"],
  3: ["a", "b", "g", "c", "d"],
  4: ["f", "g", "b", "c"],
  5: ["a", "f", "g", "c", "d"],
  6: ["a", "f", "g", "e", "c", "d"],
  7: ["a", "b", "c"],
  8: ["a", "b", "c", "d", "e", "f", "g"],
  9: ["a", "b", "c", "d", "f", "g"],
};

function taskGlyph(number) {
  if (Number(number) === 1) {
    return '<g fill="none" stroke="#F7FBFF" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><path d="m104 91 28-24v117M102 184h60"/></g>';
  }
  const paths = digitLayouts[number]
    .map((segment) => digitSegments[segment])
    .join(" ");
  return `<g fill="none" stroke="#F7FBFF" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><path d="${paths}"/></g>`;
}

function renderIcon(name, colorName) {
  const accent = colors[colorName];
  const number = /^task-\d+$/.test(name) ? name.split("-")[1] : null;
  const glyph = number ? taskGlyph(number) : glyphs[name];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <radialGradient id="wash" cx="50%" cy="25%" r="85%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.24"/>
      <stop offset="0.58" stop-color="#0B111C" stop-opacity="0.94"/>
      <stop offset="1" stop-color="#05070C"/>
    </radialGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect x="8" y="8" width="240" height="240" rx="48" fill="#05070C"/>
  <rect x="12" y="12" width="232" height="232" rx="44" fill="url(#wash)" stroke="${accent}" stroke-width="5"/>
  <g transform="translate(16 13) scale(.875)" filter="url(#glow)">${glyph}</g>
  <rect x="74" y="222" width="108" height="7" rx="3.5" fill="${accent}" filter="url(#glow)"/>
</svg>
`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderLabeledIcon(name, colorName, labelLines) {
  const accent = colors[colorName];
  const number = /^task-\d+$/.test(name) ? name.split("-")[1] : null;
  const glyph = number ? taskGlyph(number) : glyphs[name];
  const fullLabel = labelLines.join(" ");
  const fontSize = labelLines.length === 1 ? 31 : 25;
  const linePositions = labelLines.length === 1 ? [198] : [181, 209];
  const labelSvg = labelLines
    .map(
      (lineText, index) =>
        `<text x="128" y="${linePositions[index]}" text-anchor="middle" font-family="Arial Rounded MT Bold,Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="0.4" fill="#F7FBFF">${escapeXml(lineText)}</text>`,
    )
    .join("\n    ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" data-device-label="${escapeXml(fullLabel)}">
  <defs>
    <radialGradient id="wash" cx="50%" cy="20%" r="85%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.26"/>
      <stop offset="0.58" stop-color="#0B111C" stop-opacity="0.94"/>
      <stop offset="1" stop-color="#05070C"/>
    </radialGradient>
    <linearGradient id="labelBand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#101725" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#05070C" stop-opacity="0.99"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect x="8" y="8" width="240" height="240" rx="48" fill="#05070C"/>
  <rect x="12" y="12" width="232" height="232" rx="44" fill="url(#wash)" stroke="${accent}" stroke-width="5"/>
  <g transform="translate(58 5) scale(.55)" filter="url(#glow)">${glyph}</g>
  <rect x="18" y="148" width="220" height="88" rx="25" fill="url(#labelBand)" stroke="${accent}" stroke-opacity="0.5" stroke-width="2"/>
  <g id="device-label" aria-label="${escapeXml(fullLabel)}">
    ${labelSvg}
  </g>
  <rect x="72" y="228" width="112" height="6" rx="3" fill="${accent}" filter="url(#glow)"/>
</svg>
`;
}

const manifest = iconSpecs.map(([name, label, color]) => {
  const filename = `${name}.svg`;
  fs.writeFileSync(path.join(iconDir, filename), renderIcon(name, color));
  return { name, label, color, filename };
});

fs.writeFileSync(
  path.join(iconDir, "manifest.json"),
  `${JSON.stringify({ style: "Codex Signal", size: "256x256", icons: manifest }, null, 2)}\n`,
);

const commandNames = [
  "new-chat", "quick-chat", "side-chat", "search",
  "project", "add-files", "add-photos", "model",
  "voice", "dictate", "plan", "fast",
];
const agentNames = [
  "task-1", "task-2", "task-3", "task-4",
  "task-5", "task-6", "task-7", "task-8",
  "task-9", "previous", "next", "search",
];
const skillNames = [
  "plan", "build", "debug", "review",
  "test", "refactor", "explain", "docs",
  "research", "ui-polish", "visuals", "continue",
];
const quickTextNames = [
  "finish-it", "status-check", "root-cause", "check-rest",
  "update-docs", "validate-all", "review-changes", "make-nice",
  "simplify", "best-judgment", "handoff", "match-visual",
];
const personalNames = [
  "inspect-first", "find-root", "lock-scope", "preserve",
  "small-fix", "use-existing", "full-files", "source-truth",
  "no-guessing", "keep-going", "deep-research", "audit-only",
];
const createNames = [
  "creative", "documents", "sheets", "pdf",
  "slides", "templates", "sites", "product-design",
  "expo", "remotion", "lr-hdr", "imagegen",
];
const operateNames = [
  "browser", "computer", "gmail", "mail",
  "lightroom", "numbers", "pages", "github",
  "calendar", "drive", "openai-docs", "canva",
];
const labeledPageSpecs = {
  command: [
    ["new-chat", ["NEW", "CHAT"]],
    ["quick-chat", ["QUICK", "CHAT"]],
    ["side-chat", ["SIDE", "CHAT"]],
    ["search", ["SWITCH", "CHAT"]],
    ["project", ["PROJECT"]],
    ["add-files", ["FILES"]],
    ["add-photos", ["PHOTOS"]],
    ["model", ["MODEL"]],
    ["voice", ["VOICE"]],
    ["dictate", ["DICTATE"]],
    ["plan", ["PLAN"]],
    ["fast", ["FAST"]],
  ],
  skills: [
    ["plan", ["PLAN"]],
    ["build", ["BUILD"]],
    ["debug", ["DEBUG"]],
    ["review", ["REVIEW"]],
    ["test", ["TEST"]],
    ["refactor", ["REFACTOR"]],
    ["explain", ["EXPLAIN"]],
    ["docs", ["DOCS"]],
    ["research", ["RESEARCH"]],
    ["ui-polish", ["UI", "POLISH"]],
    ["visuals", ["VISUALS"]],
    ["continue", ["CONTINUE"]],
  ],
  "quick-text": [
    ["finish-it", ["FINISH"]],
    ["status-check", ["STATUS"]],
    ["root-cause", ["ROOT", "CAUSE"]],
    ["check-rest", ["CHECK", "REST"]],
    ["update-docs", ["UPDATE", "DOCS"]],
    ["validate-all", ["VALIDATE"]],
    ["review-changes", ["REVIEW"]],
    ["make-nice", ["MAKE", "NICE"]],
    ["simplify", ["SIMPLIFY"]],
    ["best-judgment", ["BEST", "JUDGMENT"]],
    ["handoff", ["HANDOFF"]],
    ["match-visual", ["MATCH", "VISUAL"]],
  ],
  personal: [
    ["inspect-first", ["INSPECT", "FIRST"]],
    ["find-root", ["FIND", "ROOT"]],
    ["lock-scope", ["LOCK", "SCOPE"]],
    ["preserve", ["PRESERVE"]],
    ["small-fix", ["SMALL", "FIX"]],
    ["use-existing", ["USE", "EXISTING"]],
    ["full-files", ["FULL", "FILES"]],
    ["source-truth", ["SOURCE", "TRUTH"]],
    ["no-guessing", ["NO", "GUESSING"]],
    ["keep-going", ["KEEP", "GOING"]],
    ["deep-research", ["DEEP", "RESEARCH"]],
    ["audit-only", ["AUDIT", "ONLY"]],
  ],
  create: [
    ["creative", ["CREATIVE"]],
    ["documents", ["DOCUMENTS"]],
    ["sheets", ["SHEETS"]],
    ["pdf", ["PDF"]],
    ["slides", ["SLIDES"]],
    ["templates", ["TEMPLATES"]],
    ["sites", ["SITES"]],
    ["product-design", ["PRODUCT", "DESIGN"]],
    ["expo", ["EXPO"]],
    ["remotion", ["REMOTION"]],
    ["lr-hdr", ["LR", "HDR"]],
    ["imagegen", ["IMAGE", "GEN"]],
  ],
  operate: [
    ["browser", ["BROWSER"]],
    ["computer", ["COMPUTER"]],
    ["gmail", ["GMAIL"]],
    ["mail", ["MAIL"]],
    ["lightroom", ["LIGHTROOM"]],
    ["numbers", ["NUMBERS"]],
    ["pages", ["PAGES"]],
    ["github", ["GITHUB"]],
    ["calendar", ["CALENDAR"]],
    ["drive", ["DRIVE"]],
    ["openai-docs", ["OPENAI", "DOCS"]],
    ["canva", ["CANVA"]],
  ],
};
const labeledManifest = [];
for (const [page, specs] of Object.entries(labeledPageSpecs)) {
  const pageDir = path.join(labeledIconDir, page);
  fs.mkdirSync(pageDir, { recursive: true });
  for (const [name, labelLines] of specs) {
    const item = manifest.find((candidate) => candidate.name === name);
    if (!item) throw new Error(`Missing base icon specification for ${page}/${name}`);
    const filename = `${name}.svg`;
    fs.writeFileSync(
      path.join(pageDir, filename),
      renderLabeledIcon(name, item.color, labelLines),
    );
    labeledManifest.push({
      page,
      name,
      label: labelLines.join(" "),
      labelLines,
      color: item.color,
      filename: `${page}/${filename}`,
    });
  }
}

fs.writeFileSync(
  path.join(labeledIconDir, "manifest.json"),
  `${JSON.stringify({ style: "Codex Signal Labeled", size: "256x256", icons: labeledManifest }, null, 2)}\n`,
);

const labeledByPage = new Map(
  Object.entries(labeledPageSpecs).map(([page, specs]) => [page, new Map(specs)]),
);

function renderForPage(name, color, page) {
  const labelLines = labeledByPage.get(page)?.get(name);
  return labelLines ? renderLabeledIcon(name, color, labelLines) : renderIcon(name, color);
}

const commandReferenceSpecs = [
  ["new-chat", "New Chat", "Start a new Codex task", "in the current context"],
  ["quick-chat", "Quick Chat", "Start a lightweight chat", "in the quick composer"],
  ["side-chat", "Side Chat", "Open the current task", "as a side chat"],
  ["search", "Switch Chat", "Search for and switch", "to another task"],
  ["project", "Choose Project", "Open the project picker", "for the current composer"],
  ["add-files", "Add Files", "Attach files or folders", "to the active composer"],
  ["add-photos", "Add Photos", "Attach images", "to the active composer"],
  ["model", "Choose Model", "Open the model picker", "for the active composer"],
  ["voice", "Voice", "Hold for global dictation", "and release to stop"],
  ["dictate", "Dictate", "Press once to dictate", "and press again to stop"],
  ["plan", "Plan Mode", "Toggle Plan mode", "for the active composer"],
  ["fast", "Fast Mode", "Toggle Fast mode", "for the active composer"],
];
const agentReferenceSpecs = [
  ["task-1", "Task 1", "Jump directly to task", "slot one"],
  ["task-2", "Task 2", "Jump directly to task", "slot two"],
  ["task-3", "Task 3", "Jump directly to task", "slot three"],
  ["task-4", "Task 4", "Jump directly to task", "slot four"],
  ["task-5", "Task 5", "Jump directly to task", "slot five"],
  ["task-6", "Task 6", "Jump directly to task", "slot six"],
  ["task-7", "Task 7", "Jump directly to task", "slot seven"],
  ["task-8", "Task 8", "Jump directly to task", "slot eight"],
  ["task-9", "Task 9", "Jump directly to task", "slot nine"],
  ["previous", "Previous Task", "Move to the previous", "task in history"],
  ["next", "Next Task", "Move to the next", "task in history"],
  ["search", "Switch Chat", "Search for and switch", "to another task"],
];
const skillReferenceSpecs = [
  ["plan", "Plan", "Create a decision-complete plan", "before making changes"],
  ["build", "Build", "Implement the request end to end", "and verify the result"],
  ["debug", "Debug", "Find the root cause", "and apply the smallest safe fix"],
  ["review", "Review", "Check bugs, regressions,", "security risks, and missing tests"],
  ["test", "Test", "Run the most relevant checks", "and report verified results"],
  ["refactor", "Refactor", "Improve clarity and structure", "without changing behavior"],
  ["explain", "Explain", "Explain the flow and pitfalls", "in plain language"],
  ["docs", "Docs", "Update relevant documentation", "and validate links and examples"],
  ["research", "Research", "Use current primary sources", "and separate fact from inference"],
  ["ui-polish", "UI Polish", "Improve hierarchy, clarity,", "accessibility, and native polish"],
  ["visuals", "Visuals", "Create three visual directions", "then pause for selection"],
  ["continue", "Continue", "Resume from the verified state", "and take the next safe step"],
];
const quickTextReferenceSpecs = [
  ["finish-it", "Finish It", "Work until genuinely complete", "then validate and report"],
  ["status-check", "Status", "Summarize done, broken,", "uncertain, and the next step"],
  ["root-cause", "Root Cause", "Diagnose, fix, and verify", "the real underlying issue"],
  ["check-rest", "Check Rest", "Find related issues", "and missing pieces in scope"],
  ["update-docs", "Update Docs", "Sync the relevant docs", "and the correct worklog"],
  ["validate-all", "Validate All", "Run appropriate checks", "fix failures, report honestly"],
  ["review-changes", "Review Changes", "Find bugs, regressions,", "security risks, and missing tests"],
  ["make-nice", "Make It Nice", "Polish for a cohesive,", "intuitive finished result"],
  ["simplify", "Simplify", "Remove needless complexity", "without changing behavior"],
  ["best-judgment", "Best Judgment", "Move forward autonomously", "unless a choice is material"],
  ["handoff", "Handoff", "Summarize files, validation,", "risks, and the next step"],
  ["match-visual", "Match Visual", "Compare to the reference", "and fix visible mismatches"],
];
const personalReferenceSpecs = [
  ["inspect-first", "Inspect First", "Read instructions and current", "behavior before changing files"],
  ["find-root", "Find Root", "Resolve the real project root", "and applicable instructions"],
  ["lock-scope", "Lock Scope", "Define in-scope work and", "protect unrelated behavior"],
  ["preserve", "Preserve", "Keep existing functionality", "and visual behavior intact"],
  ["small-fix", "Small Fix", "Make the smallest complete", "safe change that solves it"],
  ["use-existing", "Use Existing", "Reuse current components,", "patterns, styles, and tools"],
  ["full-files", "Full Files", "Apply complete changed files", "while preserving other content"],
  ["source-truth", "Source Truth", "Use the repository and", "established workflow as truth"],
  ["no-guessing", "No Guessing", "Verify commands and facts;", "name anything still unknown"],
  ["keep-going", "Keep Going", "Decide reasonably and finish", "implementation through cleanup"],
  ["deep-research", "Deep Research", "Research broadly, cite sources,", "and separate fact from inference"],
  ["audit-only", "Audit Only", "Classify project contents", "without changing or deleting"],
];
const createReferenceSpecs = [
  ["creative", "Creative", "Choose the best Creative", "Production skill for the task"],
  ["documents", "Documents", "Create or edit documents", "while preserving structure"],
  ["sheets", "Sheets", "Work with data and workbooks", "without damaging formulas"],
  ["pdf", "PDF", "Inspect, create, or edit PDFs", "and visually verify pages"],
  ["slides", "Slides", "Build a cohesive deck", "and validate slide output"],
  ["templates", "Templates", "Create a reusable template", "for the established workflow"],
  ["sites", "Sites", "Choose the applicable Sites", "building or hosting skill"],
  ["product-design", "Product Design", "Audit, ideate, or implement", "the product-design task"],
  ["expo", "Expo", "Use the right Expo skill", "and preserve native behavior"],
  ["remotion", "Remotion", "Follow Remotion practices", "for composition and rendering"],
  ["lr-hdr", "LR HDR", "Run the specialist HDR flow", "with destinations preserved"],
  ["imagegen", "ImageGen", "Create or edit an image", "to match supplied references"],
];
const operateReferenceSpecs = [
  ["browser", "Browser", "Inspect the visible browser", "state before taking action"],
  ["computer", "Computer", "Operate the relevant Mac app", "with safety rules applied"],
  ["gmail", "Gmail", "Read first and stage", "consequential Gmail actions"],
  ["mail", "Mail", "Follow active Apple Mail", "rules and avoid mutation"],
  ["lightroom", "Lightroom", "Inspect the current catalog", "and preserve all settings"],
  ["numbers", "Numbers", "Preserve formulas, formatting,", "sheets, and workbook data"],
  ["pages", "Pages", "Preserve document structure,", "styles, and content"],
  ["github", "GitHub", "Inspect repository or PR state", "before external mutation"],
  ["calendar", "Calendar", "Read the calendar first", "and require edit authority"],
  ["drive", "Drive", "Preserve ownership and sharing", "unless changes are requested"],
  ["openai-docs", "OpenAI Docs", "Use official OpenAI sources", "for product and API work"],
  ["canva", "Canva", "Choose the best Canva skill", "and preserve brand constraints"],
];
const byName = new Map(manifest.map((item) => [item.name, item]));
const panelLabelOverrides = new Map([
  ["command:search", "Switch Chat"],
  ["command:project", "Choose Project"],
  ["command:model", "Choose Model"],
  ["command:plan", "Plan Mode"],
  ["command:fast", "Fast Mode"],
  ["agents:search", "Switch Chat"],
]);

function panel(title, names, x, y, page = null) {
  const cells = names.map((name, index) => {
    const item = byName.get(name);
    const column = index % 4;
    const row = Math.floor(index / 4);
    const cellX = x + 4 + column * 108;
    const cellY = y + 53 + row * 78;
    const svgData = Buffer.from(renderForPage(item.name, item.color, page)).toString("base64");
    const visibleLabel = panelLabelOverrides.get(`${page}:${name}`) ?? item.label;
    return `<image href="data:image/svg+xml;base64,${svgData}" x="${cellX + 28}" y="${cellY}" width="56" height="56"/>
      <text x="${cellX + 56}" y="${cellY + 70}" text-anchor="middle" class="label">${visibleLabel}</text>`;
  }).join("\n");
  return `<rect x="${x}" y="${y}" width="440" height="310" rx="30" class="panel"/>
    <text x="${x + 28}" y="${y + 38}" class="section">${title}</text>
    ${cells}`;
}

function referenceCard([iconName, label, lineOne, lineTwo], index, page) {
  const column = index % 4;
  const row = Math.floor(index / 4);
  const x = 60 + column * 465;
  const y = 150 + row * 275;
  const item = byName.get(iconName);
  const svgData = Buffer.from(renderForPage(item.name, item.color, page)).toString("base64");
  return `<rect x="${x}" y="${y}" width="430" height="245" rx="28" class="referenceCard"/>
    <image href="data:image/svg+xml;base64,${svgData}" x="${x + 24}" y="${y + 58}" width="130" height="130"/>
    <text x="${x + 178}" y="${y + 82}" class="referenceLabel">${label}</text>
    <text x="${x + 178}" y="${y + 126}" class="referenceDescription">${lineOne}</text>
    <text x="${x + 178}" y="${y + 158}" class="referenceDescription">${lineTwo}</text>`;
}

function workspaceReference(title, subtitle, specs, page, footer) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="referenceBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#05070C"/>
      <stop offset="0.55" stop-color="#0A1020"/>
      <stop offset="1" stop-color="#160D2A"/>
    </linearGradient>
    <style>
      .referenceTitle { fill:#F7FBFF; font:700 50px -apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; }
      .referenceSubtitle { fill:#AFC2D9; font:400 22px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .referenceCard { fill:#0A0E17; stroke:#26334A; stroke-width:2; }
      .referenceLabel { fill:#F7FBFF; font:650 28px -apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; }
      .referenceDescription { fill:#B8C7DA; font:500 17px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .referenceFooter { fill:#8FA4BE; font:500 17px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="url(#referenceBg)"/>
  <text x="60" y="70" class="referenceTitle">Codex Control · ${title}</text>
  <text x="1860" y="66" text-anchor="end" class="referenceSubtitle">${subtitle}</text>
  ${specs.map((spec, index) => referenceCard(spec, index, page)).join("\n")}
  <text x="60" y="1038" class="referenceFooter">${footer}</text>
  <text x="1860" y="1038" text-anchor="end" class="referenceFooter">Codex Control · v1.0.0</text>
</svg>
`;
}

const cheatSheet = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#05070C"/>
      <stop offset="0.55" stop-color="#0A1020"/>
      <stop offset="1" stop-color="#160D2A"/>
    </linearGradient>
    <style>
      .title { fill:#F7FBFF; font:700 48px -apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; }
      .subtitle { fill:#AFC2D9; font:400 22px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .section { fill:#F7FBFF; font:650 21px -apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; }
      .label { fill:#C7D5E7; font:550 11px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .note { fill:#B8C7DA; font:500 16px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .panel { fill:#0A0E17; stroke:#26334A; stroke-width:2; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <text x="60" y="66" class="title">Codex Control · Loupedeck CT</text>
  <text x="1860" y="63" text-anchor="end" class="subtitle">Codex Signal · seven true 4×3 workspaces · paste-only prompts</text>
  ${panel("COMMAND · ROUND 1", commandNames, 30, 92, "command")}
  ${panel("AGENTS · ROUND 2", agentNames, 490, 92, "agents")}
  ${panel("SKILLS · ROUND 3", skillNames, 950, 92, "skills")}
  ${panel("CREATE · ROUND 5", createNames, 1410, 92, "create")}
  ${panel("OPERATE · ROUND 6", operateNames, 30, 423, "operate")}
  ${panel("PERSONAL · ROUND 7", personalNames, 490, 423, "personal")}
  ${panel("QUICK TEXT · ROUND 8", quickTextNames, 950, 423, "quick-text")}
  <rect x="1410" y="423" width="440" height="310" rx="30" class="panel"/>
  <image href="data:image/png;base64,${wheelIdleData}" x="1440" y="481" width="155" height="155"/>
  <text x="1615" y="472" class="section">REASONING WHEEL</text>
  <text x="1615" y="516" class="note">Turn left · reasoning down</text>
  <text x="1615" y="554" class="note">Turn right · reasoning up</text>
  <text x="1615" y="592" class="note">Tap · cycle reasoning</text>
  <text x="1615" y="648" class="note">Pulse confirms input only</text>
  <text x="1615" y="684" class="note">No persistent level state</text>
  <rect x="30" y="755" width="1820" height="295" rx="30" class="panel"/>
  <text x="64" y="800" class="section">PHYSICAL CONTROL SUMMARY</text>
  <text x="64" y="842" class="note">Round 4 · New / Quick Chat · Round 5 · Create / Fn empty · Round 6 · Operate / Fn Fast</text>
  <text x="64" y="880" class="note">Round 7 · Personal / Fn Approve · Round 8 · Quick Text · Voice, Dictate, and Plan remain on Command</text>
  <text x="64" y="918" class="note">Right squares · A Personal · B Agents · C Quick Text · D Skills · Fn layer · E Decline</text>
  <text x="64" y="956" class="note">Fn+A Reasoning Up · Fn+C Reasoning Down · all prompt workspaces paste editable drafts and never submit</text>
  <text x="1815" y="1010" text-anchor="end" class="subtitle">Codex Control · v1.0.0</text>
</svg>
`;

fs.writeFileSync(path.join(outputDir, "codex-control-map.svg"), cheatSheet);
fs.writeFileSync(
  path.join(outputDir, "codex-command-button-reference.svg"),
  workspaceReference(
    "Command Button Reference",
    "Twelve primary Codex controls",
    commandReferenceSpecs,
    "command",
    "Command buttons run their assigned Codex shortcuts · Use the active composer or task context",
  ),
);
fs.writeFileSync(
  path.join(outputDir, "codex-agents-button-reference.svg"),
  workspaceReference(
    "Agents Button Reference",
    "Nine task slots and three navigation controls",
    agentReferenceSpecs,
    "agents",
    "Agent buttons navigate the active Codex task history and switcher",
  ),
);
fs.writeFileSync(
  path.join(outputDir, "codex-skills-button-reference.svg"),
  workspaceReference(
    "Skills Button Reference",
    "Twelve review-first prompt starters",
    skillReferenceSpecs,
    "skills",
    "Each button pastes an editable prompt into Codex · Review and submit when ready",
  ),
);
fs.writeFileSync(
  path.join(outputDir, "codex-quick-text-button-reference.svg"),
  workspaceReference(
    "Quick Text Button Reference",
    "Twelve reusable completion and quality prompts",
    quickTextReferenceSpecs,
    "quick-text",
    "Each button pastes an editable prompt into Codex · Review and submit when ready",
  ),
);
fs.writeFileSync(
  path.join(outputDir, "codex-personal-button-reference.svg"),
  workspaceReference(
    "Personal Button Reference",
    "Twelve repository-safety and research prompts",
    personalReferenceSpecs,
    "personal",
    "Each button pastes the exact editable prompt into Codex · Review and submit when ready",
  ),
);
fs.writeFileSync(
  path.join(outputDir, "codex-create-button-reference.svg"),
  workspaceReference(
    "Create Button Reference",
    "Twelve guided creative and production prompts",
    createReferenceSpecs,
    "create",
    "Each button pastes the exact editable guided prompt into Codex · Review and submit when ready",
  ),
);
fs.writeFileSync(
  path.join(outputDir, "codex-operate-button-reference.svg"),
  workspaceReference(
    "Operate Button Reference",
    "Twelve guided app and service prompts",
    operateReferenceSpecs,
    "operate",
    "Each button pastes the exact editable guided prompt into Codex · Review and submit when ready",
  ),
);

const shortcutReferenceRows = [
  ["1", "plan", "Toggle Plan mode", "Plan Mode button"],
  ["2", "fast", "Toggle Fast mode", "Fast Mode button"],
  ["3", "reasoning", "Decrease reasoning effort", "Reasoning turn left / down"],
  ["4", "reasoning", "Increase reasoning effort", "Reasoning turn right / up"],
  ["5", "reasoning", "Cycle reasoning effort", "Reasoning press"],
  ["6", "add-files", "Attach files and folders", "Add Files button"],
  ["7", "add-photos", "Add photos", "Add Photos button"],
  ["8", "search", "Switch chat…", "Search / Switch Chat controls"],
  ["9", "voice", "Hold-to-dictate hotkey", "Hold Voice; release to stop"],
  ["0", "dictate", "Toggle dictation hotkey", "Press Dictate to start / stop"],
];

function shortcutCard([digit, iconName, command, control], index) {
  const column = index < 5 ? 0 : 1;
  const row = index % 5;
  const x = column === 0 ? 70 : 990;
  const y = 150 + row * 138;
  const item = byName.get(iconName);
  const svgData = Buffer.from(renderForPage(item.name, item.color, "command")).toString("base64");
  return `<rect x="${x}" y="${y}" width="860" height="116" rx="24" class="shortcutCard"/>
    <image href="data:image/svg+xml;base64,${svgData}" x="${x + 20}" y="${y + 19}" width="78" height="78"/>
    <text x="${x + 120}" y="${y + 38}" class="shortcutCommand">${command}</text>
    <text x="${x + 120}" y="${y + 74}" class="shortcutChord">Control + Option + Command + ${digit}</text>
    <text x="${x + 820}" y="${y + 69}" text-anchor="end" class="shortcutUse">${control}</text>`;
}

const shortcutReference = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="shortcutBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#05070C"/>
      <stop offset="0.5" stop-color="#0A1020"/>
      <stop offset="1" stop-color="#160D2A"/>
    </linearGradient>
    <style>
      .shortcutTitle { fill:#F7FBFF; font:700 48px -apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; }
      .shortcutSubtitle { fill:#AFC2D9; font:400 21px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .shortcutCard { fill:#0A0E17; stroke:#26334A; stroke-width:2; }
      .shortcutCommand { fill:#F7FBFF; font:650 22px -apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; }
      .shortcutChord { fill:#A77BFF; font:650 19px ui-monospace,SFMono-Regular,Menlo,monospace; }
      .shortcutUse { fill:#B8C7DA; font:500 16px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .shortcutFooter { fill:#C7D5E7; font:550 18px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .shortcutSmall { fill:#8FA4BE; font:450 15px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="url(#shortcutBg)"/>
  <text x="70" y="70" class="shortcutTitle">Codex Control · Keyboard Shortcut Reference</text>
  <text x="1850" y="66" text-anchor="end" class="shortcutSubtitle">Ten custom bindings · reserved Control + Option + Command family</text>
  ${shortcutReferenceRows.map(shortcutCard).join("\n")}
  <rect x="70" y="864" width="1780" height="144" rx="28" class="shortcutCard"/>
  <text x="104" y="910" class="shortcutFooter">Round 1–3: Command / Agents / Skills · Round 5: Create · Round 6: Operate · Round 7: Personal · Round 8: Quick Text</text>
  <text x="104" y="950" class="shortcutFooter">Fn+5 empty · Fn+6 Fast · Voice, Dictate, and Plan remain on the Command touchscreen</text>
  <text x="1816" y="910" text-anchor="end" class="shortcutSmall">Right squares: A Personal · B Agents · C Quick Text · D Skills · Fn layer · E Decline</text>
  <text x="1816" y="950" text-anchor="end" class="shortcutSmall">Fn+A Reasoning Up · Fn+C Reasoning Down · Fn+Round 7 Approve</text>
  <text x="1816" y="992" text-anchor="end" class="shortcutSmall">Codex Control · v1.0.0</text>
</svg>
`;

fs.writeFileSync(
  path.join(outputDir, "codex-keyboard-shortcut-reference.svg"),
  shortcutReference,
);

const hero = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#03050A"/>
      <stop offset="0.52" stop-color="#091323"/>
      <stop offset="1" stop-color="#1D0D33"/>
    </linearGradient>
    <radialGradient id="heroGlow" cx="48%" cy="44%" r="58%">
      <stop offset="0" stop-color="#3EDBFF" stop-opacity="0.22"/>
      <stop offset="0.58" stop-color="#A77BFF" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="heroWheelClip"><circle cx="1620" cy="875" r="132"/></clipPath>
    <style>
      .heroEyebrow { fill:#35D9FF; font:700 20px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; letter-spacing:3px; }
      .heroTitle { fill:#F7FBFF; font:750 72px -apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; }
      .heroBody { fill:#B8C7DA; font:450 28px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .heroPill { fill:#0B1422; stroke:#304667; stroke-width:2; }
      .heroPillText { fill:#DDE9F7; font:650 18px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .section { fill:#F7FBFF; font:650 21px -apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; }
      .label { fill:#C7D5E7; font:550 11px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .panel { fill:#080D16; stroke:#263E5C; stroke-width:2; }
      .heroFooter { fill:#7890AD; font:500 18px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="url(#heroBg)"/>
  <rect width="1920" height="1080" fill="url(#heroGlow)"/>
  <text x="76" y="122" class="heroEyebrow">LOUPEDECK CT · OPENAI CODEX · macOS</text>
  <text x="76" y="235" class="heroTitle">Codex Control</text>
  <text x="76" y="322" class="heroTitle">for Loupedeck CT</text>
  <text x="76" y="407" class="heroBody">Seven purpose-built workspaces, 96 custom action</text>
  <text x="76" y="447" class="heroBody">icons, paste-only prompts, and a full-wheel</text>
  <text x="76" y="487" class="heroBody">reasoning control for Codex on macOS.</text>
  <rect x="76" y="552" width="210" height="54" rx="27" class="heroPill"/>
  <text x="181" y="587" text-anchor="middle" class="heroPillText">FULL + LITE</text>
  <rect x="304" y="552" width="236" height="54" rx="27" class="heroPill"/>
  <text x="422" y="587" text-anchor="middle" class="heroPillText">PASTE-ONLY</text>
  <rect x="558" y="552" width="230" height="54" rx="27" class="heroPill"/>
  <text x="673" y="587" text-anchor="middle" class="heroPillText">REBUILDABLE</text>
  <text x="76" y="724" class="heroBody">Command · Agents · Skills · Create</text>
  <text x="76" y="768" class="heroBody">Operate · Personal · Quick Text</text>
  <text x="76" y="986" class="heroFooter">Codex Control · v1.0.0 · macOS</text>
  <g transform="translate(920 28) scale(0.47)">
    ${panel("COMMAND · ROUND 1", commandNames, 30, 92, "command")}
    ${panel("CREATE · ROUND 5", createNames, 500, 92, "create")}
    ${panel("OPERATE · ROUND 6", operateNames, 30, 430, "operate")}
    ${panel("PERSONAL · ROUND 7", personalNames, 500, 430, "personal")}
  </g>
  <image href="data:image/png;base64,${wheelIdleData}" x="1488" y="743" width="264" height="264" clip-path="url(#heroWheelClip)"/>
  <circle cx="1620" cy="875" r="136" fill="none" stroke="#A77BFF" stroke-width="3" opacity="0.8"/>
  <text x="1620" y="1040" text-anchor="middle" class="heroFooter">FULL-WHEEL REASONING</text>
</svg>
`;
fs.writeFileSync(path.join(outputDir, "codex-control-hero.svg"), hero);

const socialPreview = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640">
  <defs>
    <linearGradient id="socialBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#03050A"/>
      <stop offset="0.55" stop-color="#091323"/>
      <stop offset="1" stop-color="#1D0D33"/>
    </linearGradient>
    <radialGradient id="socialGlow" cx="72%" cy="45%" r="52%">
      <stop offset="0" stop-color="#35D9FF" stop-opacity="0.25"/>
      <stop offset="0.65" stop-color="#A77BFF" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="socialWheelClip"><circle cx="1004" cy="318" r="210"/></clipPath>
    <style>
      .socialEyebrow { fill:#35D9FF; font:700 16px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; letter-spacing:2.5px; }
      .socialTitle { fill:#F7FBFF; font:750 54px -apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; }
      .socialBody { fill:#B8C7DA; font:450 22px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
      .socialFooter { fill:#7890AD; font:550 16px -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
    </style>
  </defs>
  <rect width="1280" height="640" fill="url(#socialBg)"/>
  <rect width="1280" height="640" fill="url(#socialGlow)"/>
  <text x="64" y="92" class="socialEyebrow">OPENAI CODEX · LOUPEDECK CT · macOS</text>
  <text x="64" y="190" class="socialTitle">Codex Control</text>
  <text x="64" y="254" class="socialTitle">for Loupedeck CT</text>
  <text x="64" y="326" class="socialBody">Seven workspaces · prompt pages · custom icons</text>
  <text x="64" y="360" class="socialBody">Full-wheel reasoning · reproducible builds</text>
  <text x="64" y="550" class="socialFooter">FULL + LITE · v1.0.0</text>
  <image href="data:image/png;base64,${wheelIdleData}" x="794" y="108" width="420" height="420" clip-path="url(#socialWheelClip)"/>
  <circle cx="1004" cy="318" r="226" fill="none" stroke="#A77BFF" stroke-width="3" opacity="0.75"/>
</svg>
`;
fs.writeFileSync(path.join(outputDir, "github-social-preview.svg"), socialPreview);

console.log(`Generated ${manifest.length} base icons and ${labeledManifest.length} labeled page icons in ${iconDir}`);
console.log(`Generated seven-workspace control map, eight focused references, hero, and social preview in ${outputDir}`);
