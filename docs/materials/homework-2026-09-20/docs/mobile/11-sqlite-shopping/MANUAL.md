# 11 · Shopping list with SQLite: от начала до сдачи

[Исходное задание целиком](assignment-original.md) · [Папка готового проекта](../../../../../../stages/02-11-sqlite-shopping)

## 1. Требования и результат

Список покупок из Assignment 4; SQLite: id уникальный integer, product text, amount text; bought удаляет строку.

Добавленная покупка остаётся после полного закрытия и повторного открытия приложения. Нажатие bought удаляет покупку из базы; после перезапуска она не возвращается.

Маршрут: сверить условие → открыть/создать Expo TypeScript → восстановить файлы → установить зависимости → проверить типы и логику → запустить на устройстве → пройти ручные сценарии → подготовить сдачу.

## 2. Минимум теории

useState хранит данные только в памяти процесса. SQLite — локальная файловая реляционная база: таблица состоит из строк и столбцов. id INTEGER PRIMARY KEY AUTOINCREMENT выдаёт целочисленный идентификатор каждой новой строке. product и amount текстовые, потому что количество может быть «3 litres», а не просто 3. React показывает копию содержимого базы; после SQL-операции копия обновляется запросом SELECT.

Текст SQL без пользовательских данных хранится в SQL. Для INSERT и DELETE используются placeholders ? и отдельные аргументы runAsync — пользовательский текст не склеивается с SQL. CREATE TABLE IF NOT EXISTS создаёт таблицу только если её нет, не стирая прежние покупки. Используется актуальный асинхронный API [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/), а не старый пример transaction/executeSql из ранних SDK.

## 3. Среда и первый запуск на Mac

Используется согласованная связка Expo SDK 57, React 19.2.3, React Native 0.86.3, TypeScript 6.0.3; точные разрешённые версии зависимостей зафиксированы общим package-lock.json в projects/mobile. Node 24 выбран для одинакового запуска тестов, включая node:sqlite. Случайно обновлять один react-native отдельно от Expo не нужно.

Проверьте:

```bash
node --version
npm --version
# Если NVM уже установлен:
nvm install 24
nvm use 24
```

Нужен Expo Go, совместимый с SDK 57, на телефоне либо iOS Simulator (Xcode, только macOS) / Android Emulator (Android Studio). Компьютер и телефон должны видеть друг друга по сети. Готовые примеры намеренно настроены только на ios/android: браузер не является проверкой карты, GPS, SQLite и RN-персистентности Auth.

### Вариант A — весь комплект

Откройте терминал в корне нового комплекта. У всех четырёх проектов один workspace-lock, поэтому npm ci выполняется в projects/mobile:

```bash
cd projects/mobile
npm ci
cd 11-sqlite-shopping
npm run typecheck
npm test
npm start
```

Отсканируйте QR в Expo Go. Для уже настроенного симулятора можно вместо последней команды выполнить npm run ios или npm run android. Не запускайте npm start одновременно в нескольких терминалах для одного проекта.

### Вариант B — только одна папка проекта

Скопируйте целиком projects/mobile/11-sqlite-shopping в отдельный учебный каталог, откройте терминал внутри неё и выполните:

```bash
npm install
npm run typecheck
npm test
npm start
```

При отдельном копировании общего lock-файла нет: сначала npm install создаёт собственный package-lock.json. Команда npm ci допустима только после этого. Если уже работали в Classroom-репозитории, сначала сохраните свой исходный вариант; не заменяйте его файлы вслепую.

### Вариант C — восстановить с нуля вручную

