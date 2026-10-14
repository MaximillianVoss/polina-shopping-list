import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SQL, shoppingInput } from '../src/shopping.ts';

test('trims text while preserving text amount', () => {
  assert.deepEqual(shoppingInput(' Milk ', ' 3 litres '), { product: 'Milk', amount: '3 litres' });
});
test('rejects empty and too-long values', () => {
  assert.throws(() => shoppingInput(' ', '3'));
  assert.throws(() => shoppingInput('Milk', ''));
  assert.throws(() => shoppingInput('x'.repeat(101), '1'));
});
test('real SQLite: integer identity, persistence, parameter binding, bought deletes', () => {
  const folder = mkdtempSync(join(tmpdir(), 'homework-sqlite-'));
  const path = join(folder, 'shopping.db');
  let db = new DatabaseSync(path);
  try {
    db.exec(SQL.create);
    db.prepare(SQL.add).run("O'Brien milk", '3 litres');
    db.prepare(SQL.add).run("x'); DROP TABLE shopping; --", '1');
    let rows = db.prepare(SQL.list).all();
    assert.equal(rows.length, 2);
    assert.equal(typeof rows[0]?.id, 'number');
    db.close();
    db = new DatabaseSync(path);
    rows = db.prepare(SQL.list).all();
    assert.equal(rows.length, 2, 'data survives closing and reopening the database');
    db.prepare(SQL.remove).run(rows[0]!.id);
    assert.equal(db.prepare(SQL.list).all().length, 1);
    assert.equal(db.prepare(SQL.list).all()[0]?.product, "O'Brien milk");
  } finally {
    db.close();
    rmSync(folder, { recursive: true });
  }
});
