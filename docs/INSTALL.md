# Installation

## Before you begin

You need macOS, Loupedeck CT, the Loupedeck desktop application, and OpenAI Codex for macOS. Download either Full or Lite from the release page.

- **Full** uses the optional `CodexControlWheel` plugin for full-surface wheel art and a 220 ms input-confirmation pulse.
- **Lite** uses Loupedeck's built-in compact wheel renderer. All seven workspaces and control shortcuts remain the same.

The profiles share the public profile ID `C0D1472659FDA0816544EA590C12CDE3`, so install one variant at a time.

## 1. Back up your current Loupedeck setup

Open the Loupedeck application and export the profile you currently use, or use Loupedeck's supported backup method for your installed version. Give the backup a recognizable name and keep it outside this download folder.

Do not replace a working profile without a restorable copy. The public profile uses its own ID, but application/profile import behavior can vary between Loupedeck software versions.

## 2. Install Full or Lite

### Full

1. Open `CodexControlWheel-v1.0.0.lplug4` and approve installation in the Loupedeck/Logi host.
2. Open or import `Codex-Control-Loupedeck-CT-v1.0.0.LP4` in the Loupedeck application.
3. Select Codex Control for the Codex application profile.

### Lite

1. Open or import `Codex-Control-Loupedeck-CT-Lite-v1.0.0.LP4` in the Loupedeck application.
2. Select Codex Control Lite for the Codex application profile.

Lite does not require the wheel plugin. Installing both profile variants is unnecessary because they use the same profile ID and differ only in the wheel renderer.

## 3. Restart if needed

If the imported profile, icons, or Full wheel does not appear:

1. Quit the Loupedeck application.
2. Reopen it and wait for the Logi Plugin Service to finish loading.
3. Bring Codex to the front.
4. Re-select the imported profile.

Avoid manually copying files into Loupedeck's application-support directories. Use the host application's supported plugin and profile installation flow.

## 4. Assign the ten Codex shortcuts

1. Bring Codex to the front.
2. Press `Command + /` to open **Keyboard Shortcuts**.
3. Search for each command shown in [SHORTCUTS.md](SHORTCUTS.md).
4. Select its shortcut field and press the documented `Control + Option + Command + number` chord.
5. Save if prompted and confirm the shortcut remains visible.

The bundled `codex-keybindings.json` is a reference, not an installer. Codex's Keyboard Shortcuts screen is the activation authority. Preserve unrelated shortcuts.

## 5. Run the read-only shortcut check

From the repository root:

```sh
npm run check-shortcuts
```

To inspect a different exported/reference file:

```sh
node tools/check-keybindings.mjs --file /path/to/keybindings.json
```

The checker reads JSON and reports missing, mismatched, or conflicting assignments. It does not write to Codex.

## 6. Verify safely

1. Confirm all seven touchscreen pages show twelve assigned buttons.
2. Test New Chat, task switching, and workspace navigation.
3. Press a prompt tile with the cursor in an empty composer. Confirm text appears and is not submitted.
4. Turn the center wheel left and right, then tap it, while watching Codex's reasoning selector.
5. Test Voice and Dictate only with the cursor in a disposable field.
6. Test Approve and Decline only against a controlled prompt.

Use the complete [manual CT checklist](MANUAL_TEST_CHECKLIST.md) for release-grade verification.

## Uninstall or restore

Use Loupedeck's profile management UI to remove the imported profile or restore your exported backup. Remove the `CodexControlWheel` plugin through the host's plugin management flow if you no longer use Full. Do not delete application-support folders manually.
