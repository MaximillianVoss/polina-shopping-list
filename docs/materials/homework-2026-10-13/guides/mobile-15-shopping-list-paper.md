# №15 — Shopping List с React Native Paper: полный мануал

## Требования и маршрут

Исходное задание: использовать React Native Paper в Shopping List. Требуются поля Product и Amount, кнопка SAVE, список покупок и удаление корзиной. Примеры: Tomatoes / 5 kg, Eggs / 6 pcs, Milk / 2 litres.

За основу взят №11 с SQLite. Сохраняем его базу `shopping.db`, таблицу `shopping`, числовые ID, SQL-запросы и сохранение после перезапуска. Меняем интерфейс на Paper. Firebase из №12 и AsyncStorage в решении не используются.

Уровень: ученик уже видел форму React Native и №11; ниже отдельно разобраны состояния, асинхронная загрузка и запросы. Маршрут: выбрать готовую папку или продолжить свой №11 → установить зависимости → создать/перенести файлы → запустить → проверить добавление, удаление и сохранение → подготовить объяснение для защиты.

Задания без ответов даны отдельным файлом `ASSIGNMENT.md`. Этот мануал содержит теорию, подробное решение и все выполняемые исходники, конфигурацию и тесты целиком, точно как в готовой папке. `package-lock.json` передаётся отдельным файлом: это автоматически созданный npm список зависимостей, его не нужно перепечатывать.

## 1. Запустить готовую отдельную папку на Mac

Готовый самостоятельный проект настроен на Expo SDK 54; его зависимости уже согласованы. Требуется Node.js 24.x, потому что тесты используют `node:sqlite`. Сначала проверьте:

```bash
node --version
npm --version
```

Распакуйте `15-shopping-list-paper` в рабочий каталог. Например, если папка лежит в `HW.Group-2` на рабочем столе:

```bash
cd <папка-этого-репозитория>
npm ci
npm run typecheck
npm test
npm start
```

Путь в `cd` — пример; укажите фактический путь к распакованной папке. `npm ci` устанавливает версии из комплектного lock-файла. Если создаёте проект вручную только по тексту и lock-файла ещё нет, первый раз выполните `npm install`: он создаст lock-файл. Следующие установки можно выполнять через `npm ci`.

После запуска Expo нажмите `i` для iOS Simulator на Mac, `a` для Android Emulator или `w` для браузера. iOS Simulator требует установленного Xcode и симулятора, Android — настроенного эмулятора. Если Expo Go сообщает о несовместимом SDK, нужен клиент/симулятор, совместимый с SDK этого проекта. Фактическая установка Expo Go на устройстве ученицы в этой проверке не подтверждалась.

При запуске из общего `build-and-run.sh` поместите проект внутрь каталога, который просматривает этот скрипт, и выберите строку пути `15-shopping-list-paper`: номера меню динамические. `Ctrl+C` останавливает процесс Metro; файлы проекта и сохранённые покупки остаются.

Для быстрого просмотра интерфейса:

```bash
npm run web
```

На Android/iOS используется настоящий SQLite. Web использует отдельный адаптер `localStorage`; браузер и телефон не обмениваются списками. Первый запуск даёт пустой список: три примера из задания вводятся вручную, автоматически они не добавляются.

## 2. Продолжить существующий №11

В ранее подготовленном комплекте №11 его `package.json` сейчас использует Expo SDK 57. Готовая отдельная папка №15 использует SDK 54. Совместимость базы означает одинаковые файл и SQL-схему; она не требует подменять версии Expo.

Если цель — обновить именно уже работающий №11 и сохранить покупки в его хранилище:

1. Сохраните копию своей рабочей папки №11.
2. В терминале откройте существующий проект №11 и добавьте Paper через его Expo:

```bash
npx expo install react-native-paper react-native-safe-area-context
```

