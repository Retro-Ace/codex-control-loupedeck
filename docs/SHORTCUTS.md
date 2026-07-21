# Keyboard shortcuts

## Ten required custom bindings

Open Codex and press `Command + /`. Enter these bindings manually in **Keyboard Shortcuts**.

| Codex command | Shortcut | Controller use |
| --- | --- | --- |
| Toggle Plan mode | `Control + Option + Command + 1` | Command page Plan |
| Toggle Fast mode | `Control + Option + Command + 2` | Command page Fast and Fn+round 6 |
| Decrease reasoning effort | `Control + Option + Command + 3` | Wheel/dial down and Fn+C |
| Increase reasoning effort | `Control + Option + Command + 4` | Wheel/dial up and Fn+A |
| Cycle reasoning effort | `Control + Option + Command + 5` | Wheel/dial press |
| Attach files and folders | `Control + Option + Command + 6` | Add Files |
| Add photos | `Control + Option + Command + 7` | Add Photos |
| Switch chat | `Control + Option + Command + 8` | Switch Chat and task-history press |
| Hold-to-dictate hotkey | `Control + Option + Command + 9` | Hold Voice; release to stop |
| Toggle dictation hotkey | `Control + Option + Command + 0` | Press Dictate to start/stop |

The JSON reference uses `Alt` for macOS Option because that is Codex's serialized key name.

## Built-in shortcuts used by the profile

These are not part of `codex-keybindings.json`:

| Action | Built-in shortcut |
| --- | --- |
| New Chat | `Command + N` |
| Quick Chat | `Command + Option + N` |
| Side Chat | `Command + Option + S` |
| Choose Project | `Command + Option + Shift + O` |
| Choose Model | `Control + Shift + M` |
| Task 1–9 | `Command + 1` through `Command + 9` |
| Previous task | `Command + Shift + [` |
| Next task | `Command + Shift + ]` |
| Approve | `Return` |
| Decline / Cancel | `Escape` |

Codex can change its defaults. If a built-in control stops working, inspect the current Keyboard Shortcuts screen before changing the profile.

## Read-only checker

```sh
npm run check-shortcuts
```

The checker:

- Reads the default Codex keybinding file.
- Normalizes `Control`/`Ctrl`, `Option`/`Alt`, and `Command`/`Cmd` names.
- Reports missing commands, mismatched chords, and duplicate use of a required chord.
- Makes no changes.

JSON equality does not prove the application activated an externally restored file. The visible Codex Keyboard Shortcuts screen remains authoritative.

## Safe test order

1. Switch Chat.
2. Add Files and Add Photos, canceling each picker.
3. Toggle Plan and Fast.
4. Change reasoning down, up, and cycle.
5. Test Voice and Dictate in a disposable field.
6. Test Approve and Decline only when a controlled approval prompt is visible.
