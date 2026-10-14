import { addShoppingItem, clearShoppingItems, getShoppingItemKey, normalizeItemName } from '../src/shopping-list';

test('normalizes outer whitespace and rejects an empty item', () => {
  expect(normalizeItemName('  Milk  ')).toEqual({ ok: true, name: 'Milk' });
  expect(normalizeItemName('   ')).toEqual({ ok: false, error: 'Enter an item name.' });
});

test('adds duplicate names with separate ids without mutating the source array', () => {
  const before = [{ id: 'item-1', name: 'Milk' }];
  const addition = addShoppingItem(before, 'item-2', ' Milk ');
  expect(addition).toEqual({
    ok: true,
    items: [
      { id: 'item-1', name: 'Milk' },
      { id: 'item-2', name: 'Milk' },
    ],
  });
  expect(before).toEqual([{ id: 'item-1', name: 'Milk' }]);
  expect(getShoppingItemKey(before[0])).toBe('item-1');
  expect(getShoppingItemKey(addition.items[1])).toBe('item-2');
  expect(getShoppingItemKey(before[0])).not.toBe(getShoppingItemKey(addition.items[1]));
});

test('rejects blank addition without changing the source array', () => {
  const before = [{ id: 'item-1', name: 'Bread' }];
  expect(addShoppingItem(before, 'item-2', '   ')).toEqual({ ok: false, error: 'Enter an item name.' });
  expect(before).toEqual([{ id: 'item-1', name: 'Bread' }]);
});

test('clears every item with a new empty array', () => {
  const cleared = clearShoppingItems();
  expect(cleared).toEqual([]);
  expect(cleared).not.toBe(clearShoppingItems());
});