[create-expo-app](https://docs.expo.dev/more/create-expo/) поддерживает blank-typescript и --no-install. Создавайте в новой пустой папке, не внутри существующего проекта:

```bash
npx create-expo-app@latest 11-sqlite-shopping --template blank-typescript --no-install
cd 11-sqlite-shopping
```

Затем замените package.json, app.json, tsconfig.json, index.ts и App.tsx полными версиями ниже, добавьте src/ и tests/, после чего npm install. Версии готового package.json возвращают пример к проверенной связке SDK57 даже если текущий шаблон уже обновился. Не переносите node_modules с Windows на Mac.

## 4. Реализация по этапам

### Этап 1. Каркас

Восстановите TypeScript Expo-проект и установите зависимости package.json. SQLite уже указана; отдельный сервер базы данных и MySQL не нужны.

### Этап 2. Схема

Создайте src/shopping.ts. Проверьте SQL.create: таблица shopping имеет ровно необходимые id/product/amount. Поле amount оставлено TEXT согласно заданию.

### Этап 3. Открытие

При старте useEffect вызывает openDatabaseAsync('shopping.db'), затем CREATE TABLE, затем getAllAsync. До окончания инициализации форма блокируется.

### Этап 4. Добавление

shoppingInput обрезает пробелы и проверяет оба поля. save вызывает change, внутри runAsync(SQL.add, product, amount). После успешной записи очищаются поля; затем SELECT обновляет список.

### Этап 5. Удаление

bought получает item.id. runAsync(SQL.remove, id) удаляет ровно эту строку. Нельзя использовать номер строки списка как ID: после удаления порядок и индексы меняются.

### Этап 6. Перезапуск

Закройте приложение полностью, снова откройте в том же проекте/устройстве. Данные читаются из того же файла shopping.db. Удаление самого приложения может удалить локальную базу — это нормальное свойство такого хранения.

### Этап 7. Защита примера

Проверка ошибки базы, блокировка повторных мутаций и bind-параметры делают учебный пример устойчивым. Купленное здесь действительно удаляется; отдельной колонки bought нет, потому что её не требует условие.

## 5. Что использовано и почему

| Функция / приём | Что делает | Почему здесь |
|---|---|---|
| openDatabaseAsync | Открывает/создаёт shopping.db на устройстве. | База сохраняется между запусками. |
| execAsync(SQL.create) | Выполняет неизменяемую команду создания таблицы. | Пользовательский текст сюда не передаётся. |
| runAsync | INSERT/DELETE с отдельными значениями аргументов. | Апострофы и SQL-похожие строки остаются данными. |
| getAllAsync<ShoppingItem> | Читает строки для FlatList. | После записи UI синхронизируется с БД. |
| shoppingInput | Убирает крайние пробелы и проверяет длины. | Пустые покупки не сохраняются. |
| change | Общий цикл блокировка → запись → SELECT → снятие busy. | Логика сохранения и удаления не дублируется. |
| useRef database/mutation | Хранит объект БД и синхронный флаг мутации. | Не открываем новую БД на каждый рендер. |
| bought(id) | Удаляет по стабильному ключу. | Не затрагивает другую покупку с тем же названием. |

Общие элементы: useState изменяет отображаемые данные; типы TypeScript обнаруживают несоответствия до запуска; SafeAreaView защищает содержимое от выреза экрана; StyleSheet.create описывает нативные стили; disabled не даёт отправить повторную операцию во время обработки. Promise возвращает будущий результат, поэтому нажатия вызывают void handler(), а ошибки обрабатываются внутри async-функции.

## 6. Проверка и ручные сценарии

```bash
npm run typecheck
npm test
npm run bundle:android
npm run bundle:ios
```

Экспорт создаёт JavaScript/Hermes bundle, **не APK/IPA и не готовую установку**. Он подтверждает совместимость импортов и сборки, но не работу физических датчиков/сервиса на телефоне.

3 теста, включая реальный движок node:sqlite: создать таблицу, записать параметризованные значения, закрыть и открыть файл, проверить сохранение и удаление. Это проверка SQL-логики, не запуск нативного expo-sqlite на телефоне.

| Сценарий | Ожидаемый результат |
|---|---|
| Сохранить Milk / 3 litres | Новая строка с текстовым amount. |
| Две одинаковые покупки | Это две отдельные строки с разными id. |
| bought у одной из одинаковых строк | Удаляется только выбранная. |
| Полное закрытие/открытие | Оставшиеся покупки восстановлены; удалённая не вернулась. |
| O'Brien milk и строка с кавычками | Текст сохранён корректно, таблица не повреждена. |
| Пустой продукт / amount | Валидация, новая строка не создаётся. |
| Режим полёта | Локальное добавление/удаление работает без интернета. |

## 7. Частые ошибки

Не устанавливайте MySQL для этого задания: SQLite встроена через Expo-модуль. Fast Refresh — не полноценная проверка сохранения: полностью закройте и откройте приложение. Браузерный SQLite требует отдельной web-конфигурации/изоляции; в этом пакете web не включён. Если база недоступна, исправьте причину и используйте Retry database; скрипты не удаляют shopping.db автоматически.

Если «react/jsx-runtime not found»: убедитесь, что терминал открыт в нужном проекте, выполните установку зависимостей, выберите workspace TypeScript в редакторе и перезапустите TS Server. Если JSX содержит незакрытый тег — установка зависимостей это не исправит; сравните файл с полным листингом. Если Metro показывает старый вариант, остановите его Ctrl+C и выполните npm start -- --clear. Обычный Expo при Ctrl+C останавливает сервер, а не удаляет проект; старые скрипты создания здесь не используются.

## 8. Что показать при сдаче

1. Прочитать своё исходное условие и перечислить обязательные пункты.
2. Показать реальные исходники и объяснить поток данных по таблице выше.
3. Выполнить typecheck и тесты; не называть их телефонной проверкой.
4. Продемонстрировать основной сценарий и хотя бы одну обработанную ошибку на устройстве.
5. В репозиторий/архив включить исходники, конфигурацию и свой lock-файл, но не node_modules, .expo, dist и .env. Действия публикации/отправки выполняет сам ученик по правилам курса.

## 9. Полные авторские файлы

Далее приведено полное содержимое, без многоточий. package-lock.json не перепечатан: это автоматически сгенерированный файл фиксации зависимостей. Весь необходимый авторский код, конфигурация и тесты перечислены.

### package.json

```json
{
  "name": "homework-11-sqlite-shopping",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "typecheck": "tsc --noEmit",
    "test": "node --experimental-strip-types --test tests/*.test.ts",
    "bundle:android": "expo export --platform android --output-dir dist-android",
    "bundle:ios": "expo export --platform ios --output-dir dist-ios"
  },
  "dependencies": {
    "expo": "~57.0.24",
    "react": "19.2.3",
    "react-native": "0.86.3",
    "react-native-safe-area-context": "~5.7.0",
    "expo-sqlite": "~57.0.3"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "typescript": "~6.0.3"
  },
  "engines": {
    "node": ">=24 <25"
  }
}
```

### app.json

```json
{
  "expo": {
    "name": "Shopping SQLite",
    "slug": "homework-11-sqlite-shopping",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "platforms": [
      "ios",
      "android"
    ],
    "plugins": [
      "expo-sqlite"
    ]
  }
}
```

### tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "customConditions": [
      "react-native"
    ],
    "allowImportingTsExtensions": true
  },
  "include": [
    "App.tsx",
    "index.ts",
    "src/**/*.ts",
    "src/**/*.tsx"
  ]
}
```

### index.ts

```ts
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

