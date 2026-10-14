# Компоненты интерфейса, hooks и API проекта «Shopping List»

## 1. Терминология

В React Native слово «контрол» иногда неформально используют для видимого или интерактивного элемента интерфейса. Для точного ответа на защите лучше разделять сущности по ролям.

- **Компонент** — JSX-элемент, который участвует в построении интерфейса. В проекте это `View`, `Text`, `TextInput`, `Button`, `FlatList` и `StatusBar`.
- **Интерактивный компонент** — компонент, принимающий пользовательское событие. Здесь это прежде всего `TextInput` и два `Button`.
- **Компонент вывода** — показывает данные, но сам не изменяет state. Здесь это `Text`, `FlatList` и `StatusBar`.
- **Компонент компоновки** — группирует и располагает потомков. Здесь это `View`.
- **Prop** — входное значение компонента: например, `value`, `data`, `style`, `accessibilityLabel`.
- **Событийный prop** — prop, которому передают функцию: `onChangeText` или `onPress`.
- **State** — данные компонента, изменение которых через setter планирует новый рендер.
- **Hook** — функция React, подключающая механизм к функциональному компоненту. `useState` и `useRef` — hooks, а не визуальные контролы.
- **API** — программный интерфейс библиотеки. `StyleSheet.create` — API React Native, а не компонент и не контрол.
- **Обработчик события** — функция, которая запускается при событии; в проекте это `handleAdd`, `handleClear` и переданный напрямую `setItemInput`.
- **Доступное имя** — название элемента, которое получает вспомогательная технология и которое может использовать тест.
- **`testID`** — технический идентификатор для автоматического поиска. Он сам по себе не создаёт понятного доступного имени.

Краткая правильная формулировка: «`TextInput` — интерактивный React Native-компонент; `useState` — React hook; `StyleSheet` — React Native API; `StatusBar` — компонент пакета `expo-status-bar`».

## 2. Карта фактически используемых компонентов и API

Точный импорт из `App.js`:

```js
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { addShoppingItem, clearShoppingItems, getShoppingItemKey } from './src/shopping-list';
```

| Имя | Источник | Категория | Фактическая роль |
|---|---|---|---|
| `View` | `react-native` | Компонент компоновки | Экран, карточки, строка и ячейки кнопок |
| `Text` | `react-native` | Текстовый компонент | Заголовки, подписи, описание, ошибка, пустое состояние, строки покупок |
| `TextInput` | `react-native` | Интерактивный компонент | Управляемый ввод названия покупки |
| `Button` | `react-native` | Интерактивный компонент | События `ADD` и `CLEAR` |
| `FlatList` | `react-native` | Компонент виртуализированного списка | Отображение непустого `items` |
| `StatusBar` | `expo-status-bar` | Expo-компонент | Тёмные системные индикаторы на светлом фоне |
| `StyleSheet.create` | `react-native` | API стилей | Создание именованных объектов стилей |
| `useState` | `react` | React hook | `itemInput`, `items`, `errorMessage` и их setter-функции |
| `useRef` | `react` | React hook | Сохранение следующего номера `id` между рендерами |
| `addShoppingItem` | локальный модуль | Чистая функция | Валидация и создание нового массива |
| `clearShoppingItems` | локальный модуль | Чистая функция | Возврат нового пустого массива |
| `getShoppingItemKey` | локальный модуль | Чистая функция | Извлечение `item.id` для `FlatList` |

В текущем `App.js` нет `Pressable`, `TouchableOpacity`, `ScrollView`, `SafeAreaView`, `Modal`, `Image`, `Switch`, `Alert`, навигации или постоянного хранилища. Их нельзя включать в описание как фактически реализованные элементы.

## 3. `View`: компоновка без собственного события

### Точный фрагмент `App.js`

```jsx
<View style={styles.buttonRow}>
  <View style={styles.buttonCell}>
    {/* Имя функции передаётся кнопке как обработчик и вызывается только при событии press. */}
    <Button title="ADD" onPress={handleAdd} color="#2563eb" />
  </View>
  <View style={styles.buttonCell}>
    <Button title="CLEAR" onPress={handleClear} color="#475569" />
  </View>
</View>
```

### Props

