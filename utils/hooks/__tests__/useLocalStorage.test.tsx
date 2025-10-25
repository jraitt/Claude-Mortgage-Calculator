import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

const STORAGE_KEY = 'test-key';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns initial value when localStorage empty', () => {
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, 'default'));

    expect(result.current[0]).toBe('default');
  });

  it('hydrates state from existing localStorage value', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ hello: 'world' }));

    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, {}));

    expect(result.current[0]).toEqual({ hello: 'world' });
  });

  it('persists updates back to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, 0));

    act(() => {
      result.current[1](42);
    });

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')).toBe(42);
  });
});