3. Перенесите из №15 `App.tsx` и файлы `src/shopping.ts`, `src/store.ts`, `src/database.ts`, `src/database.native.ts`, `src/database.web.ts`, `src/theme.ts`. Сохраните свою точку входа `index.ts`, если она уже регистрирует `App`.
4. Перенесите актуальные тесты из раздела ниже. Сохраните `package.json`, `package-lock.json` и `app.json` своего №11: установка Paper обновит его зависимости в рамках его SDK. Приведённые ниже конфиги SDK 54 предназначены для самостоятельной папки №15.
5. Запустите `npm run typecheck`, `npm test`, затем `npm start`.
6. Откройте тот же экземпляр приложения/Expo-проекта и проверьте прежние покупки. Имя базы и таблица сохранены, поэтому старые строки читаются с прежними ID.

Для просмотра в браузере существующего №11 также установите `react-dom` и `react-native-web` через `npx expo install`; если в его `app.json` есть ограничивающий массив `platforms`, добавьте туда `web`. В самостоятельном №15 это уже учтено.

Новая папка, иной `slug` или отдельная установка приложения имеют собственное хранилище. Одинаковое имя `shopping.db` само по себе не переносит файл из другого приложения. Сохранение старых записей подтверждено тестом одинаковой схемы; запуск перенесённого экрана в SDK 57 на устройстве отдельно не выполнялся.

## 3. Как работает решение

`PaperProvider` передаёт общую тему компонентам. `Appbar` рисует заголовок, `TextInput` — поля, `Button` — SAVE, `List.Item` — покупку, `IconButton` — корзину, `HelperText` — пояснение или ошибку, `Snackbar` — сообщение об успешном действии.

`useState` хранит ввод, отображаемые строки и состояния экрана. При изменении состояния React заново строит интерфейс. `useEffect` открывает хранилище и загружает строки; его очистка закрывает соединение при размонтировании. Флаг `active` не даёт завершившейся асинхронной загрузке обновить уже закрытый экран.

`useRef` хранит соединение и флаг выполняющейся записи. Такой флаг изменяется сразу, поэтому быстрые повторные нажатия не создают параллельные операции. Состояния `ready` и `busy` управляют доступностью полей и кнопок. После успешной записи приложение повторно читает список из базы; форма очищается после успешной операции.

Список сначала проверяется функцией `shoppingInput`: убираются внешние пробелы, проверяются обязательные поля и пределы 100/40 символов. Количество остаётся текстом, поэтому допустимы `5 kg`, `6 pcs` и `2 litres`.

База хранит строки в таблице `shopping(id, product, amount)`. `INTEGER PRIMARY KEY AUTOINCREMENT` создаёт числовой ID. Продукты могут повторяться: удаление по ID убирает только выбранную строку. `ORDER BY id DESC` выводит новые покупки сверху.

На Android/iOS адаптер открывает файл через `openDatabaseAsync`, создаёт таблицу через `execAsync`, читает через `getAllAsync` и изменяет строки через `runAsync`. Пользовательские значения передаются параметрами `?`, отдельно от текста SQL. Эта форма API и сохранение базы между запусками описаны в [документации Expo SQLite для SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/sqlite/).

Один интерфейс `ShoppingStore` задаёт четыре операции: открыть список, добавить, удалить и закрыть. Metro выбирает `database.native.ts` для телефона и `database.web.ts` для браузера. Поэтому SQL остаётся в нативной версии, а Web можно проверить без настройки WASM и заголовков сервера.

## 4. Структура самостоятельного проекта

```text
15-shopping-list-paper/
├── App.tsx
├── index.ts
├── package.json
├── package-lock.json
├── app.json
├── tsconfig.json
├── .gitignore
├── README.md
├── src/
│   ├── shopping.ts
│   ├── store.ts
│   ├── database.ts
│   ├── database.native.ts
│   ├── database.web.ts
│   └── theme.ts
├── tests/
│   ├── shopping.test.ts
│   └── database-web.test.ts
└── docs/
    ├── ASSIGNMENT.md
    └── MANUAL.md
```

