import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { openShoppingStore } from "../src/database.web.ts";

function installStorage(t: TestContext) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string): string | null => data.get(key) ?? null,
    setItem: (key: string, value: string): void => { data.set(key, value); },
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  return { data, storage };
}

test("web storage starts with an empty list when nothing has been saved", async (t) => {
  const { data } = installStorage(t);
  const store = await openShoppingStore();
  assert.deepEqual(await store.list(), []);
  assert.equal(data.size, 0);
  await store.close();
});

test("web add/remove survive close and reopen with numeric ids and newest-first order", async (t) => {
  installStorage(t);
  let store = await openShoppingStore();
  await store.add({ product: "Milk", amount: "1 litre" });
  await store.add({ product: "Milk", amount: "2 litres" });
  await store.add({ product: "Bread", amount: "1 loaf" });
  assert.deepEqual(await store.list(), [
    { id: 3, product: "Bread", amount: "1 loaf" },
    { id: 2, product: "Milk", amount: "2 litres" },
    { id: 1, product: "Milk", amount: "1 litre" },
  ]);
  await store.close();

  store = await openShoppingStore();
  await store.remove(2);
  await store.close();
  store = await openShoppingStore();
  assert.deepEqual(await store.list(), [
    { id: 3, product: "Bread", amount: "1 loaf" },
    { id: 1, product: "Milk", amount: "1 litre" },
  ]);
  await store.remove(3);
  await store.add({ product: "Eggs", amount: "6 pcs" });
  assert.deepEqual(await store.list(), [
    { id: 4, product: "Eggs", amount: "6 pcs" },
    { id: 1, product: "Milk", amount: "1 litre" },
  ]);
  await store.close();
  assert.deepEqual(await (await openShoppingStore()).list(), [
    { id: 4, product: "Eggs", amount: "6 pcs" },
    { id: 1, product: "Milk", amount: "1 litre" },
  ]);
});

test("web removing an absent id leaves the list and next id intact", async (t) => {
  installStorage(t);
  const store = await openShoppingStore();
  await store.add({ product: "Milk", amount: "1 litre" });
  await store.remove(999);
  assert.deepEqual(await store.list(), [{ id: 1, product: "Milk", amount: "1 litre" }]);
  await store.add({ product: "Bread", amount: "1 loaf" });
  assert.deepEqual((await store.list()).map(({ id }) => id), [2, 1]);
});

test("web rejects malformed saved JSON", async (t) => {
  const { storage } = installStorage(t);
  storage.getItem = () => '{"nextId":';
  await assert.rejects(openShoppingStore(), SyntaxError);
});

test("web rejects invalid saved shapes, ids, fields and duplicate ids", async (t) => {
  const { storage } = installStorage(t);
  const validItem = { id: 1, product: "Milk", amount: "1 litre" };
  const invalid: unknown[] = [
    null,
    [],
    "list",
    {},
    { items: [] },
    { nextId: 1 },
    { nextId: 1, items: {} },
    { nextId: 0, items: [] },
    { nextId: 1.5, items: [] },
    { nextId: Number.MAX_SAFE_INTEGER + 1, items: [] },
    { nextId: "2", items: [validItem] },
    { nextId: 2, items: [null] },
    { nextId: 2, items: ["Milk"] },
    { nextId: 2, items: [{ ...validItem, id: 0 }] },
    { nextId: 2, items: [{ ...validItem, id: -1 }] },
    { nextId: 2, items: [{ ...validItem, id: 1.5 }] },
    { nextId: 2, items: [{ ...validItem, id: 2 }] },
    { nextId: 2, items: [{ ...validItem, product: null }] },
    { nextId: 2, items: [{ ...validItem, amount: 2 }] },
    { nextId: 2, items: [{ id: 1, product: "Milk" }] },
    { nextId: 2, items: [validItem, { ...validItem, amount: "2 litres" }] },
  ];
  for (const value of invalid) {
    storage.getItem = () => JSON.stringify(value);
    await assert.rejects(openShoppingStore(), /Повреждены данные браузерного списка\./);
  }
});

test("failed web add leaves the in-memory list, persisted data and next id unchanged", async (t) => {
  const { data, storage } = installStorage(t);
  const store = await openShoppingStore();
  await store.add({ product: "Milk", amount: "1 litre" });
  const persisted = [...data];
  const setItem = storage.setItem;
  const failure = new Error("localStorage quota exceeded");
  storage.setItem = () => { throw failure; };

  await assert.rejects(store.add({ product: "Bread", amount: "1 loaf" }), (error) => error === failure);
  assert.deepEqual(await store.list(), [{ id: 1, product: "Milk", amount: "1 litre" }]);
  assert.deepEqual([...data], persisted);
  assert.deepEqual(await (await openShoppingStore()).list(), await store.list());
  storage.setItem = setItem;
  await store.add({ product: "Eggs", amount: "6 pcs" });
  assert.deepEqual((await store.list()).map(({ id }) => id), [2, 1]);
});

test("failed web remove keeps the selected row in memory and saved storage", async (t) => {
  const { data, storage } = installStorage(t);
  const store = await openShoppingStore();
  await store.add({ product: "Milk", amount: "1 litre" });
  await store.add({ product: "Bread", amount: "1 loaf" });
  const before = await store.list();
  const persisted = [...data];
  const setItem = storage.setItem;
  const failure = new Error("localStorage unavailable");
  storage.setItem = () => { throw failure; };

  await assert.rejects(store.remove(1), (error) => error === failure);
  assert.deepEqual(await store.list(), before);
  assert.deepEqual([...data], persisted);
  assert.deepEqual(await (await openShoppingStore()).list(), before);
  storage.setItem = setItem;
  await store.remove(1);
  assert.deepEqual(await store.list(), [{ id: 2, product: "Bread", amount: "1 loaf" }]);
});

test("web propagates localStorage read failures to the caller", async (t) => {
  const { storage } = installStorage(t);
  const failure = new Error("localStorage access denied");
  storage.getItem = () => { throw failure; };
  await assert.rejects(openShoppingStore(), (error) => error === failure);
});
