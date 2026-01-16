import {
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { AutoCompleteProps } from "../../../types/component/autoComplete";

/**
 * A memoized AutoComplete component that:
 * - Filters suggestions based on user-typed text
 * - Shows a dropdown list of matches
 * - Calls `onChange(...)` on every input change
 * - Calls `onItemSelect(...)` if a user clicks or presses Enter on a suggestion
 * - Merges local "Enter-to-select" logic with parent-provided `onKeyDown`
 */
function AutoComplete({
  id,
  label,
  value = "",
  onChange,
  suggestions = [],
  placeholder = "",
  zIndex = 1000,
  inputClassName,
  onBlur,
  onKeyDown,
  onItemSelect,
}: AutoCompleteProps & {
  onItemSelect?: (val: string) => void;
}): JSX.Element {
  const [localValue, setLocalValue] = useState<string>(value);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dropdownStyle = useMemo(() => ({ top: "100%", zIndex }), [zIndex]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const userInput = e.target.value;
      setLocalValue(userInput);

      onChange(userInput);

      if (userInput.length > 0) {
        const filtered = suggestions.filter((item) =>
          item.toLowerCase().startsWith(userInput.toLowerCase())
        );
        setFilteredSuggestions(filtered);
        setIsOpen(filtered.length > 0);
      } else {
        setFilteredSuggestions([]);
        setIsOpen(false);
      }
    },
    [onChange, suggestions]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string): void => {
      setLocalValue(suggestion);
      onChange(suggestion);
      setIsOpen(false);

      if (onItemSelect) {
        onItemSelect(suggestion);
      }
    },
    [onChange, onItemSelect]
  );

  const createSuggestionClickHandler = useCallback(
    (suggestion: string) => () => handleSuggestionClick(suggestion),
    [handleSuggestionClick]
  );

  const createSuggestionKeyDownHandler = useCallback(
    (suggestion: string) =>
      (ev: KeyboardEvent<HTMLButtonElement>): void => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          handleSuggestionClick(suggestion);
        }
      },
    [handleSuggestionClick]
  );

  /**
   * Combined keyDown handler:
   * 1. Calls the parent-provided `onKeyDown`, if present.
   * 2. If parent did not prevent default, handle "Enter to select."
   */
  const combinedKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): void => {
      if (onKeyDown) {
        onKeyDown(e);
        if (e.defaultPrevented) return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredSuggestions.length > 0) {
          const first = filteredSuggestions[0];
          setLocalValue(first);
          onChange(first);
          setIsOpen(false);

          if (onItemSelect) {
            onItemSelect(first);
          }
        } else if (localValue.trim() !== "") {
          onChange(localValue.trim());
          setIsOpen(false);

          if (onItemSelect) {
            onItemSelect(localValue.trim());
          }
        }
      }
    },
    [filteredSuggestions, localValue, onChange, onItemSelect, onKeyDown]
  );

  /**
   * onBlur: pass the event through to the parent for validation,
   * then close the suggestions menu shortly thereafter.
   */
  const handleBlurInput = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(e);
      }
      // Delay closing so clicks on suggestion items can register
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      blurTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 200);
    },
    [onBlur]
  );

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block font-semibold text-gray-700 mb-1 dark:text-darkAccentGreen"
        >
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={combinedKeyDown}
        onBlur={handleBlurInput}
        placeholder={placeholder}
        className={
          inputClassName ||
          "w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
        }
      />

      {isOpen && filteredSuggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 max-h-52 overflow-y-auto border border-gray-400 bg-white list-none p-0 m-0 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
          style={dropdownStyle}
        >
          {filteredSuggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                data-suggestion-button="true"
                onClick={createSuggestionClickHandler(suggestion)}
                onKeyDown={createSuggestionKeyDownHandler(suggestion)}
                className="w-full text-left py-2 px-3 hover:bg-gray-100 focus:bg-gray-100"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default memo(AutoComplete);
