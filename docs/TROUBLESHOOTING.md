# Troubleshooting

## Profile is not listed

Confirm the file was imported through the Loupedeck application, restart the host, bring Codex to the front, and check the application profile selector. Do not manually unpack the `.LP4` into application-support folders.

## Full wheel is missing or compact

Full requires both the `.lplug4` wheel plugin and the Full `.LP4` profile. Install the plugin first, restart the host, then import or reselect Full. Lite intentionally uses a smaller built-in wheel image.

## A command button does nothing

Bring Codex to the front and inspect `Command + /`. Verify the exact command/chord pair in [SHORTCUTS.md](SHORTCUTS.md). Run `npm run check-shortcuts` for a read-only JSON comparison.

## Prompt text does not submit

That is expected. Prompt pages are paste-only so the text can be reviewed, combined with your request, or edited before submission.

## Prompt text lands in the wrong app

`TypeText` targets the current text focus. Click the intended Codex composer before pressing a prompt tile.

## Existing profile was replaced

Restore the backup created before installation through Loupedeck's profile UI. Full and Lite intentionally share one public profile ID, so switching between them can replace the other variant.

## Wheel plugin will not build

Confirm the .NET 8 SDK is on `PATH`, run `npm run sdk`, and verify that `build/sdk/PluginApi.dll` exists. The SDK DLL belongs only in ignored build output. Never commit or ship it.

## Artwork looks clipped

Run `npm run artwork`, then `node tools/render-gallery.mjs`. Inspect the 1920×1080 PNG and matching SVG. Keep labels within the existing safe areas and use short two-line device labels.

## Restore path

Use the supported Loupedeck UI to remove the imported public profile and reinstall your prior export. Remove the wheel plugin through host plugin management only if no other installed profile uses it.
