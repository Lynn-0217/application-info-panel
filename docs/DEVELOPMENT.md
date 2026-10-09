# Development and reproducible packaging

For installation and everyday use, see the [English README](../README.md) or [中文使用说明](../README.zh-CN.md).

## Requirements

The extension uses plain HTML, CSS and JavaScript with no npm dependencies. The verified toolchain is Node.js 24.16.0 and Python 3.10.20. Pillow 12.2 is needed only to regenerate icons. Python and Conda are not required to use the installed extension.

An optional Conda environment is defined in the repository. Run from the project root:

```sh
conda env create --prefix ./.conda --file environment.yml
conda activate ./.conda
```

You can also use an existing environment with the same dependencies. Keep local environments out of source control.

## Test, build and preview

Run from the project root, with Node.js and Python available in your environment:

```sh
npm test
npm run build
npm run preview
```

The preview opens at `http://127.0.0.1:8765/popup.html?demo`. It uses fictional data held in page memory, which resets on refresh. Stop the preview server before starting another on the same port. After building, run `node tools/preview.cjs --language en` or `node tools/preview.cjs --language zh-CN` to preview a generated language package. Open `/sidepanel.html?demo` to inspect the side-panel layout.

A web preview cannot verify Chrome's native popup positioning, side-panel opening or persistent extension storage. Load the extension in Chrome to check those behaviors. See [VALIDATION.md](../VALIDATION.md) for checks performed and their limits.

## Build output

`dist/` contains Chinese and English unpacked directories, two ZIPs and `SHA256SUMS.txt`. The packager uses an explicit file list, fixed ZIP timestamps and stable file ordering. Identical source and toolchain produce matching checksums. Browser data, test exports and local environment files are excluded.

The package version must match in `package.json` and `application-info-panel/manifest.json`. The build generates `sidepanel.html` from `popup.html` using `node tools/generate-panel.cjs`, fixes the package language, and includes the relevant `docs/INSTALL.*.md` as the package README.

GitHub Actions runs the tests and builds both language packages. Release notes live in [RELEASE.md](RELEASE.md), and release assets are the two ZIPs plus the checksum file. Check the files selected for publication before publishing; keep personal records and credentials out of the repository and packages.

## Project layout

| Path | Purpose |
| --- | --- |
| `application-info-panel/` | Extension source, default Chinese interface and manifest |
| `application-info-panel/language.js`, `i18n.js` | Package language and shared translations |
| `application-info-panel/info-model.js`, `info-store.js` | Validation, search, backup parsing and queued storage writes |
| `application-info-panel/service-worker.js` | Background storage requests |
| `application-info-panel/pin-panel.js` | Opening the native side panel from a popup click |
| `tests/` | Model, storage, background, localization and pinning checks |
| `tools/build.py` | Bilingual package builder |
| `tools/preview.cjs` | Local preview server |
| `tools/render-icons.py` | Reproducible PNG icon generation |

Run `python tools/render-icons.py` to regenerate the included PNGs with Pillow 12.2.

## Storage and Chrome behavior

Entries use `chrome.storage.local` under `applicationInfoItems`. Popup and side-panel views share the same scripts and data. Writes are queued in the service worker; revision checks reject stale edits and deletions. Backups use the version 1 JSON format and are compatible across interface languages. The UI has no notes field, but legacy notes remain in existing data and backups for compatibility.

The default toolbar action opens a 340 × 480 popup. Pinning opens a window-wide native side panel; placement follows Chrome's settings. Chrome 116 or later is required. Permissions are `storage`, `clipboardWrite` and `sidePanel`, with no webpage access permissions.

Chrome references: [Popup](https://developer.chrome.com/docs/extensions/reference/api/action#popup), [Local storage](https://developer.chrome.com/docs/extensions/reference/api/storage), [Side panel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel).
