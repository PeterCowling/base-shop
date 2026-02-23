// File: /src/hooks/data/bar/useProducts.ts

import { useCallback, useMemo } from "react";

import {
  type CategoryType,
  type ProductRow,
  type ProductsDataMap,
} from "../../../types/bar/BarTypes";

/**
 * useProducts
 * ------------------------------------------------------------------
 * Central in‑memory product catalogue (names, pricing, colours, etc.)
 *
 *     Coffee and tea items have been re‑tagged with sub‑category
 *     codes `"coffee"` and `"tea"` (instead of the generic `"bds"`).
 *     This allows `isCaffeinated()` in OrderTakingScreen to identify
 *     caffeinated products purely via sub‑category codes without
 *     falling back to brittle keyword checks.
 *
 *     • Milk add‑ons remain `"milkAddOn"`.
 *     • All other items keep their original codes.
 *
 *     ⚠️  When adding new menu items, choose an accurate sub‑category:
 *        ├─ Caffeinated coffee‑based  → "coffee"
 *        ├─ Caffeinated tea‑based     → "tea"
 *        ├─ Other caffeinated drinks  → "caffeinatedSoftDrink" | "energyDrink"
 *        ├─ Milk substitutes/add‑ons  → "milkAddOn"
 *        └─ Everything else           → legacy codes ("bds", "ksweet", …)
 * ------------------------------------------------------------------
 */
