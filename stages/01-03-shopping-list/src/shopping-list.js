/** Убирает внешние пробелы; пустое имя нельзя добавить в список. */
export function normalizeItemName(text) {
  const name = text.trim();
  return name === '' ? { ok: false, error: 'Enter an item name.' } : { ok: true, name };
}

/** Создаёт объект товара и новый массив, сохраняя допустимые дубликаты. */
export function addShoppingItem(items, id, text) {
  const normalized = normalizeItemName(text);
  if (!normalized.ok) return normalized;
  return { ok: true, items: [...items, { id, name: normalized.name }] };
}

/** Возвращает стабильный ключ товара; одинаковые названия остаются разными элементами. */
export function getShoppingItemKey(item) {
  return item.id;
}

/** Возвращает новый пустой массив для полного сброса состояния. */
export function clearShoppingItems() {
  return [];
}
