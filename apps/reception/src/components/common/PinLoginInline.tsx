import {
  type ChangeEvent,
  type KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface PinLoginInlineProps {
  onSubmit: (pin: string) => boolean | Promise<boolean>;
}

const PIN_LENGTH = 6 as const;

const PIN_BG_CLASSES: readonly string[] = [
  "bg-pink-300 focus:bg-pink-400",
  "bg-purple-300 focus:bg-purple-400",
  "bg-indigo-300 focus:bg-indigo-400",
  "bg-sky-300 focus:bg-sky-400",
  "bg-teal-300 focus:bg-teal-400",
  "bg-amber-300 focus:bg-amber-400",
];

const EMPTY_BG_CLASS = "bg-gray-200 focus:bg-gray-300";

export const PinLoginInline = memo(function PinLoginInline({
  onSubmit,
}: PinLoginInlineProps) {
  const [pin, setPin] = useState<string>(() => " ".repeat(PIN_LENGTH));
  const [showError, setShowError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const reset = useCallback(() => {
    setPin(" ".repeat(PIN_LENGTH));
    inputRefs.current[0]?.focus();
  }, []);

  const shakeInputs = useCallback(() => {
    inputRefs.current.forEach((input) => {
      if (!input) return;
      input.classList.add("animate-shake");
      const handleEnd = (): void => {
        input.classList.remove("animate-shake");
        input.removeEventListener("animationend", handleEnd);
      };
      input.addEventListener("animationend", handleEnd);
    });
  }, []);

  const validatePin = useCallback(
    async (candidate: string) => {
      const trimmed = candidate.replaceAll(" ", "");
      if (trimmed.length !== PIN_LENGTH) return;
      const ok = await onSubmit(trimmed);
      if (ok) {
        setShowError(false);
        reset();
      } else {
        setShowError(true);
        shakeInputs();
        reset();
      }
    },
    [onSubmit, reset, shakeInputs]
  );

  useEffect(() => {
    validatePin(pin);
  }, [pin, validatePin]);

  const changeDigit = useCallback((index: number, value: string): void => {
    if (!/^\d$/.test(value)) return;
    setPin((prev) => {
      const next = prev.split("");
      next[index] = value;
      if (index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      return next.join("");
    });
  }, []);

  const eraseDigit = useCallback((index: number): void => {
    setPin((prev) => {
      const next = prev.split("");
      next[index] = " ";
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      return next.join("");
    });
  }, []);

  const changeHandlers = useMemo(
    () =>
      Array.from({ length: PIN_LENGTH }, (_, i) => (e: ChangeEvent<HTMLInputElement>) => changeDigit(i, e.target.value)),
    [changeDigit]
  );

  const keyDownHandlers = useMemo(
    () =>
      Array.from({ length: PIN_LENGTH }, (_, i) => (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Backspace") {
          e.preventDefault();
          eraseDigit(i);
        }
      }),
    [eraseDigit]
  );

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-6 justify-center gap-4">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="done"
            maxLength={1}
            aria-label={`PIN digit ${i + 1}`}
            className={`aspect-square w-14 rounded-lg text-center text-3xl font-semibold text-gray-800 caret-transparent transition-transform duration-150 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:text-darkAccentGreen dark:focus:ring-offset-darkSurface ${pin[i] !== " " ? PIN_BG_CLASSES[i] : EMPTY_BG_CLASS}`}
            value={pin[i] === " " ? "" : pin[i]}
            onChange={changeHandlers[i]}
            onKeyDown={keyDownHandlers[i]}
          />
        ))}
      </div>
      {showError && (
        <p role="alert" className="mt-2 text-sm text-error-main">
          Invalid PIN
        </p>
      )}
    </div>
  );
});

export default PinLoginInline;