export function useProducts() {
  /* ---------------------------------------------------------------- */
  /* Top‑level category mapping                                       */
  /* ---------------------------------------------------------------- */
  const categoryIdToType: Record<number, CategoryType> = useMemo(
    () => ({
      1: "Sweet",
      2: "Savory",
      3: "Coffee",
      4: "Tea",
      5: "Beer",
      6: "Wine",
      7: "Spritz",
      8: "Mixed Drinks",
      9: "Cocktails",
      10: "Other",
      11: "Gelato",
      13: "Juices",
      14: "Smoothies",
      15: "Soda",
    }),
    []
  );

  /* ---------------------------------------------------------------- */
  /* Product data                                                     */
  /* ---------------------------------------------------------------- */
  const data: ProductsDataMap = useMemo<ProductsDataMap>(() => {
    return {
      /* --------------------------- 1 - SWEET -------------------------- */
      1: [
        ["PC Reg Syrup", "ksweet", 12.5, "bg-pinkShades-row1"],
        ["PC Nut", "ksweet", 12.5, "bg-pinkShades-row1"],
        ["PC Orange Syrup", "ksweet", 12.5, "bg-pinkShades-row1"],
        ["PC Lemon Syrup", "ksweet", 12.5, "bg-pinkShades-row1"],
        ["FT Regular", "ksweet", 12.5, "bg-pinkShades-row2"],
        ["FT Nutella", "ksweet", 14.0, "bg-pinkShades-row2"],
        ["Nutella", "ksweet", 1.5, "bg-pinkShades-row3"],
        ["Golden Syrup", "ksweet", 1.5, "bg-pinkShades-row3"],
        ["Lemon Syrup", "ksweet", 1.5, "bg-pinkShades-row3"],
        ["Orange Syrup", "ksweet", 1.5, "bg-pinkShades-row3"],
        ["Healthy Delight", "ksweet", 10.0, "bg-pinkShades-row4"],
        ["Chia Seed Pudding", "ksweet", 10.5, "bg-pinkShades-row4"],
      ],

      /* --------------------------- 2 - SAVORY ------------------------- */
      2: [
        ["Combo Scrambled", "ksavory", 3.5, "bg-greenShades-row1"],
        ["Combo SSU", "ksavory", 3.5, "bg-greenShades-row1"],
        ["Combo Overeasy", "ksavory", 3.5, "bg-greenShades-row1"],
        ["Combo Omlette", "ksavory", 3.5, "bg-greenShades-row1"],
        ["Hot Sauce", "ksavory", 0.0, "bg-greenShades-row1"],
        ["Toast", "ksavory", 3, "bg-greenShades-row2"],
        ["Tomatoes", "ksavory", 3, "bg-greenShades-row2"],
        ["Mushroom", "ksavory", 3, "bg-greenShades-row2"],
        ["Salame Milano", "ksavory", 3, "bg-greenShades-row2"],
        ["Bacon", "ksavory", 3, "bg-greenShades-row2"],
        ["Beans", "ksavory", 3, "bg-greenShades-row2"],
        ["Cheese", "ksavory", 3, "bg-greenShades-row2"],
        ["Ham", "ksavory", 3, "bg-greenShades-row2"],
        ["Scrambled", "ksavory", 3, "bg-greenShades-row3"],
        ["SSU", "ksavory", 3, "bg-greenShades-row3"],
        ["Overeasy", "ksavory", 3, "bg-greenShades-row3"],
        ["Omlette", "ksavory", 3, "bg-greenShades-row3"],
        ["Veggie Toast", "ksavory", 10.5, "bg-greenShades-row3"],
      ],

      /* --------------------------- 3 - COFFEE ------------------------- */
      3: [
        /* row 1 */
        ["Americano", "coffee", 3.0, "bg-coffeeShades-row1"],
        ["Cappuccino", "coffee", 3.5, "bg-coffeeShades-row1"],
        ["Latte", "coffee", 4.0, "bg-coffeeShades-row1"],
        ["Mocha", "coffee", 4.0, "bg-coffeeShades-row1"],
        /* row 2 */
        ["Espresso", "coffee", 2.0, "bg-coffeeShades-row2"],
        ["Double Espresso", "coffee", 4.0, "bg-coffeeShades-row2"],
        ["Cafe Macchiato", "coffee", 3.0, "bg-coffeeShades-row2"],
        /* row 3 - Iced */
        ["Iced Americano", "coffee", 5.0, "bg-coffeeShades-row3"],
        ["Iced Latte", "coffee", 5.0, "bg-coffeeShades-row3"],
        ["Iced Mocha", "coffee", 5.5, "bg-coffeeShades-row3"],
        /* milk add‑ons */
        ["Soy Milk", "milkAddOn", 1.5, "bg-coffeeShades-row2"],
        ["Rice Milk", "milkAddOn", 1.5, "bg-coffeeShades-row2"],
      ],

      /* ---------------------------- 4 - TEA --------------------------- */
      4: [
        ["Breakfast Tea", "tea", 3.0, "bg-teaShades-row1"],
        ["Herbal Tea", "tea", 3.0, "bg-teaShades-row1"],
        ["Green Tea", "tea", 3.0, "bg-teaShades-row1"],
        ["Iced Lemon Tea", "tea", 4.0, "bg-teaShades-row2"],
        /* milk add‑ons */
        ["Soy Milk", "milkAddOn", 1.5, "bg-teaShades-row2"],
        ["Rice Milk", "milkAddOn", 1.5, "bg-teaShades-row2"],
      ],

      /* ---------------------------- 5 - BEER -------------------------- */
      5: [
        ["Reg Nastro", "bds", 5.0, "bg-beerShades-row1"],
        ["Reg Peroni", "bds", 4.5, "bg-beerShades-row1"],
        ["Lg Nastro", "bds", 8.0, "bg-beerShades-row2"],
        ["Lg Peroni", "bds", 7.0, "bg-beerShades-row2"],
      ],

      /* ---------------------------- 6 - WINE -------------------------- */
      6: [
        ["White Glass", "bds", 5, "bg-wineShades-row1"],
        ["Red Glass", "bds", 5, "bg-wineShades-row1"],
        ["White Bottle 1", "bds", 20.0, "bg-wineShades-row2"],
        ["Red Bottle 1", "bds", 20.0, "bg-wineShades-row2"],
        ["Value White Glass", "bds", 3.5, "bg-wineShades-row3"],
        ["1/2 Litre Wine", "bds", 7.5, "bg-wineShades-row3"],
        ["1 Litre Wine", "bds", 12.5, "bg-wineShades-row3"],
        ["Prosecco Glass", "bds", 8.0, "bg-wineShades-row3"],
      ],

      /* --------------------------- 7 - SPRITZ ------------------------- */
      7: [
        ["Limoncello Spritz", "bds", 10.0, "bg-spritzShades-row1"],
        ["Mimosa", "bds", 8.0, "bg-spritzShades-row1"],
        ["Aperol Spritz", "bds", 10.0, "bg-spritzShades-row1"],
        ["Rossini", "bds", 11.0, "bg-spritzShades-row2"],
        ["Hugo Spritz", "bds", 10.0, "bg-spritzShades-row2"],
      ],

      /* ------------------------ 8 - MIXED DRINKS ---------------------- */
      8: [
        ["Limoncello", "bds", 5.5, "bg-blueShades-row1"],
        ["Beefeater Gin", "bds", 8.0, "bg-blueShades-row1"],
        ["Bombay Sapphire Gin", "bds", 10.0, "bg-blueShades-row1"],
        ["Tanqueray Gin", "bds", 10.0, "bg-blueShades-row1"],
        ["Hendricks Gin", "bds", 14.0, "bg-blueShades-row1"],
        ["Skyy Vodka", "bds", 8.0, "bg-blueShades-row2"],
        ["Absolut Vodka", "bds", 8.0, "bg-blueShades-row2"],
        ["Smirnoff Vodka", "bds", 10.0, "bg-blueShades-row2"],
        ["Grey Goose Vodka", "bds", 11.0, "bg-blueShades-row2"],
        ["Johnnie Walker", "bds", 8.0, "bg-blueShades-row3"],
        ["Jameson", "bds", 11.0, "bg-blueShades-row3"],
        ["Jack Daniel", "bds", 11.0, "bg-blueShades-row3"],
        ["Wild Turkey", "bds", 11.0, "bg-blueShades-row3"],
        ["Chivas Regal", "bds", 14.0, "bg-blueShades-row3"],
        ["Glenfidich", "bds", 18.0, "bg-blueShades-row3"],
        ["Jose Cuervo", "bds", 8.0, "bg-blueShades-row4"],
        ["Espolòn", "bds", 11.0, "bg-blueShades-row4"],
        ["Pampero", "bds", 8.0, "bg-blueShades-row4"],
        ["Bacardi Superior", "bds", 8.0, "bg-blueShades-row4"],
        ["Captain Morgan", "bds", 11.0, "bg-blueShades-row4"],
        ["Angostura Reserva", "bds", 12.5, "bg-blueShades-row4"],
        /* mixers (zero‑price) */
        ["Mixer Tonic Water", "bds", 0.0, "bg-blueShades-row5"],
        ["Mixer Soda Water", "bds", 0.0, "bg-blueShades-row5"],
        ["Mixer OJ Mix", "bds", 0.0, "bg-blueShades-row5"],
        ["Mixer Coke", "bds", 0.0, "bg-blueShades-row5"],
        ["Mixer Coke Zero", "bds", 0.0, "bg-blueShades-row5"],
        ["Mixer Sprite", "bds", 0.0, "bg-blueShades-row5"],
        ["Mixer Espresso", "bds", 0.0, "bg-blueShades-row5"],
      ],

      /* -------------------------- 9 - COCKTAILS ----------------------- */
      9: [
        ["Lemon Daiquiri", "bds", 10.0, "bg-purpleShades-row1"],
        ["Strawberry Daiquiri", "bds", 10.0, "bg-purpleShades-row1"],
        ["Lemon Margarita", "bds", 12.5, "bg-purpleShades-row1"],
        ["Strawberry Margarita", "bds", 12.5, "bg-purpleShades-row1"],
        ["Espresso Martini", "bds", 12.0, "bg-purpleShades-row1"],
        ["Lemon Drop Martini", "bds", 12.5, "bg-purpleShades-row1"],
        ["Frose", "bds", 11.0, "bg-purpleShades-row1"],
        ["Negroni", "bds", 10.0, "bg-purpleShades-row1"],
      ],

      /* -------------------------- 10 - OTHER -------------------------- */
      10: [
        ["Beach Towel", "bds", 2.0, "bg-grayishShades-row1"],
        ["Bath Towel", "bds", 2.0, "bg-grayishShades-row1"],
        ["Keycard Replacement", "bds", 10.0, "bg-grayishShades-row1"],
        ["Tues Food 7", "bds", 7, "bg-grayishShades-row1"],
        ["Tues Food 8", "bds", 8, "bg-grayishShades-row1"],
        ["MP", "bds", 18, "bg-grayishShades-row2"],
        ["MP +", "bds", 22, "bg-grayishShades-row2"],
        ["Snack 1", "bds", 1, "bg-grayishShades-row2"],
        ["Snack 2", "bds", 2, "bg-grayishShades-row2"],
        ["Snack 3", "bds", 3, "bg-grayishShades-row2"],
      ],

      /* -------------------------- 11 - GELATO ------------------------- */
      11: [
        ["Gelato 1 scoop", "bds", 2, "bg-grayishShades-row3"],
        ["Gelato 2 scoop", "bds", 3, "bg-grayishShades-row3"],
        ["Gelato 3 scoop", "bds", 3.5, "bg-grayishShades-row3"],
        ["Gelato Chocolate", "bds", 0, "bg-grayishShades-row3"],
        ["Gelato Nut", "bds", 0, "bg-grayishShades-row4"],
        ["Gelato Vanilla", "bds", 0, "bg-grayishShades-row4"],
        ["Gelato Lemon", "bds", 0, "bg-grayishShades-row4"],
      ],

      /* --------------------------- 13 - JUICES ------------------------ */
      13: [
        ["Carton OJ", "bds", 2.5, "bg-orangeShades-row1"],
        ["Carton Pineapple", "bds", 2.5, "bg-orangeShades-row1"],
        ["Fresh OJ", "kdrink", 4.5, "bg-orangeShades-row1"],
        ["Detox Me", "kdrink", 7.0, "bg-orangeShades-row1"],
        ["Energize Me", "kdrink", 7.0, "bg-orangeShades-row1"],
        ["Multi-V", "kdrink", 7.0, "bg-orangeShades-row1"],
      ],

      /* ------------------------- 14 - SMOOTHIES ----------------------- */
      14: [
        ["Ban + Straw Smoothie", "kdrink", 8.0, "bg-orangeShades-row2"],
        ["Banana Smoothie", "kdrink", 8.0, "bg-orangeShades-row2"],
        ["Strawberry Smoothie", "kdrink", 8.0, "bg-orangeShades-row2"],
        ["Spinach Smoothie", "kdrink", 8.0, "bg-orangeShades-row2"],
        ["Smoothie Soy Milk", "kdrink", 1.5, "bg-orangeShades-row2"],
        ["Smoothie Rice Milk", "kdrink", 1.5, "bg-orangeShades-row2"],
        ["Smoothie Protein", "kdrink", 3.0, "bg-orangeShades-row2"],
      ],

      /* --------------------------- 15 - SODA -------------------------- */
      15: [
        ["Coke", "bds", 3, "bg-orangeShades-row3"],
        ["Coke Zero", "bds", 3, "bg-orangeShades-row3"],
        ["Sprite", "bds", 3, "bg-orangeShades-row3"],
        ["Fanta", "bds", 3, "bg-orangeShades-row3"],
        ["Still Water", "bds", 2, "bg-orangeShades-row3"],
        ["Large Still Water", "bds", 4, "bg-orangeShades-row3"],
        ["Glass Sparkling Water", "bds", 1, "bg-orangeShades-row3"],
      ],
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* Helpers                                                          */
  /* ---------------------------------------------------------------- */
  const getProductCategory2 = useCallback(
    (description: string): string | null => {
      for (const key in data) {
        for (const product of data[key]) {
          if (product[0] === description) return product[1];
        }
      }
      return null;
    },
    [data]
  );

  const getCategoryTypeByProductName = useCallback(
    (productName: string): CategoryType | null => {
      for (const numericKey in data) {
        const num = parseInt(numericKey, 10);
        const rows = data[num];
        if (!rows) continue;
        for (const product of rows) {
          if (product[0] === productName) return categoryIdToType[num] || null;
        }
      }
      return null;
    },
    [data, categoryIdToType]
  );

  const getProductsByCategory = useCallback(
    (categoryId: number): ProductRow[] => data[categoryId] ?? [],
    [data]
  );

  const allProducts = useMemo(() => {
    const products: {
      name: string;
      price: number;
      categoryType: CategoryType | null;
    }[] = [];
    for (const numericKey in data) {
      const num = parseInt(numericKey, 10);
      const rows = data[num] ?? [];
      const categoryType = categoryIdToType[num] ?? null;
      rows.forEach((row) => {
        products.push({
          name: row[0],
          price: row[2],
          categoryType,
        });
      });
    }
    return products;
  }, [data, categoryIdToType]);

  return {
    getProductCategory2,
    getCategoryTypeByProductName,
    getProductsByCategory,
    allProducts,
  };
}

export default useProducts;
