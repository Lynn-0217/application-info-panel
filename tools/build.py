"""Build reproducible Chinese and English unpacked Chrome extension ZIPs."""
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "application-info-panel"
DIST = ROOT / "dist"
FILES = [
    "manifest.json", "popup.html", "popup.js", "styles.css", "language.js", "i18n.js",
    "info-model.js", "info-store.js", "service-worker.js", "icon.svg",
    "icons/icon16.png", "icons/icon32.png", "icons/icon48.png", "icons/icon128.png",
]


def build():
    manifest = json.loads((SOURCE / "manifest.json").read_text(encoding="utf-8"))
    version = manifest["version"]
    workspace_version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
    if workspace_version != version:
        raise ValueError("Manifest and package versions must match")
    translations = json.loads(subprocess.check_output([
        "node", "-e", "process.stdout.write(JSON.stringify(require('./application-info-panel/i18n.js').english))"
    ], cwd=ROOT, text=True, encoding="utf-8"))
    DIST.mkdir(exist_ok=True)
    checksums = []
    for language, readme, name, description in [
        ("zh-CN", "docs/INSTALL.zh-CN.md", "信息库", "在浏览器右上角保存、搜索和复制常用信息，数据仅保存在本地。"),
        ("en", "docs/INSTALL.en.md", "Application Info Panel", "Save, search and copy frequently used info in a compact toolbar popup. Stored locally."),
    ]:
        folder = f"application-info-panel-{language}"
        payload = {file: (SOURCE / file).read_bytes() for file in FILES}
        localized_manifest = {**manifest, "name": name, "description": description,
                              "action": {**manifest["action"], "default_title": name}}
        payload["manifest.json"] = (json.dumps(localized_manifest, ensure_ascii=False, indent=2) + "\n").encode()
        payload["language.js"] = f"'use strict';\nglobalThis.INFO_LANGUAGE = '{language}';\n".encode()
        html = payload["popup.html"].decode("utf-8")
        if language == "en":
            html = html.replace('lang="zh-CN"', 'lang="en"')
            for key in sorted(translations, key=len, reverse=True):
                if any('\u4e00' <= char <= '\u9fff' for char in key):
                    html = html.replace(key, translations[key])
        payload["popup.html"] = html.encode()
        payload["README.md"] = (ROOT / readme).read_bytes()
        output = DIST / folder
        output.mkdir(exist_ok=True)
        for file, body in payload.items():
            target = output / file
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)
        archive = DIST / f"application-info-panel-{version}-{language}.zip"
        with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
            for file in sorted(payload):
                entry = zipfile.ZipInfo(f"{folder}/{file}", date_time=(2026, 10, 8, 0, 0, 0))
                entry.compress_type = zipfile.ZIP_DEFLATED
                entry.external_attr = 0o100644 << 16
                package.writestr(entry, payload[file], compresslevel=9)
        with zipfile.ZipFile(archive) as package:
            assert package.testzip() is None
            assert len(package.namelist()) == len(payload)
            assert json.loads(package.read(f"{folder}/manifest.json"))["version"] == version
        checksums.append(f"{hashlib.sha256(archive.read_bytes()).hexdigest()}  {archive.name}")
        print(f"Built {archive.name} ({archive.stat().st_size} bytes)")
    (DIST / "SHA256SUMS.txt").write_text("\n".join(checksums) + "\n", encoding="utf-8")


if __name__ == "__main__":
    build()
