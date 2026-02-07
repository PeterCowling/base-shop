// src/types/components/AutoComplete.ts
import type React from "react";

export interface AutoCompleteProps {
  /** An optional id for the input (helps with label accessibility) */
  id?: string;
  /** Label for the input field */
  label?: string;
  /** The current value of the input (controlled by parent) */
  value?: string;
  /** Callback when a value is committed */
  onChange: (value: string) => void;
  /** Array of suggestions for autocomplete */
  suggestions?: string[];
  /** Placeholder text for the input */
  placeholder?: string;
  /** z-index for the suggestion dropdown */
  zIndex?: number;
  /** Custom CSS classes for the input element */
  inputClassName?: string;
  /** Optional blur handler (e.g., to trigger a save or validation on blur) */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Optional keydown handler */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}