- В этом фрагменте `style={styles.buttonRow}` включает горизонтальное направление, промежуток и верхний отступ.
- `style={styles.buttonCell}` задаёт `flex: 1`, поэтому обе ячейки занимают равную долю строки.
- В других местах проекта `View` получает `styles.safeArea`, `styles.screen`, `styles.card` и `styles.listCard`.

### События и связь со state

У `View` в проекте нет событий. Он не читает и не изменяет state напрямую, а только содержит компоненты. Изменение `items` меняет состав потомков внутри `listCard`, но сам `View` остаётся структурным контейнером.

### Доступность

Структурным `View` не заданы `accessibilityLabel` и роль. Это уместно: вспомогательной технологии не нужно останавливаться на каждой декоративной обёртке. Значимые подписи размещены на дочерних компонентах.

### Типичная ошибка

Ошибка — ожидать, что `View` автоматически ведёт себя как HTML-кнопка или принимает нажатие без соответствующего press-механизма.

### Модельный ответ

«`View` — базовый контейнер React Native. В этом проекте он отвечает только за структуру и Flexbox-компоновку; пользовательские события обрабатывают вложенные `Button`».

## 4. `Text`: видимое содержание и сообщения состояния

### Точные фрагменты `App.js`

Статический текст:

```jsx
<Text style={styles.title}>Shopping List</Text>
<Text style={styles.description}>Keep a simple in-memory list for the current app session.</Text>

<Text style={styles.label}>Shopping item</Text>
```

Текст из state:

```jsx
<Text accessibilityLiveRegion="polite" style={styles.error} testID="error-message">
  {errorMessage}
</Text>
```

Пустое состояние и строка списка:

```jsx
<Text accessibilityLabel="Empty list message" style={styles.emptyText}>
  No items yet.
</Text>
```

```jsx
renderItem={({ item }) => <Text style={styles.item}>{item.name}</Text>}
```

### Props

- `style` выбирает визуальный вариант: заголовок, описание, подпись, ошибка, пустое состояние или покупка.
- `accessibilityLiveRegion="polite"` применяется только к тексту ошибки.
- `testID="error-message"` позволяет тесту найти постоянную область ошибки.
- `accessibilityLabel="Empty list message"` задаёт доступное имя пустого состояния.
- Дочернее содержимое бывает статическим (`Shopping List`) или динамическим (`errorMessage`, `item.name`).

### События и связь со state

`Text` не имеет событий в текущем проекте. Он читает:

- `errorMessage` для сообщения валидации;
- `item.name` из элемента `items`, переданного `FlatList`.

Условие `items.length === 0` определяет, будет показан текст `No items yet.` или список.

### Доступность

Обычный текст может быть прочитан по своему содержимому. У ошибки не задан `accessibilityLabel`, поэтому фактическая строка `Enter an item name.` не заменяется другой меткой. `accessibilityLiveRegion="polite"` помогает объявить изменение ошибки на Android. У пустого сообщения доступное имя отличается от видимого текста: тест находит элемент по `Empty list message`, а затем проверяет содержимое `No items yet.`.

### Типичная ошибка

В React Native нельзя размещать произвольную строку непосредственно внутри `View` так, как это допускается в обычном HTML. Видимый текст должен находиться внутри `Text`.

### Модельный ответ

«`Text` показывает как статические строки, так и значения из данных. Ошибка связана с `errorMessage`, а строка покупки — с `item.name`; сам компонент состояние не меняет».

## 5. `TextInput`: управляемый ввод

### Точный фрагмент `App.js`

```jsx
<TextInput
  accessibilityLabel="Shopping item"
  keyboardType="default"
  onChangeText={setItemInput}
  placeholder="Enter an item"
  placeholderTextColor="#64748b"
  style={styles.input}
  value={itemInput}
/>
```

### Props

| Prop | Текущее значение | Назначение |
|---|---|---|
| `accessibilityLabel` | `"Shopping item"` | Понятное имя поля для сервисов доступности и теста |
| `keyboardType` | `"default"` | Обычная текстовая клавиатура |
| `onChangeText` | `setItemInput` | Получает уже извлечённую строку и обновляет state |
| `placeholder` | `"Enter an item"` | Подсказка, когда `value` пусто |
| `placeholderTextColor` | `"#64748b"` | Явный контрастный цвет подсказки |
| `style` | `styles.input` | Рамка, отступы, цвета и размер текста |
| `value` | `itemInput` | Отображаемая строка из state |

### Событие и связь со state