При создании вручную сначала создайте каталоги `src`, `tests` и `docs`, затем сохраните файлы ниже под точными именами. Суффиксы `.native.ts` и `.web.ts` существенны для выбора платформы.

## 5. Полное содержимое исходников, конфигурации и тестов

### `package.json`

Команды запуска и проверки, точка входа index.ts и зависимости самостоятельного проекта SDK 54. Эти версии не нужно переносить поверх package.json существующего №11.

```json
{
  "name": "shopping-list-paper",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit",
    "test": "node --experimental-strip-types --test tests/*.test.ts"
  },
  "dependencies": {
    "expo": "~54.0.37",
    "expo-sqlite": "~16.0.10",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-paper": "5.15.3",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-web": "~0.21.0"
  },
  "devDependencies": {
    "@types/react": "~19.1.10",
    "typescript": "~5.9.2"
  },
  "engines": { "node": ">=24 <25" }
}
```

### `app.json`

Настройки самостоятельного Expo-проекта. При обновлении существующего №11 сохраните его slug и идентификаторы.

```json
{
  "expo": {
    "name": "Shopping List Paper",
    "slug": "shopping-list-paper",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "ios": { "supportsTablet": true },
    "android": { "edgeToEdgeEnabled": true },
    "web": { "bundler": "metro" }
  }
}
```

### `tsconfig.json`

Строгая проверка TypeScript. allowImportingTsExtensions нужен для прямых импортов .ts в тестах Node.

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": { "strict": true, "noEmit": true, "allowImportingTsExtensions": true }
}
```

### `index.ts`

Регистрирует App как корневой компонент. Поле main в package.json указывает на этот файл.

```ts
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

### `src/shopping.ts`

Совместимые с №11 имя базы, схема и запросы. Проверка формы вынесена отдельно от UI и хранилища.

```ts
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
```

### `src/store.ts`

Общий контракт хранилища для нативного приложения и браузера.

```ts
import type { ShoppingInput, ShoppingItem } from './shopping';

export interface ShoppingStore {
  list(): Promise<ShoppingItem[]>;
  add(input: ShoppingInput): Promise<void>;
  remove(id: number): Promise<void>;
  close(): Promise<void>;
}
```

### `src/database.ts`

Файл по умолчанию для TypeScript. Сборщик Metro выбирает реализацию с суффиксом платформы.

```ts
// TypeScript/default fallback. Metro selects .native.ts or .web.ts by platform.
export { openShoppingStore } from './database.native';
```

### `src/database.native.ts`

SQLite-реализация для Android/iOS. CREATE IF NOT EXISTS сохраняет существующую таблицу и её записи.

```ts
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
```

### `src/database.web.ts`

Отдельный браузерный просмотр. Изменения сначала сохраняются, затем обновляется память; при ошибке setItem список в памяти не изменяется.

```ts
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
```

### `src/theme.ts`

Общая тема Paper на основе MD3LightTheme. Цвета применяются через PaperProvider.

```ts
import { MD3LightTheme, type MD3Theme } from "react-native-paper";

export const appTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 18,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#245A43",
    onPrimary: "#FFFFFF",
    primaryContainer: "#DCEFE3",
    onPrimaryContainer: "#123B2A",
    secondary: "#B75D3B",
    onSecondary: "#FFFFFF",
    background: "#F5F4ED",
    surface: "#FFFDF8",
    onSurface: "#202A23",
    surfaceVariant: "#E9EAE1",
    onSurfaceVariant: "#535E55",
    outline: "#778078",
    outlineVariant: "#D8DDD4",
    error: "#B3261E",
  },
};
```

### `App.tsx`

Форма, список, состояния загрузки и ошибок. Логика списка остаётся в хранилище, компоненты Paper создают интерфейс.

