中文和英文两份独立安装包，功能相同，界面语言由包决定。

**新增固定功能**：点击「新增」旁的图钉，转为 Chrome 原生侧栏，在点击网页或切换标签页时持续显示。默认仍是小弹窗，侧栏通过浏览器顶部的 × 关闭。需要 Chrome 116+，增加 `sidePanel` 权限，不增加网页读取权限。

**New: Pin to side panel.** Click the pin beside Add to keep the library open while browsing or switching tabs. The toolbar still opens the compact popup by default. Close the panel using Chrome's × button. Requires Chrome 116+ and the `sidePanel` permission; no webpage access is added.

- **中文版**：`application-info-panel-0.5.0-zh-CN.zip`
- **English**: `application-info-panel-0.5.0-en.zip`
- **SHA-256**: `SHA256SUMS.txt`

解压后，在 Chrome 的 `chrome://extensions` 开启开发者模式，点击「加载已解压的扩展程序」，选择包含 `manifest.json` 的文件夹。固定工具栏图标后即可使用。

Extract your ZIP, open `chrome://extensions`, enable Developer mode, click Load unpacked, and select the folder containing `manifest.json`. Pin the extension to the toolbar.

通用分类 / 名称 / 内容信息库；搜索、单一复制、图标编辑和直接删除、JSON 导入 / 导出。数据保存在浏览器本地，无服务器和网页读取。中英文备份互相兼容，个人内容不会翻译。

A compact local info library with categories, search, content copying, edit/delete icons and JSON backup import/export. No server or webpage-reading permissions. Backups are compatible across languages; user content is never translated.

更新前请导出备份。覆盖原安装文件夹中的文件并重新加载，可继续使用同一安装。不要通过卸载更新；卸载会删除本地数据。

Before updating, export a backup. Replace files in the existing installation folder and reload the extension. Uninstalling removes local data.

验证：24 项自动化测试通过；本地检查中英文弹窗及侧栏布局。固定接口验证涵盖窗口范围、用户点击时同步打开、成功后关闭弹窗、失败保留及重试。原生 Chrome 的侧栏打开和切换标签未直接实测，网页示例不提供实际固定。

Validation: 24 automated tests passed, including pin opening within a user gesture, window-wide scope and failure/retry handling. Both popup and side panel layouts were checked locally. Native Chrome side-panel opening and tab switching were not directly tested. The web demo does not implement native pinning.

These are local unpacked packages, not Chrome Web Store listings. / 本发布不是 Chrome 应用商店上架。
