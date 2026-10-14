import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { addShoppingItem, clearShoppingItems, getShoppingItemKey } from './src/shopping-list';

export default function App() {
  // Поле остаётся управляемой строкой, а useState перерисовывает экран после каждого изменения.
  const [itemInput, setItemInput] = useState('');
  const [items, setItems] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // id не является видимым состоянием: useRef сохраняет счётчик между рендерами без лишней перерисовки.
  const nextItemIdRef = useRef(1);

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

  return (
    <View style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>Shopping List</Text>
          <Text style={styles.description}>Keep a simple in-memory list for the current app session.</Text>

          <Text style={styles.label}>Shopping item</Text>
          <TextInput
            accessibilityLabel="Shopping item"
            keyboardType="default"
            onChangeText={setItemInput}
            placeholder="Enter an item"
            placeholderTextColor="#64748b"
            style={styles.input}
            value={itemInput}
          />

          <View style={styles.buttonRow}>
            <View style={styles.buttonCell}>
              {/* Имя функции передаётся кнопке как обработчик и вызывается только при событии press. */}
              <Button title="ADD" onPress={handleAdd} color="#2563eb" />
            </View>
            <View style={styles.buttonCell}>
              <Button title="CLEAR" onPress={handleClear} color="#475569" />
            </View>
          </View>

          <Text accessibilityLiveRegion="polite" style={styles.error} testID="error-message">
            {errorMessage}
          </Text>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.length === 0 ? (
            <Text accessibilityLabel="Empty list message" style={styles.emptyText}>
              No items yet.
            </Text>
          ) : (
            <FlatList
              accessibilityLabel="Shopping items"
              contentContainerStyle={styles.listContent}
              data={items}
              // Одинаковые названия допустимы, поэтому ключом служит стабильный id, а не item.name или индекс.
              keyExtractor={getShoppingItemKey}
              renderItem={({ item }) => <Text style={styles.item}>{item.name}</Text>}
            />
          )}
        </View>

        {/* AsyncStorage не нужен по условию: полный перезапуск приложения намеренно очищает покупки. */}
      </View>
    </View>
  );
}

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
