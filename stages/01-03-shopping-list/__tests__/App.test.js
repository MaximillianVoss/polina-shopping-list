import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import App from '../App';

test('adds a trimmed item, clears the field, rejects blanks, and clears FlatList data', () => {
  const ui = render(<App />);
  const input = ui.getByLabelText('Shopping item');
  const add = ui.getByRole('button', { name: 'ADD' });
  const clear = ui.getByRole('button', { name: 'CLEAR' });
  fireEvent.changeText(input, '  Milk  ');
  fireEvent.press(add);
  expect(input).toHaveProp('value', '');
  expect(ui.getByText('Milk')).toBeOnTheScreen();
  expect(ui.getByLabelText('Shopping items')).toBeOnTheScreen();
  fireEvent.changeText(input, '   ');
  fireEvent.press(add);
  expect(ui.getByTestId('error-message')).toHaveTextContent('Enter an item name.');
  expect(ui.getByTestId('error-message')).not.toHaveProp('accessibilityLabel');
  fireEvent.press(clear);
  expect(ui.queryByText('Milk')).toBeNull();
  expect(ui.getByLabelText('Empty list message')).toHaveTextContent('No items yet.');
});

test('keeps item order and extracts distinct stable keys for duplicate names', () => {
  const ui = render(<App />);
  const input = ui.getByLabelText('Shopping item');
  const add = ui.getByRole('button', { name: 'ADD' });
  fireEvent.changeText(input, 'Milk');
  fireEvent.press(add);
  fireEvent.changeText(input, 'Bread');
  fireEvent.press(add);
  fireEvent.changeText(input, 'Milk');
  fireEvent.press(add);

  const shoppingList = ui.getByLabelText('Shopping items');
  expect(shoppingList.props.data.map((item) => item.name)).toEqual(['Milk', 'Bread', 'Milk']);
  expect(shoppingList.props.data.map((item, index) => shoppingList.props.keyExtractor(item, index))).toEqual([
    'item-1',
    'item-2',
    'item-3',
  ]);
  expect(ui.getAllByText('Milk')).toHaveLength(2);
});
