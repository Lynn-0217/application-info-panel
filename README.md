# Application Info Panel

[简体中文](README.zh-CN.md) · English

Filling out another application form? You may find yourself opening the same documents again to copy your education history, mailing address or publication details.

Application Info Panel keeps frequently used information within reach in Chrome. Save it once, open the extension when you need it, and copy the relevant entry into your form. No account is needed; your information stays in your browser.

## When would I use it?

- **School and scholarship applications:** reuse education history, research experience, awards, citations and recommender contact details.
- **Job applications and registrations:** keep a personal introduction, work experience or mailing address ready for different websites.
- **Everyday reference:** save information you often need to look up.

Choose your own categories, such as Personal, Education or Publications. Each category can hold multiple entries.

![English interface showing fictional personal details and a citation](docs/screenshots/en.jpg)

*The screenshot uses fictional examples. A new installation starts with an empty library, ready for your own information.*

## Start here: install in Chrome

Open the [download page](https://github.com/Lynn-0217/application-info-panel/releases/latest) and look under **Assets**. Choose the file ending in `-en.zip` for English or `-zh-CN.zip` for Simplified Chinese.

Installation is currently manual; the extension is not listed in the Chrome Web Store. Use Chrome 116 or later. No additional software is needed.

1. Extract the ZIP into a folder you plan to keep.
2. Enter `chrome://extensions` in Chrome's address bar.
3. Turn on **Developer mode**, then click **Load unpacked**.
4. Select the extracted folder **containing `manifest.json`**. You may need to open an outer folder first.
5. Click Chrome's puzzle-piece icon and pin **Application Info Panel** to the toolbar.

Click the extension's toolbar icon to open your library. Keep the extracted folder in place: Chrome still needs its files after installation.

## Save something, then use it in a form

Click **Add** and fill in three fields. For example, to save a citation:

| Field | Example |
| --- | --- |
| Category: helps you find it later | Publications |
| Name: a label you will recognize | First paper citation |
| Content: the text you want to paste | Chen, A. (2025). Learning from limited data. Example Journal of Research. |

Click **Save** and wait for the confirmation. Your entry is now stored. Content can include multiple lines.

The next time you fill out a form:

1. Open the library from Chrome's toolbar.
2. Search for a keyword or select a category to find the entry.
3. Click **Copy** beside it, then paste into the form field.

Copy includes only the content, with its line breaks. The name and category stay out of the copied text. You can adjust the wording after pasting to fit the form.

## Keep the library open while you work

The small popup closes when you click back on a webpage. To keep your information visible, click the **pin beside Add inside the popup**. This opens Chrome's side panel, which stays open while you use the webpage or switch tabs in the same window. Close it with the × at the top of the side panel.

The two pins serve different purposes: the pin in Chrome's puzzle-piece menu keeps the extension icon on the toolbar; the pin inside the library keeps the library visible.

## Edit, delete and back up

Click an entry's **pencil** to edit it, then click **Save**. Click the **trash icon** to delete an entry; you will be asked to confirm.

Use **Export** at the bottom to download a backup of all your entries. To move them to another browser or computer, install the extension there, click **Import**, and select the backup. Import keeps existing entries and skips identical duplicates.

## Will my information stay saved? Is it private?

**Closing the popup or restarting Chrome does not erase saved entries.** Remember to save edits first: unsaved changes are lost when the popup closes.

Information stays in this browser. It is not uploaded to this GitHub repository or automatically synced to other computers. The extension needs no account and does not read the webpage you are filling out. Exported backups contain all your saved content, so keep them somewhere safe.

**Uninstalling the extension deletes its local information. Export a backup regularly.** Before updating or changing language, export a backup, replace the files in the **original installation folder**, and click the extension's reload button in `chrome://extensions`. Loading a different folder may create a separate installation; use your backup to transfer entries. Chinese and English backups work in either version. Your saved text is not translated.

## Interested in the project or contributing?

See the [development guide](docs/DEVELOPMENT.md), [change log](CHANGELOG.md) and [validation notes](VALIDATION.md). You do not need these to install or use the extension.
