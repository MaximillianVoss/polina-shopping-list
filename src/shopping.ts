export type ShoppingItem = { id: number; product: string; amount: string };
export type ShoppingInput = Omit<ShoppingItem, 'id'>;

// The filename and schema are the same as in assignment 11.
export const DATABASE_NAME = 'shopping.db';
export const MAX_PRODUCT_LENGTH = 100;
export const MAX_AMOUNT_LENGTH = 40;

export const SQL = {
  create: 'CREATE TABLE IF NOT EXISTS shopping (id INTEGER PRIMARY KEY AUTOINCREMENT, product TEXT NOT NULL, amount TEXT NOT NULL);',
  list: 'SELECT id, product, amount FROM shopping ORDER BY id DESC;',
  add: 'INSERT INTO shopping (product, amount) VALUES (?, ?);',
  remove: 'DELETE FROM shopping WHERE id = ?;',
};

export function shoppingInput(product: string, amount: string): ShoppingInput {
  const cleanProduct = product.trim();
  const cleanAmount = amount.trim();
  if (!cleanProduct || !cleanAmount) throw new Error('Введите продукт и количество.');
  if (cleanProduct.length > MAX_PRODUCT_LENGTH || cleanAmount.length > MAX_AMOUNT_LENGTH) {
    throw new Error('Продукт: не более 100 символов. Количество: не более 40.');
  }
  return { product: cleanProduct, amount: cleanAmount };
}
