(function (root) {
  'use strict';
  const { t } = root.InfoI18n || require('./i18n.js');
  const M = root.InfoModel || require('./info-model.js');
  function createRepository(storage) {
    let queue = Promise.resolve();
    function dispatch(request) {
      const operation = queue.then(async () => {
        const data = await storage.get(M.STORAGE_KEY);
        let items = data[M.STORAGE_KEY] === undefined ? [] : M.validateItems(data[M.STORAGE_KEY]);
        if (request.action === 'load') return { items };
        let added = 0;
        if (request.action === 'save' || request.action === 'delete') {
          const id = request.action === 'save' ? request.item?.id : request.id;
          const existing = items.find(i => i.id === id);
          if ((existing?.updatedAt ?? null) !== (request.expectedUpdatedAt ?? null)) throw new Error(t('此信息已在其他窗口更新，请关闭编辑后重新打开'));
          if (request.action === 'save') {
            const next = M.validateItem(request.item);
            next.updatedAt = `${new Date().toISOString()}:${crypto.randomUUID()}`;
            items = existing ? items.map(i => i.id === id ? next : i) : [next, ...items];
          } else {
            if (!existing) throw new Error(t('信息已不存在'));
            items = items.filter(i => i.id !== id);
          }
        } else if (request.action === 'import') {
          const imported = M.parseBackup(request.backup);
          const signatures = new Set(items.map(M.signature));
          const ids = new Set(items.map(i => i.id));
          const additions = [];
          for (const item of imported) {
            if (signatures.has(M.signature(item))) continue;
            const next = { ...item, id: ids.has(item.id) ? crypto.randomUUID() : item.id, updatedAt: `${new Date().toISOString()}:${crypto.randomUUID()}` };
            additions.push(next);
            signatures.add(M.signature(next));
            ids.add(next.id);
          }
          added = additions.length;
          items = [...additions, ...items];
        } else throw new Error(t('未知操作'));
        items = M.validateItems(items);
        await storage.set({ [M.STORAGE_KEY]: items });
        return { items, added };
      });
      queue = operation.catch(() => {});
      return operation;
    }
    return { dispatch };
  }
  root.createInfoRepository = createRepository;
  if (typeof module !== 'undefined') module.exports = { createRepository };
})(globalThis);