```tsx
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Appbar, Button, Divider, HelperText, IconButton, List, PaperProvider, Snackbar, TextInput } from 'react-native-paper';
import { openShoppingStore } from './src/database';
import { MAX_AMOUNT_LENGTH, MAX_PRODUCT_LENGTH, shoppingInput, type ShoppingItem } from './src/shopping';
import type { ShoppingStore } from './src/store';
import { appTheme } from './src/theme';

export default function App() {
  const store = useRef<ShoppingStore | null>(null);
  const mutation = useRef(false);
  const [product, setProduct] = useState('');
  const [amount, setAmount] = useState('');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let opened: ShoppingStore | null = null;
    async function initialize() {
      setReady(false);
      setError('');
      try {
        opened = await openShoppingStore();
        const saved = await opened.list();
        if (!active) {
          await opened.close();
          opened = null;
          return;
        }
        store.current = opened;
        setItems(saved);
        setReady(true);
      } catch (cause) {
        if (opened) await opened.close().catch(() => {});
        opened = null;
        if (active) setError(cause instanceof Error ? cause.message : 'Не удалось открыть список.');
      }
    }
    void initialize();
    return () => {
      active = false;
      store.current = null;
      if (opened) void opened.close().catch(() => {});
    };
  }, [attempt]);

  async function change(action: (database: ShoppingStore) => Promise<void>, success: string): Promise<boolean> {
    const database = store.current;
    if (!database || !ready || mutation.current) return false;
    mutation.current = true;
    setBusy(true);
    setError('');
    try {
      await action(database);
      setItems(await database.list());
      setMessage(success);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Операция со списком не выполнена.');
      return false;
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }

  async function save() {
    try {
      const input = shoppingInput(product, amount);
      const saved = await change((database) => database.add(input), 'Позиция добавлена.');
      if (saved) {
        setProduct('');
        setAmount('');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Проверьте введённые данные.');
    }
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
          <Appbar.Header mode="center-aligned">
            <Appbar.Content title="SHOPPING LIST" />
          </Appbar.Header>
          <View style={styles.form}>
            <TextInput label="PRODUCT" accessibilityLabel="Product" value={product} onChangeText={setProduct}
              mode="flat" placeholder="Product" returnKeyType="next" maxLength={MAX_PRODUCT_LENGTH} disabled={!ready || busy} />
            <TextInput label="AMOUNT" accessibilityLabel="Amount" value={amount} onChangeText={setAmount}
              mode="flat" placeholder="Amount" maxLength={MAX_AMOUNT_LENGTH} disabled={!ready || busy}
              onSubmitEditing={() => { void save(); }} />
            <Button mode="contained" icon="content-save" disabled={!ready || busy} loading={busy}
              onPress={() => { void save(); }} style={styles.save}>SAVE</Button>
            <HelperText type="info">Например: Tomatoes — 5 kg. Новые позиции сверху.</HelperText>
            {!ready && !error && <ActivityIndicator accessibilityLabel="Открытие базы данных" />}
            {error !== '' && <HelperText type="error" accessibilityRole="alert">{error}</HelperText>}
            {!ready && error !== '' && <Button onPress={() => setAttempt((value) => value + 1)}>Повторить загрузку</Button>}
          </View>
          <FlatList data={items} keyExtractor={(item) => String(item.id)} ItemSeparatorComponent={Divider}
            ListEmptyComponent={ready ? <List.Item title="Список пуст" description="Добавьте первый продукт выше." /> : null}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <List.Item style={styles.item} title={item.product} description={item.amount} />
                <IconButton icon="delete" iconColor={appTheme.colors.error}
                  disabled={!ready || busy} accessibilityLabel={`Удалить ${item.product}`}
                  onPress={() => { void change((database) => database.remove(item.id), 'Позиция удалена.'); }} />
              </View>
            )} />
          <Snackbar visible={Boolean(message)} onDismiss={() => setMessage('')} duration={2200}>{message}</Snackbar>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appTheme.colors.surface },
  form: { padding: 16, gap: 8 },
  save: { marginTop: 8, borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { flex: 1 },
});
```

