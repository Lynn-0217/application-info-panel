importScripts('language.js', 'i18n.js', 'info-model.js', 'info-store.js');
const repository = createInfoRepository(chrome.storage.local);
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.scope !== 'application-info' || sender.id !== chrome.runtime.id) return;
  repository.dispatch(request).then(result => sendResponse({ ok: true, ...result }), error => sendResponse({ ok: false, error: error.message }));
  return true;
});
