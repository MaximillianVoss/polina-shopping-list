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
