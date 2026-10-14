import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, SQL } from './shopping';
import type { ShoppingItem } from './shopping';
import type { ShoppingStore } from './store';

export async function openShoppingStore(): Promise<ShoppingStore> {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  try {
    await database.execAsync(SQL.create);
  } catch (cause) {
    await database.closeAsync().catch(() => {});
    throw cause;
  }

  return {
    list: () => database.getAllAsync<ShoppingItem>(SQL.list),
    add: async (input) => {
      await database.runAsync(SQL.add, input.product, input.amount);
    },
    remove: async (id) => {
      await database.runAsync(SQL.remove, id);
    },
    close: () => database.closeAsync(),
  };
}
