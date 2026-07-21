# Third-party notices

Codex Control contains original profile configuration, source code, and artwork. It interoperates with third-party products but does not redistribute those products.

## Logitech and Loupedeck

The optional wheel plugin is built against `PluginApi.dll` from Logitech's official `LogiPluginTool` NuGet package, version `6.1.4.22672`. The build retrieves the package from NuGet and verifies this SHA-256 digest:

```text
b2f77c7abf767af2aea46a3bf52c126c1a1424dc69420bbbbd931f882a248545
```

`PluginApi.dll`, Logitech's package tooling, PDB files, and SDK binaries are excluded from this repository and from release artifacts. Logitech documents `.lplug4` as the distributable plugin format in the [Logi Actions SDK plugin basics](https://logitech.github.io/actions-sdk-docs/plugin-basics/).

Logitech, Logi, Loupedeck, and Loupedeck CT are trademarks or registered trademarks of their respective owners.

## OpenAI and other integrations

OpenAI, Codex, ChatGPT, Apple, macOS, Adobe, Lightroom, Google, Gmail, Google Calendar, Google Drive, GitHub, Canva, Expo, Remotion, and other product names are trademarks of their respective owners. They are referenced only to describe compatibility, guided prompt targets, or controls. No third-party application, plugin, skill, or service is bundled with this project.

This project is independent and is not affiliated with, endorsed by, or sponsored by any named third party.
