import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Input } from "@acme/design-system";
import { Grid } from "@acme/design-system/primitives";

interface PinInputProps {
  onChange: (pin: string) => void;
  placeholder?: string;
  /** Optional heading displayed above the PIN boxes */
  title?: string;
}

const PIN_LENGTH = 6 as const;

const PIN_BG_CLASSES: readonly string[] = [
  "bg-accent-soft focus:bg-pink-400",
  "bg-accent-soft focus:bg-purple-400",
  "bg-primary-light focus:bg-primary-soft",
  "bg-info-light focus:bg-sky-400",
  "bg-success-light focus:bg-teal-400",
  "bg-warning-light focus:bg-amber-400",
];

const EMPTY_BG_CLASS = "bg-surface-3 focus:bg-surface-3";

function PinInput({
  onChange,
  placeholder,
  title,
}: PinInputProps): JSX.Element {
  const [pin, setPin] = useState<string>(() => " ".repeat(PIN_LENGTH));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    onChange(pin.replaceAll(" ", ""));
  }, [pin, onChange]);

  const changeDigit = useCallback((index: number, value: string): void => {
    if (!/^\d$/.test(value)) return;

    setPin((prev) => {
      const next = prev.split("");
      next[index] = value;
      const joined = next.join("");

      if (index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      return joined;
    });
  }, []);

  const eraseDigit = useCallback((index: number): void => {
    setPin((prev) => {
      const next = prev.split("");
      next[index] = " ";
      const joined = next.join("");

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      return joined;
    });
  }, []);

  const changeHandlers = useMemo(
    () =>
      Array.from(
        { length: PIN_LENGTH },
        (_, i) =>
          (e: ChangeEvent<HTMLInputElement>): void =>
            changeDigit(i, e.target.value)
      ),
    [changeDigit]
  );

  const keyDownHandlers = useMemo(
    () =>
      Array.from(
        { length: PIN_LENGTH },
        (_, i) =>
          (e: KeyboardEvent<HTMLInputElement>): void => {
            if (e.key === "Backspace") {
              e.preventDefault();
              eraseDigit(i);
            }
          }
      ),
    [eraseDigit]
  );

  return (
    <div className="flex flex-col items-center">
      {title && (
        <h2 className="mb-2 text-xl font-semibold text-center">{title}</h2>
      )}
      <Grid cols={6} gap={4} className="justify-center">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <Input
            compatibilityMode="no-wrapper"
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="done"
            maxLength={1}
            placeholder={i === 0 ? placeholder : undefined}
            aria-label={`PIN digit ${i + 1}`}
            className={`aspect-square w-14 rounded-lg text-center text-3xl font-semibold text-foreground caret-transparent transition-transform duration-150 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-white ${
              pin[i] !== " " ? PIN_BG_CLASSES[i] : EMPTY_BG_CLASS
            }`}
            value={pin[i] === " " ? "" : pin[i]}
            onChange={changeHandlers[i]}
            onKeyDown={keyDownHandlers[i]}
          />
        ))}
      </Grid>
    </div>
  );
}

export default PinInput;