При редактировании `onChangeText` получает новую строку и вызывает `setItemInput`. Setter обновляет `itemInput`, после чего `value={itemInput}` показывает новое состояние. При успешном `handleAdd` вызывается `setItemInput('')`, поэтому поле становится пустым. При ошибке setter поля не вызывается, и пробельный ввод остаётся видимым как пустое пространство.

### Доступность

`accessibilityLabel="Shopping item"` является устойчивым назначением поля. Видимая подпись `Shopping item` расположена рядом, но React Native не связывает её с полем через HTML-атрибут `for`; явная метка снимает неоднозначность. Placeholder не заменяет доступную подпись: он исчезает после ввода и является подсказкой, а не названием поля.

### Типичная ошибка

Ошибка — написать `onChangeText={setItemInput()}`. Setter тогда вызовется во время рендера, а prop получит не функцию. Другая ошибка — оставить `value={itemInput}`, но не обновлять `itemInput`: поле станет фактически только для чтения.

### Модельный ответ

«Поле управляемое: `value` поступает из `itemInput`, а `onChangeText` передаёт новую строку в `setItemInput`. После успешного добавления state становится пустой строкой, поэтому очищается и поле».

## 6. `Button`: события `ADD` и `CLEAR`

### Точный фрагмент `App.js`

```jsx
<View style={styles.buttonRow}>
  <View style={styles.buttonCell}>
    {/* Имя функции передаётся кнопке как обработчик и вызывается только при событии press. */}
    <Button title="ADD" onPress={handleAdd} color="#2563eb" />
  </View>
  <View style={styles.buttonCell}>
    <Button title="CLEAR" onPress={handleClear} color="#475569" />
  </View>
</View>
```

### Props

- `title="ADD"` и `title="CLEAR"` задают видимый текст и доступное имя стандартной кнопки.
- `onPress={handleAdd}` и `onPress={handleClear}` передают ссылки на функции.
- `color="#2563eb"` и `color="#475569"` задают платформозависимое основное цветовое оформление стандартного `Button`.

### События и связь со state

`ADD` запускает `handleAdd`:

- читает `items`, `itemInput` и `nextItemIdRef.current`;
- при ошибке меняет только `errorMessage`;
- при успехе меняет `items`, `itemInput`, `errorMessage` и увеличивает `.current`.

`CLEAR` запускает `handleClear`:

- заменяет `items` новым пустым массивом;
- очищает `errorMessage`;
- не изменяет `itemInput` и `nextItemIdRef.current`.

### Доступность

Стандартный `Button` предоставляет роль кнопки, а `title` используется как имя. Поэтому тесты находят элементы через `getByRole('button', { name: 'ADD' })` и `getByRole('button', { name: 'CLEAR' })`. Отдельный `testID` для кнопок не нужен.

### Типичная ошибка

Ошибка — `onPress={handleAdd()}`. Такой код вызывает функцию при вычислении JSX. Правильный вариант передаёт функцию: `onPress={handleAdd}`.

### Модельный ответ

«`Button` получает обработчик через `onPress`. `ADD` координирует проверку и обновление списка, а `CLEAR` очищает список и ошибку. `title` одновременно виден и используется как доступное имя».

## 7. `FlatList`: список данных со стабильными ключами

### Точный фрагмент `App.js`

```jsx
<FlatList
  accessibilityLabel="Shopping items"
  contentContainerStyle={styles.listContent}
  data={items}
  // Одинаковые названия допустимы, поэтому ключом служит стабильный id, а не item.name или индекс.
  keyExtractor={getShoppingItemKey}
  renderItem={({ item }) => <Text style={styles.item}>{item.name}</Text>}
/>
```

### Props

| Prop | Текущее значение | Назначение |
|---|---|---|
| `accessibilityLabel` | `"Shopping items"` | Доступное имя списка и точка поиска UI-теста |
| `contentContainerStyle` | `styles.listContent` | Интервал `gap: 8` между строками |
| `data` | `items` | Текущий массив объектов `{ id, name }` |
| `keyExtractor` | `getShoppingItemKey` | Возвращает `item.id` |
| `renderItem` | функция с `({ item })` | Возвращает `Text` с `item.name` |

### Callbacks, события и связь со state

Пользовательского события у `FlatList` в текущем коде нет. Однако он вызывает два callback:

- `renderItem` для построения видимой строки;
- `keyExtractor` для получения идентичности элемента.

