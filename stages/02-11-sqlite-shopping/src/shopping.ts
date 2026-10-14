export type ShoppingItem = { id: number; product: string; amount: string };
export type ShoppingInput = Omit<ShoppingItem, 'id'>;

export const SQL = {
  create: 'CREATE TABLE IF NOT EXISTS shopping (id INTEGER PRIMARY KEY AUTOINCREMENT, product TEXT NOT NULL, amount TEXT NOT NULL);',
  list: 'SELECT id, product, amount FROM shopping ORDER BY id DESC;',
  add: 'INSERT INTO shopping (product, amount) VALUES (?, ?);',
  remove: 'DELETE FROM shopping WHERE id = ?;',
};

export function shoppingInput(product: string, amount: string): ShoppingInput {
  const cleanProduct = product.trim();
  const cleanAmount = amount.trim();
  if (!cleanProduct || !cleanAmount) throw new Error('Enter both product and amount.');
  if (cleanProduct.length > 100 || cleanAmount.length > 40) throw new Error('Product: max 100 characters. Amount: max 40.');
  return { product: cleanProduct, amount: cleanAmount };
}
