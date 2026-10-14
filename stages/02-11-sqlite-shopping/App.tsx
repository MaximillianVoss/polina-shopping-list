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