`data={items}` напрямую связывает список со state. После `setItems(addition.items)` список получает новый массив. После очистки `FlatList` вообще удаляется из дерева, потому что условие переключается на `No items yet.`.

### Доступность

Контейнер имеет имя `Shopping items`. Тексты строк читаются по `item.name`. Одинаковые видимые названия допустимы: доступность содержимого и технический ключ решают разные задачи.

### Типичная ошибка

Ошибка — использовать `keyExtractor={(item) => item.name}` или индекс. Два элемента `Milk` тогда имеют одинаковое имя, а индекс описывает позицию. Текущая функция `getShoppingItemKey` возвращает отдельный стабильный `id`.

### Модельный ответ

«`FlatList` получает массив `items`, вызывает `renderItem` для каждой строки и извлекает стабильный `item.id` через `keyExtractor`. Дубликаты имён поэтому остаются разными сущностями».

## 8. `StatusBar`: системная строка состояния Expo

### Точный фрагмент `App.js`

```jsx
<View style={styles.safeArea}>
  <StatusBar style="dark" />
  <View style={styles.screen}>
```

### Props

Используется один prop: `style="dark"`. Он выбирает тёмный вариант системных индикаторов, подходящий к светлому фону `#f8fafc` и белым карточкам.

### События и связь со state

Событий нет, со state приложения компонент не связан. Он рендерится постоянно.

### Доступность

`StatusBar` не является содержимым списка покупок и не получает пользовательскую метку. Его задача — согласовать внешний вид системной области с фоном приложения.

### Типичная ошибка

Ошибка — считать этот `StatusBar` React Native-компонентом из текущего импорта. В данном проекте он импортирован из `expo-status-bar`. Также `style="dark"` описывает цвет системных значков, а не фон карточки.

### Модельный ответ

«`StatusBar` приходит из пакета Expo и задаёт тёмные системные индикаторы. Он не хранит данные, не принимает события и не является кнопкой или полем».

## 9. `useState`: React hook состояния

`useState` — не контрол и не компонент. Hook вызывается в начале функционального компонента и возвращает пару «текущее значение + setter».

### Точный фрагмент `App.js`

```js
// Поле остаётся управляемой строкой, а useState перерисовывает экран после каждого изменения.
const [itemInput, setItemInput] = useState('');
const [items, setItems] = useState([]);
const [errorMessage, setErrorMessage] = useState('');
```

Точные места применения setter-функций:

```js
if (!addition.ok) {
  setErrorMessage(addition.error);
  return;
}

nextItemIdRef.current += 1;
// Чистая функция уже создала новый массив: setter обновляет state и вызывает следующий рендер.
setItems(addition.items);
setItemInput('');
setErrorMessage('');
```

```js
function handleClear() {
  setItems(clearShoppingItems());
  setErrorMessage('');
}
```

### Вход, результат и связь с интерфейсом

- `useState('')` создаёт строковые состояния `itemInput` и `errorMessage`.
- `useState([])` создаёт массив `items`.
- `setItemInput` связан с `TextInput`.
- `setItems` переключает пустое сообщение и `FlatList`.
- `setErrorMessage` меняет содержимое live region.

У hook нет props, доступного имени или пользовательского события. События вызывают setter-функции косвенно.

### Типичная ошибка

Ошибка — мутировать `items` через `push` и ожидать корректного обновления по той же ссылке. Другая ошибка — вызывать hook внутри `if` или обработчика. Hooks должны вызываться на верхнем уровне компонента в одинаковом порядке.

### Модельный ответ

«`useState` — React hook, а не визуальный контрол. Он хранит данные экрана и возвращает setter, после которого React планирует новый рендер».

## 10. `useRef`: React hook сохраняемой ссылки

`useRef` — не контрол и не state. Он возвращает объект с изменяемым свойством `.current`, который сохраняется между рендерами текущего монтирования.

### Точные фрагменты `App.js`

```js
// id не является видимым состоянием: useRef сохраняет счётчик между рендерами без лишней перерисовки.
const nextItemIdRef = useRef(1);
```

```js
function handleAdd() {
  const addition = addShoppingItem(items, `item-${nextItemIdRef.current}`, itemInput);
  if (!addition.ok) {
    setErrorMessage(addition.error);
    return;
  }

  nextItemIdRef.current += 1;
```

