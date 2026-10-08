中文和英文两份独立安装包，功能相同，界面语言由包决定。

- **中文版**：`application-info-panel-0.4.0-zh-CN.zip`
- **English**: `application-info-panel-0.4.0-en.zip`
- **SHA-256**: `SHA256SUMS.txt`

解压后，在 Chrome 的 `chrome://extensions` 开启开发者模式，点击「加载已解压的扩展程序」，选择包含 `manifest.json` 的文件夹。固定工具栏图标后即可使用。

Extract your ZIP, open `chrome://extensions`, enable Developer mode, click Load unpacked, and select the folder containing `manifest.json`. Pin the extension to the toolbar.

通用分类 / 名称 / 内容信息库；搜索、单一复制、图标编辑和直接删除、JSON 导入 / 导出。数据保存在浏览器本地，无服务器和网页读取。中英文备份互相兼容，个人内容不会翻译。

A compact local info library with categories, search, content copying, edit/delete icons and JSON backup import/export. No server or webpage-reading permissions. Backups are compatible across languages; user content is never translated.

更新前请导出备份。覆盖原安装文件夹中的文件并重新加载，可继续使用同一安装。不要通过卸载更新；卸载会删除本地数据。

Before updating, export a backup. Replace files in the existing installation folder and reload the extension. Uninstalling removes local data.

验证：20 项自动化测试通过；本地实际检查中英文界面、英文新增、搜索、完整多行复制和删除确认。原生 Chrome 窗口位置及完整浏览器重启未由自动化实测。

Validation: 20 automated tests passed, plus local browser checks of both interfaces, English add/search, multiline copying and delete confirmation. Native popup anchoring and a complete Chrome restart were not directly automated.

These are local unpacked packages, not Chrome Web Store listings. / 本发布不是 Chrome 应用商店上架。
