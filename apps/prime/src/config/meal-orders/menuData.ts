export interface BreakfastFoodItem {
  value: string;
  label: string;
}

export interface BreakfastDrinkItem {
  value: string;
  label: string;
  modifiers?: string[];
}

export interface EvDrinkItem {
  value: string;
  label: string;
  type: 'type 1' | 'type 2';
  modifiers?: Record<string, boolean>;
}

export const breakfastOptions: BreakfastFoodItem[] = [
  { value: 'Eggs', label: 'Eggs with three sides' },
  { value: 'Pancakes', label: 'Pancakes' },
  { value: 'Veggie Toast', label: 'Veggie Toast (with seasonal vegetables)' },
  { value: 'Healthy Delight', label: 'Healthy Delight (parfait of yoghurt, granola & homemade fruit compote)' },
  { value: 'FT Regular', label: 'French Toast with Golden Syrup' },
  { value: 'FT Nutella', label: 'French Toast stuffed with Nutella' },
];

export const eggStyles: BreakfastFoodItem[] = [
  { value: 'Scrambled', label: 'Scrambled' },
  { value: 'Overeasy', label: 'Over-easy (egg is flipped over, so that the yellow center is cooked through)' },
  { value: 'SSU', label: 'Sunny side up (yellow center remains runny)' },
  { value: 'Omlette', label: 'Omelette' },
];

export const eggSides: BreakfastFoodItem[] = [
  { value: 'Bacon', label: 'Bacon' },
  { value: 'Ham', label: 'Ham' },
  { value: 'Cheese', label: 'Cheese' },
  { value: 'Mushroom', label: 'Mushroom' },
  { value: 'Tomatoes', label: 'Tomatoes' },
  { value: 'Toast', label: 'Toast' },
  { value: 'Beans', label: 'Beans' },
];

export const pancakeSyrups: BreakfastFoodItem[] = [
  { value: 'PC Reg Syrup', label: 'Homemade Golden Syrup' },
  { value: 'PC Orange Syrup', label: 'Homemade Orange Cinnamon Syrup' },
  { value: 'PC Lemon Syrup', label: 'Homemade Lemon Syrup' },
  { value: 'PC Nut', label: 'Nutella Chocolate Sauce' },
];

export const drinksOptions: BreakfastDrinkItem[] = [
  { value: 'Cappuccino', label: 'Cappuccino', modifiers: ['Sugar'] },
  { value: 'Americano', label: 'Americano', modifiers: ['Milk', 'Sugar'] },
  { value: 'Espresso', label: 'Espresso', modifiers: ['Sugar'] },
  { value: 'Breakfast Tea', label: 'Breakfast Tea', modifiers: ['Milk', 'Sugar'] },
  { value: 'Green Tea', label: 'Green Tea' },
  { value: 'Herbal Tea', label: 'Herbal Tea' },
  { value: 'Carton OJ', label: 'Orange Juice (from the carton)' },
  { value: 'Carton Pineapple', label: 'Pineapple Juice (from the carton)' },
];

export const sugarOptions: string[] = ['No Sugar', 'Half Sugar', 'Full Sugar'];

export const milkOptions: string[] = ['No Milk', 'Oat Milk', 'Full Milk'];

export const breakfastTimes: string[] = [
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15',
];

export const drinksData: EvDrinkItem[] = [
  // Type 1 Drinks
  { value: 'Coke', label: 'Coke', type: 'type 1' },
  { value: 'Coke Zero', label: 'Coke Zero', type: 'type 1' },
  { value: 'Fanta', label: 'Fanta', type: 'type 1' },
  { value: 'Sprite', label: 'Sprite', type: 'type 1' },
  { value: 'Orange Juice', label: 'Orange Juice from the Carton', type: 'type 1' },
  { value: 'Pineapple Juice', label: 'Pineapple Juice from the Carton', type: 'type 1' },
  { value: 'Tea', label: 'Tea', type: 'type 1', modifiers: { milk: false } },
  { value: 'Green Tea', label: 'Green Tea', type: 'type 1' },
  { value: 'Herbal Tea', label: 'Herbal Tea', type: 'type 1' },
  { value: 'Americano', label: 'Americano', type: 'type 1', modifiers: { sugar: false, milk: false } },
  { value: 'Espresso', label: 'Espresso', type: 'type 1' },
  // Type 2 Drinks
  { value: 'Iced Latte', label: 'Iced Latte', type: 'type 2', modifiers: { sweetened: false } },
  { value: 'Skyy Vodka', label: 'Skyy Vodka', type: 'type 2' },
  { value: 'Aperol Spritz', label: 'Aperol Spritz', type: 'type 2' },
  { value: 'Limoncello Spritz', label: 'Limoncello Spritz', type: 'type 2' },
  { value: 'Prosecco', label: 'Glass of Prosecco', type: 'type 2' },
  { value: 'Large Peroni', label: 'Large Peroni', type: 'type 2' },
  { value: 'Large Nastro', label: 'Large Nastro', type: 'type 2' },
  { value: 'Absolut Vodka', label: 'Absolut Vodka', type: 'type 2' },
  { value: 'Pampero Rum', label: 'Pampero Rum (dark)', type: 'type 2' },
  { value: 'Bacardi Rum', label: 'Bacardi (light) rum', type: 'type 2' },
  { value: 'Beefeater (Gin)', label: 'Beefeater (Gin)', type: 'type 2' },
  { value: 'Whiskey', label: 'Johnnie Walker Whiskey', type: 'type 2' },
];

export const evDrinkTimes: string[] = [
  '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45',
  '20:00', '20:15', '20:30',
];