### Вход, результат и связь с интерфейсом

- Начальное значение `1` используется при первом монтировании.
- Чтение `.current` формирует `item-1`, `item-2`, ….
- Изменение `.current` не запускает рендер.
- В интерфейсе номер не показывается, но влияет на ключи `FlatList`.
- При полном новом монтировании ссылка снова начинается с `1`.

У hook нет props, событий и характеристик доступности.

### Типичная ошибка

Ошибка — заменить ссылку локальной переменной `let nextItemId = 1`: при каждом рендере она будет создана заново. Другая ошибка — ожидать, что изменение `.current` немедленно перерисует интерфейс.

### Модельный ответ

«`useRef` хранит следующий номер между рендерами без дополнительного рендера. Счётчик увеличивается только после успешной проверки и косвенно обеспечивает стабильные ключи».

## 11. `StyleSheet.create`: React Native API стилей

`StyleSheet` — не компонент, не hook и не визуальный контрол. Вызов `StyleSheet.create` получает объект именованных стилей; затем конкретные компоненты получают ссылки через prop `style` или `contentContainerStyle`.

### Точный фрагмент `App.js`

```js
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 36,
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe4f0',
    padding: 20,
    gap: 10,
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 6,
  },
  label: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    fontSize: 17,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  buttonCell: {
    flex: 1,
  },
  error: {
    minHeight: 20,
    color: '#b91c1c',
    fontWeight: '600',
  },
  listCard: {
    flex: 1,
    minHeight: 180,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe4f0',
    padding: 20,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  listContent: {
    gap: 8,
  },
  item: {
    color: '#1e293b',
    fontSize: 17,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
});
```

### Использование, события и state

- У API нет props и событий; props получают компоненты, использующие `styles.*`.
- Объекты стилей статичны и не читают state.
- `styles.error` применяется даже при пустом `errorMessage`, сохраняя `minHeight: 20`.
- `styles.listContent` передаётся не в `style`, а в `contentContainerStyle` у `FlatList`.

### Доступность

Стили поддерживают доступность косвенно: размер текста, контраст, видимая рамка поля и пространство для ошибки улучшают восприятие. Но стиль не заменяет семантику `accessibilityLabel`, роль кнопки или live region. Контраст и масштабирование шрифта нужно дополнительно проверять на реальном устройстве.

### Типичная ошибка

Ошибка — писать CSS-строки вроде `'font-size': '17px'`. В React Native используются camelCase-имена и числовые значения: `fontSize: 17`. Другая ошибка — передать `styles.listContent` в `style` списка и ожидать, что интервалы применятся к внутреннему контейнеру строк.

### Модельный ответ

«`StyleSheet.create` — API React Native для именованных объектов стилей. Компоненты получают их через props; API не является контролом, не принимает пользовательские события и не хранит state».

## 12. Локальные функции как мост между событиями и state

Эти функции не относятся к React Native-компонентам или API, но объясняют связь контролов с данными.

### Точный фрагмент обработчиков

```js
function handleAdd() {
  const addition = addShoppingItem(items, `item-${nextItemIdRef.current}`, itemInput);
  if (!addition.ok) {
    setErrorMessage(addition.error);
    return;
  }

  nextItemIdRef.current += 1;
  // Чистая функция уже создала новый массив: setter обновляет state и вызывает следующий рендер.
  setItems(addition.items);
  setItemInput('');
  setErrorMessage('');
}

function handleClear() {
  setItems(clearShoppingItems());
  setErrorMessage('');
}
```

| Функция | Вызывается из | Читает | Изменяет или возвращает |
|---|---|---|---|
| `handleAdd` | `Button.onPress` у `ADD` | `items`, `itemInput`, `nextItemIdRef.current` | Вызывает setters; увеличивает ref при успехе |
| `handleClear` | `Button.onPress` у `CLEAR` | Ничего из текущих значений для вычисления результата | Устанавливает новый `[]` и пустую ошибку |
| `addShoppingItem` | `handleAdd` | Только аргументы | Возвращает объект ошибки или новый массив |
| `clearShoppingItems` | `handleClear` | Ничего | Возвращает новый пустой массив |
| `getShoppingItemKey` | `FlatList.keyExtractor` | `item.id` | Возвращает строковый ключ |

## 13. StyleSheet, доступность и тестируемость

### Карта доступности

