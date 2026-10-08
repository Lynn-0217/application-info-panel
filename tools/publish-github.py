"""Publish explicitly selected project files and release assets using an existing GCM login.

Credentials are read only into process memory and never printed or written to disk.
The publisher refuses to overwrite an existing repository unless it is resuming its
own recorded creation. Run --check for a read-only account/repository check.
"""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / "artifacts/github-publish.json"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner", required=True)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--publish", action="store_true")
    args = parser.parse_args()
    credential = subprocess.run(
        ["git", "credential-manager", "get"],
        input=f"protocol=https\nhost=github.com\nusername={args.owner}\n\n",
        text=True, encoding="utf-8", capture_output=True,
        env={**os.environ, "GCM_INTERACTIVE": "never"}, check=False,
    )
    if credential.returncode:
        raise RuntimeError("Cannot access the existing GitHub login. No credentials were printed.")
    fields = dict(line.split("=", 1) for line in credential.stdout.splitlines() if "=" in line)
    token = fields.get("password")
    if not token:
        raise RuntimeError("No existing GitHub credential was found.")

    def api(method, route, body=None, content_type="application/json"):
        url = route if route.startswith("https://") else "https://api.github.com" + route
        if urllib.parse.urlparse(url).hostname not in {"api.github.com", "uploads.github.com"}:
            raise ValueError("Unexpected API destination")
        data = body if isinstance(body, bytes) else json.dumps(body).encode() if body is not None else None
        request = urllib.request.Request(url, data=data, method=method, headers={
            "Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "application-info-panel-publisher",
            "Content-Type": content_type,
        })
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                payload = response.read()
                return json.loads(payload) if payload else None
        except urllib.error.HTTPError as error:
            try:
                message = json.loads(error.read()).get("message", "API request failed")
            except (ValueError, AttributeError):
                message = "API request failed"
            raise RuntimeError(f"GitHub HTTP {error.code}: {message}") from None

    account = api("GET", "/user")
    if account["login"].lower() != args.owner.lower():
        raise RuntimeError("Authenticated account differs from the selected repository owner.")
    slug = f"{args.owner}/{args.repo}"
    prefix = f"/repos/{slug}"
    try:
        repo = api("GET", prefix)
    except RuntimeError as error:
        if "HTTP 404:" not in str(error):
            raise
        repo = None
    print(json.dumps({"account": account["login"], "repository": slug, "exists": repo is not None}, ensure_ascii=True), flush=True)
    if not args.publish:
        return

    version = json.loads((ROOT / "package.json").read_text())["version"]
    for line in (ROOT / "dist/SHA256SUMS.txt").read_text().splitlines():
        digest, filename = line.split("  ", 1)
        file = ROOT / "dist" / filename
        if file.parent != ROOT / "dist" or hashlib.sha256(file.read_bytes()).hexdigest() != digest:
            raise RuntimeError("Release checksum verification failed")
    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    if repo and (state.get("repository") != slug or state.get("repo_id") != repo["id"]):
        raise RuntimeError("Repository already exists. Refusing to overwrite it.")
    if repo and state.get("version") != version:
        state = {"repository": slug, "repo_id": repo["id"], "version": version, "expected_head": state.get("commit")}
        STATE.write_text(json.dumps(state, indent=2) + "\n")
    if not repo:
        repo = api("POST", "/user/repos", {
            "name": args.repo, "description": "Compact local-first Chrome info library. Chinese and English packages.",
            "private": False, "auto_init": True,
        })
        state = {"repository": slug, "repo_id": repo["id"], "version": version}
        STATE.parent.mkdir(exist_ok=True)
        STATE.write_text(json.dumps(state, indent=2) + "\n")
        print("Created public repository: " + repo["html_url"], flush=True)
    if repo["private"]:
        raise RuntimeError("Expected a public repository.")

    if not state.get("commit"):
        files = [ROOT / name for name in [
            ".gitignore", ".gitattributes", "README.md", "README.zh-CN.md", "CHANGELOG.md", "VALIDATION.md", "package.json", "environment.yml"
        ]]
        for folder in ["application-info-panel", "tests", "tools", "docs", ".github"]:
            files += [file for file in (ROOT / folder).rglob("*")
                      if file.is_file() and "__pycache__" not in file.parts and file.suffix != ".pyc"]
        branch = repo["default_branch"]
        head = api("GET", prefix + "/git/ref/heads/" + branch)["object"]["sha"]
        if state.get("expected_head") and head != state["expected_head"]:
            raise RuntimeError("Remote source changed since the previous release. Refusing to overwrite it.")
        base = api("GET", prefix + "/git/commits/" + head)["tree"]["sha"]
        entries = []
        for file in sorted(set(files)):
            path = file.relative_to(ROOT).as_posix()
            body = file.read_bytes()
            entry = {"path": path, "mode": "100644", "type": "blob"}
            if file.suffix in {".png", ".jpg"}:
                entry["sha"] = api("POST", prefix + "/git/blobs", {
                    "content": base64.b64encode(body).decode(), "encoding": "base64"
                })["sha"]
            else:
                entry["content"] = body.decode("utf-8")
            entries.append(entry)
        tree = api("POST", prefix + "/git/trees", {"base_tree": base, "tree": entries})
        commit = api("POST", prefix + "/git/commits", {
            "message": f"Release v{version}: optional persistent side panel",
            "tree": tree["sha"], "parents": [head],
        })
        api("PATCH", prefix + "/git/refs/heads/" + branch, {"sha": commit["sha"], "force": False})
        state["commit"] = commit["sha"]
        state["file_count"] = len(entries)
        STATE.write_text(json.dumps(state, indent=2) + "\n")
        print(f"Published {len(entries)} source files", flush=True)

    release_notes = (ROOT / "docs/RELEASE.md").read_text(encoding="utf-8")
    if not state.get("release_id"):
        release = api("POST", prefix + "/releases", {
            "tag_name": f"v{version}", "target_commitish": state["commit"],
            "name": f"v{version} — 中文版 / English", "body": release_notes, "draft": True,
        })
        state["release_id"] = release["id"]
        STATE.write_text(json.dumps(state, indent=2) + "\n")
    release = api("GET", prefix + f"/releases/{state['release_id']}")
    existing = {asset["name"]: asset for asset in release["assets"]}
    assets = [ROOT / "dist" / f"application-info-panel-{version}-{language}.zip" for language in ["zh-CN", "en"]]
    assets.append(ROOT / "dist/SHA256SUMS.txt")
    for file in assets:
        if file.name in existing:
            if existing[file.name]["size"] != file.stat().st_size:
                raise RuntimeError("An existing release asset differs. Refusing to replace it.")
            continue
        upload = release["upload_url"].split("{", 1)[0] + "?" + urllib.parse.urlencode({"name": file.name})
        body = file.read_bytes()
        result = api("POST", upload, body, "application/zip" if file.suffix == ".zip" else "text/plain")
        if result["size"] != len(body):
            raise RuntimeError("Uploaded asset size does not match")
        print("Uploaded " + file.name, flush=True)
    release = api("PATCH", prefix + f"/releases/{state['release_id']}", {"draft": False, "make_latest": "true"})
    state["release_url"] = release["html_url"]
    state["assets"] = [{"name": a["name"], "url": a["browser_download_url"], "size": a["size"]} for a in release["assets"]]
    STATE.write_text(json.dumps(state, indent=2) + "\n")
    print(json.dumps({"repository_url": repo["html_url"], "release_url": release["html_url"], "assets": state["assets"]}, ensure_ascii=True), flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Do not include subprocess objects or HTTP headers in error reports.
        raise SystemExit(str(error)) from None