### `tests/shopping.test.ts`

14 тестов ввода и настоящего SQLite. В том числе повторное создание таблицы, сохранение файла, совместимость с №11, удаление по ID и параметризованный ввод.

```ts
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
```

### `tests/database-web.test.ts`

8 тестов настоящего Web-адаптера с подставленным localStorage: сохранение, повреждённые данные и ошибки записи.

```ts
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
```

### `.gitignore`

Исключает установленные пакеты, служебные файлы и результаты сборки из обычного Git-добавления.

```text
node_modules/
.expo/
.verification/
dist/
dist-android/
dist-ios/
```

## 6. Проверка от начала до конца

В папке проекта выполните:

```bash
npm run typecheck
npm test
npx expo export --platform android --platform web --output-dir dist
```

Тесты выполняют реальные SQL-запросы через `DatabaseSync` из [официального модуля Node.js SQLite](https://nodejs.org/api/sqlite.html). Это проверка SQL и сохранения данных, а не симуляция экрана телефона.

Затем выполните сценарии в приложении:

1. После загрузки пустого списка нажмите SAVE с пустыми полями. Должна появиться ошибка; список не меняется.
2. Введите Tomatoes / 5 kg и нажмите SAVE. Позиция появляется, поля очищаются.
3. Добавьте Eggs / 6 pcs, затем Milk / 2 litres. Сверху будут Milk, затем Eggs и Tomatoes.
4. Нажмите корзину у Eggs. Остаются Milk и Tomatoes.
5. Перезапустите тот же проект/приложение. Оставшиеся позиции должны загрузиться из хранилища.
6. Добавьте две строки Apples с разным количеством. Удалите одну: другая должна остаться.
7. Проверьте название с кавычкой, например Farmer's eggs: значение сохраняется как текст.
8. Проверьте быстрое повторное нажатие SAVE во время операции: повторное действие блокируется.
9. В браузере перезагрузите ту же страницу с тем же адресом. Список браузера сохраняется отдельно от телефона.

При браузерном просмотре другой порт/адрес означает другой origin и отдельное `localStorage`. Это не потеря SQLite на телефоне.

Фактически проверено при подготовке на Windows: Node.js 24.21.0; `npm install` и согласованный lock-файл; `npm run typecheck`; 22/22 теста; Metro-экспорты Android и Web. Полные блоки кода в мануале сверены с файлами проекта. Запуск на Mac, iPhone и физическом Android-устройстве отдельно не выполнялся.

## 7. Разбор для защиты

На вопрос «какой вариант Shopping List продолжили?» ответ: №11 с SQLite. Имя файла, таблица, запросы и числовые ID сохранены; №15 добавляет интерфейс React Native Paper.

На вопрос «почему нужна база, если есть useState?» объясните: `useState` хранит данные только в памяти запущенного экрана; SQLite записывает их в файл. При следующем запуске строки читаются из файла и попадают в состояние экрана.

На вопрос «почему не удаляем по названию?» объясните: названия могут совпадать. ID выбирает ровно одну запись.

На вопрос «почему используем знак ?» объясните: SQL-запрос и введённый текст передаются отдельно; кавычки в названии не меняют смысл запроса.

На вопрос «что делает useEffect?» объясните: открывает хранилище и загружает данные при появлении экрана; очистка закрывает его. Изменение `attempt` запускает повторную загрузку после ошибки.

На вопрос «что изменил Paper?» покажите `PaperProvider`, тему и компоненты формы/списка. Работа с базой находится в адаптере и не зависит от оформления кнопок.

## 8. Что передать

Передайте папку проекта с исходниками, тестами, README, документами и `package-lock.json`. Не включайте `node_modules`, `.expo`, `.verification` и результаты экспорта. На другой машине зависимости устанавливаются через `npm ci`.

В комплекте отдельно находятся условие без решений и этот полный мануал. Для демонстрации подготовьте сценарий с тремя покупками из задания и сохранением после перезапуска.