| Элемент | Доступный контракт | Проверка в тесте или вручную |
|---|---|---|
| `TextInput` | `accessibilityLabel="Shopping item"` | `getByLabelText('Shopping item')` |
| Кнопка добавления | Роль `button`, имя из `title="ADD"` | `getByRole('button', { name: 'ADD' })` |
| Кнопка очистки | Роль `button`, имя из `title="CLEAR"` | `getByRole('button', { name: 'CLEAR' })` |
| Ошибка | `accessibilityLiveRegion="polite"`; фактический текст; `testID="error-message"` | Проверка текста по `getByTestId`; ручная проверка экранного диктора |
| Пустое состояние | `accessibilityLabel="Empty list message"` и текст `No items yet.` | Поиск по label, затем проверка текста |
| Непустой список | `accessibilityLabel="Shopping items"` | `getByLabelText('Shopping items')` |
| Строка покупки | Текст `item.name` | `getByText` или `getAllByText` |

### Важные различия

- `placeholder="Enter an item"` — подсказка, не основная доступная метка.
- `testID="error-message"` помогает тесту, но не объясняет назначение элемента пользователю.
- Стабильный React key не является доступным именем и не показывается на экране.
- `accessibilityLabel` не должен без причины скрывать полезный динамический текст.
- Цвет ошибки помогает зрячему пользователю, но смысл передаётся также текстом, а не только цветом.
- Структурные `View` не получают лишних меток, чтобы не засорять навигацию экранного диктора.

### Проверка доступности вручную

1. Включить TalkBack на Android или VoiceOver на iOS.
2. Перейти к полю и услышать назначение `Shopping item`.
3. Перейти к кнопкам и услышать `ADD` и `CLEAR` как кнопки.
4. Отправить пробельную строку и проверить объявление `Enter an item name.`.
5. Добавить два одинаковых `Milk` и убедиться, что обе строки доступны.
6. Очистить список и проверить доступность `No items yet.`.
7. Увеличить системный шрифт и проверить, что текст не обрезается критически.

Автоматические тесты подтверждают props и содержимое, но не гарантируют фактическую интонацию экранного диктора, размеры зоны нажатия или контраст на конкретном дисплее.

## 14. Матрица «компонент → state → событие/callback → результат»

| Компонент или экземпляр | State/Ref на входе | Событие или callback | Вызываемый код | Наблюдаемый результат |
|---|---|---|---|---|
| `TextInput` | `itemInput` через `value` | `onChangeText(text)` | `setItemInput(text)` | Поле отображает новую строку |
| `Button` `ADD` | Косвенно читает `itemInput`, `items`, `nextItemIdRef` | `onPress` | `handleAdd` | Ошибка либо новый элемент, очищенные поле и ошибка |
| `Button` `CLEAR` | Косвенно влияет на `items`, `errorMessage` | `onPress` | `handleClear` | Пустой список и пустая ошибка; поле не сброшено |
| `Text` ошибки | `errorMessage` | Нет | Рендер `{errorMessage}` | Пустая область либо `Enter an item name.` |
| Условный `Text` | `items.length === 0` | Нет | Условный рендер | `No items yet.` при пустом массиве |
| `FlatList` | `items` через `data` | `renderItem`, `keyExtractor` | JSX строки, `getShoppingItemKey` | Покупки в порядке массива со стабильными ключами |
| `Text` строки | `item.name` | Нет | Рендер `{item.name}` | Видимое нормализованное название |
| `View` | Прямой связи нет | Нет | Flexbox-компоновка | Карточки и кнопки расположены на экране |
| `StatusBar` | Связи нет | Нет | Постоянный рендер | Тёмные системные индикаторы |
| `useState` | Хранит три значения | Setter вызывается обработчиком | Планирует рендер | Обновлённые props компонентов |
| `useRef` | `nextItemIdRef.current` | Изменяется в `handleAdd` | `current += 1` | Следующий стабильный `id` без собственного рендера |

Главная причинная цепочка:

```text
TextInput.onChangeText
  → setItemInput
  → Button ADD.onPress
  → handleAdd
  → addShoppingItem
  → setItems
  → FlatList.data
  → renderItem
  → Text с item.name
```

## 15. Аналоги в веб-разработке

Аналоги помогают перенести знания, но не означают полного совпадения API.