### App.tsx

```tsx
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { SQL, shoppingInput, type ShoppingItem } from './src/shopping';
import { styles } from './src/styles';

export default function App() {
  const database = useRef<SQLite.SQLiteDatabase | null>(null);
  const mutation = useRef(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [product, setProduct] = useState('');
  const [amount, setAmount] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let opened: SQLite.SQLiteDatabase | null = null;
    async function initialize() {
      setReady(false);
      setError('');
      try {
        opened = await SQLite.openDatabaseAsync('shopping.db');
        await opened.execAsync(SQL.create);
        const saved = await opened.getAllAsync<ShoppingItem>(SQL.list);
        if (!active) { await opened.closeAsync(); return; }
        database.current = opened;
        setItems(saved);
        setReady(true);
      } catch (cause) {
        if (opened) { await opened.closeAsync().catch(() => {}); opened = null; }
        if (active) setError(cause instanceof Error ? cause.message : 'Could not open SQLite.');
      }
    }
    void initialize();
    return () => {
      active = false;
      database.current = null;
      if (opened) void opened.closeAsync().catch(() => {});
    };
  }, [attempt]);

  async function change(action: (db: SQLite.SQLiteDatabase) => Promise<void>) {
    const db = database.current;
    if (!db || !ready || mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    try {
      await action(db);
      setItems(await db.getAllAsync<ShoppingItem>(SQL.list));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Database operation failed.');
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }

  async function save() {
    let input;
    try { input = shoppingInput(product, amount); }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid input.');
      return;
    }
    await change(async (db) => {
      await db.runAsync(SQL.add, input.product, input.amount);
      setProduct('');
      setAmount('');
    });
  }

  async function bought(id: number) {
    await change(async (db) => { await db.runAsync(SQL.remove, id); });
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <Text style={styles.title}>Shopping list · SQLite</Text>
          <Text style={styles.hint}>Saved on this device. Tap bought to remove an item.</Text>
          <TextInput accessibilityLabel="Product" placeholder="Product" style={styles.input}
            value={product} onChangeText={setProduct} editable={ready && !busy} maxLength={100} />
          <TextInput accessibilityLabel="Amount" placeholder="Amount, e.g. 3 litres" style={styles.input}
            value={amount} onChangeText={setAmount} editable={ready && !busy} maxLength={40} />
          <Button title="Save" disabled={!ready || busy} onPress={() => { void save(); }} />
          {!ready && !error && <ActivityIndicator accessibilityLabel="Opening database" />}
          {error !== '' && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {!ready && error !== '' && <Button title="Retry database" onPress={() => setAttempt((value) => value + 1)} />}
          <FlatList data={items} keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={ready ? <Text style={styles.hint}>Your list is empty.</Text> : null}
            renderItem={({ item }) => (
              <View style={[styles.card, styles.row]}>
                <Text style={styles.label}>{item.product}, {item.amount}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={'Mark ' + item.product + ' as bought'}
                  disabled={busy} onPress={() => { void bought(item.id); }}>
                  <Text style={styles.link}>bought</Text>
                </Pressable>
              </View>
            )} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
```

### .gitignore

```text
node_modules/
.expo/
dist*/
.env
.env.*
!.env.example
.DS_Store
```

### .nvmrc

```text
24
```

### src/shopping.ts

```ts
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
```

### src/styles.ts

```ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f7fb' },
  content: { padding: 20, gap: 14, flex: 1 },
  title: { fontSize: 26, fontWeight: '700', color: '#14243b' },
  hint: { fontSize: 14, color: '#475569', lineHeight: 21 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#8a9cb4', borderRadius: 8, padding: 12, fontSize: 17 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 10, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 17, color: '#14243b', flexShrink: 1 },
  strong: { fontSize: 17, fontWeight: '700', color: '#14243b' },
  error: { color: '#a21b24', fontSize: 15, lineHeight: 21 },
  link: { color: '#1256aa', fontSize: 17, padding: 10 },
  map: { flex: 1, minHeight: 250, borderRadius: 12 },
});
```

### tests/shopping.test.ts

```ts
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
```
