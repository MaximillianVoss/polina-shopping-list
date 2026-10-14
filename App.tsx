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