| React Native | Приблизительный веб-аналог | Важное отличие |
|---|---|---|
| `View` | `div` | Нет HTML-тегов и CSS cascade; компоновка задаётся объектами стилей |
| `Text` | `span`, `p`, `h1` | Весь обычный текст должен быть внутри `Text`; семантический уровень не совпадает автоматически с HTML-заголовком |
| `TextInput` | `input type="text"` | Используется `onChangeText` с готовой строкой, а не обязательное чтение `event.target.value` |
| `Button` | `button` | Внешний вид стандартного `Button` сильнее зависит от платформы; `title` задаётся prop |
| `FlatList` | `ul` + `li` или `.map()` с виртуализацией | Получает `data`, `renderItem`, `keyExtractor` и оптимизирует длинные списки |
| `StatusBar` | Нет прямого DOM-аналога | Управляет системной областью мобильной ОС, а не элементом страницы |
| `StyleSheet.create` | CSS-модуль или JS-объекты стилей | Свойства camelCase, числовые размеры обычно без `px`, нет обычного CSS cascade |
| `useState` | Тот же React hook в React DOM | Механика состояния похожа; меняются компоненты отображения |
| `useRef` | Тот же React hook в React DOM | Здесь ref хранит число, а не ссылку на DOM-узел |
| `accessibilityLabel` | `aria-label` | Платформенные правила доступности отличаются; соответствие приблизительное |
| `testID` | `data-testid` | Технический контракт теста, не пользовательская семантика |

Веб-вариант `onClick={handleAdd}` примерно соответствует `onPress={handleAdd}`, но в React Native нет клика мыши как универсальной модели мобильного взаимодействия.

## 16. Мини-упражнения

### Упражнение 1. Классификация

Разнести по трём колонкам: `TextInput`, `useState`, `StyleSheet.create`, `FlatList`, `useRef`, `Button`, `StatusBar`.

Эталон:

- компоненты: `TextInput`, `FlatList`, `Button`, `StatusBar`;
- hooks: `useState`, `useRef`;
- API: `StyleSheet.create`.

### Упражнение 2. Найти связь управляемого поля

Назвать две строки, без которых поле не является полностью управляемым.

Ответ: `value={itemInput}` и `onChangeText={setItemInput}`.

### Упражнение 3. Исправить преждевременный вызов

Неверно:

```jsx
<Button title="ADD" onPress={handleAdd()} />
```

Правильно:

```jsx
<Button title="ADD" onPress={handleAdd} />
```

Объяснение: prop должен получить функцию, которую вызовет компонент при событии.

### Упражнение 4. Выбрать ключ

Для `[{ id: 'item-1', name: 'Milk' }, { id: 'item-2', name: 'Milk' }]` выбрать между `name`, индексом и `id`.

Ответ: `id`, потому что он уникален для двух разрешённых дубликатов и принадлежит сущности.

### Упражнение 5. Предсказать `CLEAR`

До события: `itemInput = 'Eggs'`, два элемента, ошибка присутствует, следующий номер `3`.

После события: `itemInput = 'Eggs'`, `items = []`, `errorMessage = ''`, `nextItemIdRef.current = 3`.

### Упражнение 6. Сопоставить тестовый запрос

- `getByLabelText('Shopping item')` → `TextInput`;
- `getByRole('button', { name: 'ADD' })` → первая кнопка;
- `getByTestId('error-message')` → `Text` ошибки;
- `getByLabelText('Shopping items')` → `FlatList`;
- `getByLabelText('Empty list message')` → `Text` пустого состояния.

### Упражнение 7. Объяснить отсутствие `FlatList`

Вопрос: почему тест после `CLEAR` ищет `Empty list message`, а не пустой `FlatList`?

Ответ: JSX использует условие `items.length === 0`; при пустом массиве создаётся `Text`, а ветка `FlatList` не рендерится.

### Упражнение 8. Найти границу ответственности

Вопрос: где должна находиться проверка `trim()` — в `TextInput`, `handleAdd` или чистой функции?

Ответ для текущей архитектуры: в `normalizeItemName`, которую вызывает `addShoppingItem`. Компонент остаётся координатором, а правило можно тестировать отдельно.

## 17. Вопросы и полные ответы

### 1. Какие сущности в проекте можно строго назвать компонентами?

`View`, `Text`, `TextInput`, `Button`, `FlatList` и `StatusBar`, потому что они используются как JSX-элементы. Первые пять импортированы из React Native, последний — из `expo-status-bar`.

