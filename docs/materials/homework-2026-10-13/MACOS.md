# Подготовка Mac для №15 и №16

Нужны Node.js с npm и инструменты выбранной платформы. Готовые проекты используют Expo SDK 54, чтобы соответствовать исходному шаблону ученицы. Для тестов со встроенной SQLite Node.js используйте Node 24.

Проверить установку:

```bash
node --version
npm --version
```

Если используется NVM:

```bash
source "$HOME/.nvm/nvm.sh"
nvm install 24
nvm use 24
```

Зайдите в папку нужного проекта и установите зависимости по прилагаемому lock-файлу:

```bash
npm ci
npm run typecheck
npm test
npx expo install --check
```

Затем запустите выбранную платформу:

```bash
npm run ios
# или
npm run android
# или
npm run web
```

Для iOS Simulator нужен Xcode. Для Android нужен созданный и запущенный эмулятор. Версия Expo Go должна поддерживать SDK проекта; несовпадение версии Expo Go и SDK требует установки совместимого клиента или development build. При переносе кода в уже существующий проект используйте команды `npx expo install` из его мануала и сохраняйте SDK исходного проекта.

Подробный запуск через общий скрипт: [GROUP-RUN.md](GROUP-RUN.md).
