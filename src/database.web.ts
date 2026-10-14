import type { ShoppingItem } from './shopping';
import type { ShoppingStore } from './store';

const STORAGE_KEY = 'shopping-list-paper.sqlite-preview.v1';
type SavedList = { nextId: number; items: ShoppingItem[] };

// Browser preview uses localStorage; Android/iOS use database.native.ts (SQLite).
export async function openShoppingStore(): Promise<ShoppingStore> {
  const raw = localStorage.getItem(STORAGE_KEY);
  let saved: SavedList = { nextId: 1, items: [] };
  if (raw !== null) {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || !('items' in value) || !('nextId' in value)) {
      throw new Error('Повреждены данные браузерного списка.');
    }
    const candidate = value as SavedList;
    if (!Array.isArray(candidate.items) || !Number.isSafeInteger(candidate.nextId) || candidate.nextId < 1 ||
      !candidate.items.every((item) => typeof item === 'object' && item !== null &&
        Number.isSafeInteger(item.id) && item.id > 0 && item.id < candidate.nextId &&
        typeof item.product === 'string' && typeof item.amount === 'string') ||
      new Set(candidate.items.map((item) => item.id)).size !== candidate.items.length) {
      throw new Error('Повреждены данные браузерного списка.');
    }
    saved = candidate;
  }

  function commit(next: SavedList) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    saved = next;
  }

  return {
    list: async () => [...saved.items].sort((a, b) => b.id - a.id),
    add: async (input) => {
      commit({ nextId: saved.nextId + 1, items: [...saved.items, { id: saved.nextId, ...input }] });
    },
    remove: async (id) => {
      commit({ ...saved, items: saved.items.filter((item) => item.id !== id) });
    },
    close: async () => {},
  };
}