### 2. Почему `useState` нельзя называть полем ввода или контролом?

`useState` ничего не отображает и не принимает пользовательский ввод. Это React hook, который предоставляет значение и setter. Полем ввода является `TextInput`, использующий это значение.

### 3. Почему `StyleSheet` не компонент?

`StyleSheet` не используется как `<StyleSheet />`. Вызывается метод `StyleSheet.create`, который создаёт объекты стилей. Затем эти объекты передаются компонентам через props.

### 4. Какие компоненты непосредственно принимают пользовательские события?

`TextInput` принимает изменение текста через `onChangeText`; два `Button` принимают нажатие через `onPress`. У других компонентов пользовательские обработчики в текущем коде не заданы.

### 5. Как поле связано со state в обоих направлениях?

Из state в поле данные идут через `value={itemInput}`. Из поля в state новая строка идёт через `onChangeText={setItemInput}`. Этот двусторонний цикл делает поле управляемым.

### 6. Какие state-переменные меняет успешный `ADD`?

`items` получает новый массив, `itemInput` — пустую строку, `errorMessage` — пустую строку. Кроме state, `nextItemIdRef.current` увеличивается на один.

### 7. Какие значения меняет неуспешный `ADD`?

Он меняет только `errorMessage`, записывая `Enter an item name.`. `items`, `itemInput` и `nextItemIdRef.current` остаются прежними из-за раннего `return`.

### 8. Какие значения меняет `CLEAR`?

`items` становится новым пустым массивом, `errorMessage` становится пустой строкой. `itemInput` и `nextItemIdRef.current` текущий код не меняет.

### 9. Почему список получает `contentContainerStyle`, а не только `style`?

`contentContainerStyle` оформляет внутренний контейнер, в котором располагаются строки. Здесь именно между строками нужен `gap: 8`. Внешний `style` отвечал бы за сам экземпляр списка.

### 10. Является ли `renderItem` событием пользователя?

Нет. Это callback рендеринга, который `FlatList` вызывает для построения элементов. Пользователь не инициирует его напрямую отдельным жестом.

### 11. Чем `accessibilityLabel` отличается от `testID`?

`accessibilityLabel` объясняет назначение элемента вспомогательной технологии и может использоваться человекоориентированным тестовым запросом. `testID` — технический селектор; он не заменяет содержательную метку.

### 12. Почему тест ошибки проверяет отсутствие `accessibilityLabel`?

Ошибка динамическая. Если её текст заменить постоянной меткой, пользователь может не услышать конкретное сообщение. Текущий контракт сохраняет фактическое содержимое `Enter an item name.` как доступный текст.

### 13. Почему две строки `Milk` допустимы для интерфейса, но не для ключей?

Видимое название — данные предметной области и по условию может повторяться. Ключ — техническая идентичность, необходимая React для однозначного сопоставления элементов, поэтому он должен различаться.

### 14. Почему изменение `nextItemIdRef.current` не обновляет экран само?

React не отслеживает `.current` как state. `useRef` сохраняет изменяемое значение, но изменение ссылки не планирует рендер. При успехе интерфейс обновляется благодаря следующему `setItems`.

### 15. Что случится с `FlatList` после `CLEAR`?

Он не просто получит пустой массив: условный JSX выберет другую ветку, поэтому `FlatList` будет удалён из дерева, а вместо него появится `Text` с `No items yet.`.

### 16. Какие элементы не имеют отдельного доступного имени и почему?

Декоративные и структурные `View`, обычные заголовки и строки покупок не получают отдельную метку. Их структура не должна создавать лишние остановки, а текстовые компоненты уже содержат читаемый текст.

### 17. Какой prop связывает тест с фактическим массивом списка?

`data={items}`. UI-тест получает `FlatList` по метке `Shopping items`, затем читает `shoppingList.props.data` и проверяет порядок имён и работу `keyExtractor`.

### 18. Как кратко описать весь интерфейс технически точно?

«`View` строит компоновку, `TextInput` управляется `itemInput`, `Button` запускают обработчики, `Text` показывает подписи и ошибку, `FlatList` отображает `items` со стабильными ключами, `StatusBar` оформляет системные индикаторы; `useState`, `useRef` и `StyleSheet.create` обеспечивают состояние, сохраняемую ссылку и стили, но сами не являются контролами».
