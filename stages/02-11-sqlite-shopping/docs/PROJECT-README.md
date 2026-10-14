# 11 · Shopping list with SQLite

Список покупок из Assignment 4; SQLite: id уникальный integer, product text, amount text; bought удаляет строку.

- [Исходное задание](../../../docs/materials/homework-2026-09-20/docs/mobile/11-sqlite-shopping/assignment-original.md)
- [Полная инструкция, теория, листинги, проверки](../../../docs/materials/homework-2026-09-20/docs/mobile/11-sqlite-shopping/MANUAL.md)

Это Expo TypeScript, запуск на телефоне/нативном симуляторе, не Vite и не обычная web-страница.

Если взят весь комплект: `cd projects/mobile && npm ci`, затем `cd 11-sqlite-shopping`.
Если скопирована только эта папка: `npm install` (создаст локальный lock).

```bash
npm run typecheck
npm test
npm start
```

Для Android/iOS bundle: npm run bundle:android / npm run bundle:ios. Это не APK/IPA.
