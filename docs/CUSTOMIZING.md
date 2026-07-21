# Customizing

## Safe customization model

Start from a copy of the repository, keep the profile ID distinct from any profile you already use, and build into `build/`. Import only after the validator passes.

## Change prompts

Prompt definitions live in `tools/build-profile.mjs`. Keep each prompt macro to one `TypeText` action. Update the matching expected text in `tools/validate-profile.mjs` and the readable table in `docs/WORKSPACES.md` in the same change.

Do not add Return, Enter, automatic submission, or consequential external actions to prompt tiles.

## Change icons

- Base and labeled SVGs: `src/icons/`
- Icon generator: `tools/generate-icons.mjs`
- Wheel art: `src/icons/wheel/`
- Editable 1920×1080 guides: `docs/svg/`
- Web PNGs: `docs/images/`

Run `npm run artwork`, inspect the SVGs and PNGs, and then run the complete release build.

## Change control mappings

Mappings are generated in `tools/build-profile.mjs` and asserted in `tools/validate-profile.mjs`. Preserve round/square Fn branches and the seven touchscreen, encoder, and wheel pages unless the intended version explicitly changes them.

## Create a separate profile identity

Use a new 32-character uppercase hexadecimal profile ID. Rename the directory under `src/profile-base/com.openai.codex/Profiles/`, update `ProfileInfo.json`, and change `profileId` in `tools/package-release.mjs`. A unique ID reduces the chance of replacing another imported profile.

## Keep the public tree safe

Run `npm run validate:privacy`. Do not add local application-support paths, account screenshots, real photographs, exported private profiles, personal names, email addresses, tokens, `.DS_Store`, PDBs, SDK DLLs, or build output.
