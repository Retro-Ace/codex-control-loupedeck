# Codex Control Wheel

This narrowly scoped Logitech Actions SDK plugin supplies the full-surface center-wheel renderer for the Codex Loupedeck CT profile.

- Turn left executes the profile's reasoning-decrease branch.
- Turn right executes the profile's reasoning-increase branch.
- Tap executes the profile adjustment reset, which cycles reasoning effort.
- Idle and 220 ms pulse art are embedded from `src/icons/wheel/`.
- The pulse acknowledges an input only. It does not represent the current reasoning level.

The source targets .NET 8 and compiles against `PluginApi.dll` from Logitech's official `LogiPluginTool` 6.1.4.22672 NuGet package. Run `npm run sdk` to retrieve it into the ignored `build/sdk/` directory. The SDK assembly is not committed or shipped in the plugin.

The profile must reference the plugin-qualified wheel template `CodexControlWheel___CodexControlReasoningWheel`. The plugin adds only this renderer and does not replace or own the existing Codex application profile, workspaces, actions, or shortcuts.

With Node.js and the .NET 8 SDK available, build the source with:

```sh
npm run sdk
npm run plugin
```

The Full profile uses `CodexControlWheel___CodexControlReasoningWheel`. The Lite profile preserves turn and tap behavior using Loupedeck's built-in small center renderer and does not require this plugin.
