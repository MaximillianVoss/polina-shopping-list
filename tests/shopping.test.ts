import assert from "node:assert/strict";
import { mkdtempSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test, { type TestContext } from "node:test";
import {
  DATABASE_NAME,
  MAX_AMOUNT_LENGTH,
  MAX_PRODUCT_LENGTH,
  shoppingInput,
  SQL,
  type ShoppingItem,
} from "../src/shopping.ts";

function memoryDatabase(t: TestContext): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  t.after(() => database.close());
  database.exec(SQL.create);
  return database;
}

function rows(database: DatabaseSync): ShoppingItem[] {
  // node:sqlite returns objects without a prototype; copy before comparing.
  return database.prepare(SQL.list).all().map((row) => ({ ...row })) as ShoppingItem[];
}

function add(database: DatabaseSync, product: string, amount: string): number {
  return Number(database.prepare(SQL.add).run(product, amount).lastInsertRowid);
}

test("create is repeatable, creates the old shopping schema and starts empty", (t) => {
  const database = memoryDatabase(t);
  database.exec(SQL.create);
  const columns = database.prepare("PRAGMA table_info(shopping);").all();
  assert.deepEqual(columns.map(({ name, type, notnull, pk }) => ({ name, type, notnull, pk })), [
    { name: "id", type: "INTEGER", notnull: 0, pk: 1 },
    { name: "product", type: "TEXT", notnull: 1, pk: 0 },
    { name: "amount", type: "TEXT", notnull: 1, pk: 0 },
  ]);
  assert.deepEqual(rows(database), []);
  assert.equal(DATABASE_NAME, "shopping.db");
});

test("add stores both fields with generated numeric ids", (t) => {
  const database = memoryDatabase(t);
  const id = add(database, "Молоко", "2 litres");
  assert.equal(typeof id, "number");
  assert.equal(id > 0, true);
  assert.deepEqual(rows(database), [{ id, product: "Молоко", amount: "2 litres" }]);
});

test("list returns all rows with the newest id first", (t) => {
  const database = memoryDatabase(t);
  const tomatoes = add(database, "Tomatoes", "5 kg");
  const eggs = add(database, "Eggs", "6 pcs");
  const milk = add(database, "Milk", "2 litres");
  assert.deepEqual(rows(database), [
    { id: milk, product: "Milk", amount: "2 litres" },
    { id: eggs, product: "Eggs", amount: "6 pcs" },
    { id: tomatoes, product: "Tomatoes", amount: "5 kg" },
  ]);
});

test("remove deletes exactly the selected id", (t) => {
  const database = memoryDatabase(t);
  const tomatoes = add(database, "Tomatoes", "5 kg");
  const eggs = add(database, "Eggs", "6 pcs");
  const milk = add(database, "Milk", "2 litres");
  assert.equal(Number(database.prepare(SQL.remove).run(eggs).changes), 1);
  assert.deepEqual(rows(database), [
    { id: milk, product: "Milk", amount: "2 litres" },
    { id: tomatoes, product: "Tomatoes", amount: "5 kg" },
  ]);
});

test("removing an absent id keeps existing rows", (t) => {
  const database = memoryDatabase(t);
  const id = add(database, "Eggs", "6 pcs");
  assert.equal(Number(database.prepare(SQL.remove).run(id + 100).changes), 0);
  assert.deepEqual(rows(database), [{ id, product: "Eggs", amount: "6 pcs" }]);
});

test("added and deleted rows persist after closing and reopening shopping.db", () => {
  const directory = mkdtempSync(join(tmpdir(), "shopping-sqlite-test-"));
  const databasePath = join(directory, DATABASE_NAME);
  let database: DatabaseSync | undefined;
  try {
    database = new DatabaseSync(databasePath);
    database.exec(SQL.create);
    const kept = add(database, "Milk", "2 litres");
    const removed = add(database, "Eggs", "6 pcs");
    database.prepare(SQL.remove).run(removed);
    database.close();
    database = undefined;
    database = new DatabaseSync(databasePath);
    database.exec(SQL.create);
    assert.deepEqual(rows(database), [{ id: kept, product: "Milk", amount: "2 litres" }]);
    assert.equal(add(database, "Bread", "1 loaf") > removed, true);
  } finally {
    database?.close();
    // Remove only the exact file and empty temporary directory created above.
    unlinkSync(databasePath);
    rmdirSync(directory);
  }
});

