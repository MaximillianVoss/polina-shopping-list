import type { ShoppingInput, ShoppingItem } from './shopping';

export interface ShoppingStore {
  list(): Promise<ShoppingItem[]>;
  add(input: ShoppingInput): Promise<void>;
  remove(id: number): Promise<void>;
  close(): Promise<void>;
}
