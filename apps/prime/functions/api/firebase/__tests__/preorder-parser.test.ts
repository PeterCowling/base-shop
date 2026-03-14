/**
 * @jest-environment node
 */

import { parseBreakfastOrderString, parseEvDrinkOrderString } from '../preorder-parser';

describe('parseBreakfastOrderString', () => {
  it('TC-P01: Eggs order with sides — kds food item + individual bds side items + bds drink item', () => {
    const result = parseBreakfastOrderString(
      'Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00',
    );
    expect(result.preorderTime).toBe('09:00');
    expect(result.items).toEqual([
      { product: 'Eggs (Scrambled)', count: 1, lineType: 'kds', price: 0 },
      { product: 'Bacon', count: 1, lineType: 'bds', price: 0 },
      { product: 'Ham', count: 1, lineType: 'bds', price: 0 },
      { product: 'Toast', count: 1, lineType: 'bds', price: 0 },
      { product: 'Americano, Oat Milk, No Sugar', count: 1, lineType: 'bds', price: 0 },
    ]);
  });

  it('TC-P02: Pancakes order (no sides segment) — kds food item + bds drink item', () => {
    const result = parseBreakfastOrderString(
      'Pancakes (Nutella Chocolate Sauce) | Green Tea | 08:30',
    );
    expect(result.preorderTime).toBe('08:30');
    expect(result.items).toEqual([
      { product: 'Pancakes (Nutella Chocolate Sauce)', count: 1, lineType: 'kds', price: 0 },
      { product: 'Green Tea', count: 1, lineType: 'bds', price: 0 },
    ]);
  });

  it('TC-P03: Non-Eggs food (Veggie Toast) — kds food item + bds drink item', () => {
    const result = parseBreakfastOrderString(
      'Veggie Toast | Orange Juice (from the carton) | 10:00',
    );
    expect(result.preorderTime).toBe('10:00');
    expect(result.items).toEqual([
      { product: 'Veggie Toast', count: 1, lineType: 'kds', price: 0 },
      { product: 'Orange Juice (from the carton)', count: 1, lineType: 'bds', price: 0 },
    ]);
  });

  it('TC-P06: empty string input — console.warn called + fallback returned', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = parseBreakfastOrderString('');
    expect(result.preorderTime).toBe('00:00');
    expect(result.items).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('TC-P07: value with no time segment — console.warn called + fallback preorderTime', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = parseBreakfastOrderString('Eggs (Scrambled) | Bacon | Americano');
    expect(result.preorderTime).toBe('00:00');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('handles Eggs with a single side', () => {
    const result = parseBreakfastOrderString(
      'Eggs (Over-easy) | Toast | Americano, No Milk, No Sugar | 08:00',
    );
    expect(result.preorderTime).toBe('08:00');
    expect(result.items).toEqual([
      { product: 'Eggs (Over-easy)', count: 1, lineType: 'kds', price: 0 },
      { product: 'Toast', count: 1, lineType: 'bds', price: 0 },
      { product: 'Americano, No Milk, No Sugar', count: 1, lineType: 'bds', price: 0 },
    ]);
  });

  it('handles Pancakes with Homemade Golden Syrup', () => {
    const result = parseBreakfastOrderString(
      'Pancakes (Homemade Golden Syrup) | Americano, Oat Milk, No Sugar | 09:30',
    );
    expect(result.preorderTime).toBe('09:30');
    expect(result.items).toEqual([
      { product: 'Pancakes (Homemade Golden Syrup)', count: 1, lineType: 'kds', price: 0 },
      { product: 'Americano, Oat Milk, No Sugar', count: 1, lineType: 'bds', price: 0 },
    ]);
  });

  it('all items have price 0 and count 1', () => {
    const result = parseBreakfastOrderString(
      'Eggs (Scrambled) | Bacon, Ham | Americano | 09:00',
    );
    for (const item of result.items) {
      expect(item.price).toBe(0);
      expect(item.count).toBe(1);
    }
  });
});

describe('parseEvDrinkOrderString', () => {
  it('TC-P04: evening drink without modifiers — single bds item', () => {
    const result = parseEvDrinkOrderString('Aperol Spritz | 19:30');
    expect(result.preorderTime).toBe('19:30');
    expect(result.items).toEqual([
      { product: 'Aperol Spritz', count: 1, lineType: 'bds', price: 0 },
    ]);
  });

  it('TC-P04 (with modifiers): evening drink with modifiers — single bds item (full string)', () => {
    const result = parseEvDrinkOrderString('Americano, With Milk, With Sugar | 19:00');
    expect(result.preorderTime).toBe('19:00');
    expect(result.items).toEqual([
      { product: 'Americano, With Milk, With Sugar', count: 1, lineType: 'bds', price: 0 },
    ]);
  });

  it('TC-P05: evening drink without modifiers (Iced Latte)', () => {
    const result = parseEvDrinkOrderString('Iced Latte | 20:00');
    expect(result.preorderTime).toBe('20:00');
    expect(result.items).toEqual([
      { product: 'Iced Latte', count: 1, lineType: 'bds', price: 0 },
    ]);
  });

  it('handles Iced Latte with Sweetened modifier', () => {
    const result = parseEvDrinkOrderString('Iced Latte, Sweetened | 19:00');
    expect(result.preorderTime).toBe('19:00');
    expect(result.items).toEqual([
      { product: 'Iced Latte, Sweetened', count: 1, lineType: 'bds', price: 0 },
    ]);
  });

  it('TC-P06: empty string input — console.warn + fallback', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = parseEvDrinkOrderString('');
    expect(result.preorderTime).toBe('00:00');
    expect(result.items).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('TC-P07: no time segment — console.warn + fallback preorderTime', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = parseEvDrinkOrderString('Aperol Spritz');
    // Single segment — no time detected, fallback
    expect(result.preorderTime).toBe('00:00');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('all items have price 0, count 1, lineType bds', () => {
    const result = parseEvDrinkOrderString('Americano, With Milk | 19:30');
    for (const item of result.items) {
      expect(item.price).toBe(0);
      expect(item.count).toBe(1);
      expect(item.lineType).toBe('bds');
    }
  });
});
