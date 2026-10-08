(function (root) {
  'use strict';
  // Cache the window before the click so sidePanel.open runs inside its user gesture.
  function createPanelPin(browser, closePopup) {
    let windowId;
    async function prepare() {
      if (!browser?.sidePanel?.open || !browser?.windows?.getCurrent) throw new Error('PIN_NOT_READY');
      const window = await browser.windows.getCurrent();
      if (!Number.isInteger(window?.id) || window.id < 0) throw new Error('PIN_NOT_READY');
      windowId = window.id;
    }
    function open() {
      if (!Number.isInteger(windowId)) throw new Error('PIN_NOT_READY');
      // windowId selects the global panel so it stays available across this window's tabs.
      return browser.sidePanel.open({ windowId }).then(() => closePopup());
    }
    return { prepare, open };
  }
  root.createPanelPin = createPanelPin;
  if (typeof module !== 'undefined') module.exports = { createPanelPin };
})(globalThis);
