# Assignment 11 (Shopping list with SQLite)

Источник: [скриншот задания](../../../sources/mobile/Screenshot 2026-09-18 at 14.11.13.png).

## Original assignment — English

Extend your Shopping List (Assignment 4) by saving items to a SQLite database.

- Shopping item contains following columns: id (unique int), product (text), amount (text)
- Items can be deleted by pressing ‘bought’-link in item’s row in the list

На исходной картинке поля Product, Amount, кнопка SAVE и список Shopping list; у каждого элемента ссылка bought. Примеры Milk, 3 litres и Apples, 5 pcs показывают, почему amount — текст, а не число.

## Что требуется

1. Развить Shopping List из задания 4.
2. Сохранять данные в SQLite, а не только в `useState`.
3. Таблица с уникальным целочисленным `id`, текстовыми `product` и `amount`.
4. Добавлять покупку через форму.
5. Загружать сохранённые покупки после перезапуска приложения.
6. Ссылка bought в строке должна **удалять** запись, а не только перечёркивать её.

Полный исходник Assignment 4 в новом архиве отсутствует. Поэтому дано самостоятельное продолжение с той же формой и требуемым хранением, без выдуманных дополнительных условий Assignment 4.

[Подробное решение](MANUAL.md) · [Код](../../../../../../stages/02-11-sqlite-shopping)
