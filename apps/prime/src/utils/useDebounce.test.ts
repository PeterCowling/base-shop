import "@testing-library/jest-dom";

import { act, renderHook } from '@testing-library/react';

import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('debounces value updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'first' } },
    );

    expect(result.current).toBe('first');

    // Update value
    rerender({ value: 'second' });

    // Value should not have changed yet
    expect(result.current).toBe('first');

    // Advance time by 299ms - still not changed
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('first');

    // Advance past the delay
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('second');
  });

  it('resets timer on rapid updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'c' });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Still 'a' because timer keeps resetting
    expect(result.current).toBe('a');

    // Complete the final delay
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('c');
  });

  it('uses default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'start' } },
    );

    rerender({ value: 'end' });

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('start');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('end');
  });

  it('works with different types', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: { count: 1 } } },
    );

    expect(result.current).toEqual({ count: 1 });

    rerender({ value: { count: 2 } });

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toEqual({ count: 2 });
  });
});
