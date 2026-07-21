# Building

## Toolchain

- macOS
- Node.js 20 or newer
- .NET 8 SDK
- Swift toolchain with AppKit and WebKit
- `zip`, `unzip`, and `xmllint`

## Complete release build

```sh
npm run release
```

The release task:

1. Regenerates icons and editable reference SVGs.
2. Compiles the local SVG renderer and creates web PNGs.
3. Retrieves Logitech's official SDK package into ignored `build/` paths and verifies its pinned SHA-256 digest.
4. Builds the wheel plugin without shipping `PluginApi.dll` or PDB files.
5. Builds Full and Lite profiles from the sanitized baseline.
6. Validates counts, exact prompts, paste-only macros, icons, workspaces, dials, wheel pages, and physical mappings.
7. Packages and inspects `.LP4`, `.lplug4`, and all-in-one ZIP archives.
8. Parses generated JSON and SVG files.
9. Runs the shortcut and privacy audits.

Artifacts are written to `dist/`. Intermediate files and retrieved SDK components remain in ignored `build/` paths.

## Offline SDK input

If the official NuGet package is already available:

```sh
LOGI_PLUGIN_TOOL_NUPKG=/path/to/logiplugintool.6.1.4.22672.nupkg npm run sdk
```

The pinned digest still must match. The package is not copied into source control.

## Individual tasks

```sh
npm run artwork
npm run sdk
dotnet build src/wheel-plugin/CodexControlWheelPlugin.csproj -c Release
node tools/check-keybindings.mjs --file src/codex-keybindings.json
npm run validate:privacy
```

Profile generation and validation accept explicit app roots and wheel modes; see each script's usage error for the exact arguments.