test("opening an existing task 11 database preserves its schema, ids and rows", (t) => {
  const database = new DatabaseSync(":memory:");
  t.after(() => database.close());
  // Independent fixture: the table and rows exist before task 15 initializes it.
  database.exec(`
    CREATE TABLE shopping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product TEXT NOT NULL,
      amount TEXT NOT NULL
    );
    INSERT INTO shopping (id, product, amount)
      VALUES (41, 'Tomatoes', '5 kg'), (72, 'Milk', '2 litres');
  `);
  database.exec(SQL.create);
  assert.deepEqual(rows(database), [
    { id: 72, product: "Milk", amount: "2 litres" },
    { id: 41, product: "Tomatoes", amount: "5 kg" },
  ]);
  const newId = add(database, "Eggs", "6 pcs");
  assert.equal(newId, 73);
  database.prepare(SQL.remove).run(41);
  assert.deepEqual(rows(database).map(({ id }) => id), [73, 72]);
});

test("quotes and SQL-like input are stored literally through bound parameters", (t) => {
  const database = memoryDatabase(t);
  const first = add(database, "Milk", "2 litres");
  const product = "O'Brien'); DROP TABLE shopping; --";
  const amount = "2\"; DELETE FROM shopping; --";
  const literal = add(database, product, amount);
  assert.deepEqual(rows(database), [
    { id: literal, product, amount },
    { id: first, product: "Milk", amount: "2 litres" },
  ]);
  const later = add(database, "Bread", "1 loaf");
  assert.equal(rows(database).length, 3);
  assert.equal(Number(database.prepare(SQL.remove).run(literal).changes), 1);
  assert.deepEqual(rows(database).map(({ id }) => id), [later, first]);
});

test("duplicate product names have independent ids and can be deleted separately", (t) => {
  const database = memoryDatabase(t);
  const first = add(database, "Milk", "1 litre");
  const second = add(database, "Milk", "2 litres");
  assert.notEqual(first, second);
  assert.equal(rows(database).length, 2);
  database.prepare(SQL.remove).run(first);
  assert.deepEqual(rows(database), [{ id: second, product: "Milk", amount: "2 litres" }]);
});

test("the database rejects NULL fields and does not create partial rows", (t) => {
  const database = memoryDatabase(t);
  assert.throws(() => database.prepare(SQL.add).run(null, "1 pc"), /NOT NULL/);
  assert.throws(() => database.prepare(SQL.add).run("Milk", null), /NOT NULL/);
  assert.deepEqual(rows(database), []);
});

test("shoppingInput trims surrounding whitespace and preserves units and inner spaces", () => {
  assert.deepEqual(shoppingInput(" \tOat milk\n ", "  2 litres\t "), {
    product: "Oat milk",
    amount: "2 litres",
  });
});

test("shoppingInput rejects empty and whitespace-only fields", () => {
  for (const product of ["", " ", "\t\n"]) {
    assert.throws(() => shoppingInput(product, "1 pc"));
  }
  for (const amount of ["", " ", "\t\n"]) {
    assert.throws(() => shoppingInput("Milk", amount));
  }
  assert.throws(() => shoppingInput("", ""));
});

test("shoppingInput accepts the 100/40 character boundaries after trimming", () => {
  assert.equal(MAX_PRODUCT_LENGTH, 100);
  assert.equal(MAX_AMOUNT_LENGTH, 40);
  const product = "P".repeat(MAX_PRODUCT_LENGTH);
  const amount = "1".repeat(MAX_AMOUNT_LENGTH);
  assert.deepEqual(shoppingInput(` ${product}\t`, `\n${amount} `), { product, amount });
});

test("shoppingInput rejects product or amount just above its boundary", () => {
  assert.throws(() => shoppingInput("P".repeat(MAX_PRODUCT_LENGTH + 1), "1 pc"));
  assert.throws(() => shoppingInput("Pear", "1".repeat(MAX_AMOUNT_LENGTH + 1)));
});
