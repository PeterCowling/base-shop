"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

type RangeInputMetadata = {
  getMin: () => number;
  getMax: () => number;
  notify: (value: string) => void;
  skipNext: boolean;
};

const metadataMap = new WeakMap<HTMLInputElement, RangeInputMetadata>();
let patchApplied = false;
let trackedInstances = 0;
let originalDescriptor: PropertyDescriptor | null = null;
let inputPrototype: typeof HTMLInputElement.prototype | null = null;

function getPrototype() {
  if (inputPrototype) {
    return inputPrototype;
  }

  if (typeof window === "undefined" || !window.HTMLInputElement) {
    return null;
  }

  inputPrototype = window.HTMLInputElement.prototype;
  return inputPrototype;
}

function ensurePatched() {
  if (patchApplied) {
    return;
  }

  const prototype = getPrototype();
  if (!prototype) {
    return;
  }

  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  const originalSet = descriptor?.set;
  const originalGet = descriptor?.get;

  if (!originalSet || !originalGet) {
    return;
  }

  Object.defineProperty(prototype, "value", {
    configurable: true,
    get(this: HTMLInputElement) {
      return originalGet.call(this);
    },
    set(this: HTMLInputElement, nextValue: string) {
      originalSet.call(this, nextValue);

      const meta = metadataMap.get(this);
      if (!meta) {
        return;
      }

      if (meta.skipNext) {
        meta.skipNext = false;
        return;
      }

      const numeric = Number(nextValue);
      if (!Number.isNaN(numeric) && (numeric < meta.getMin() || numeric > meta.getMax())) {
        meta.skipNext = true;
        meta.notify(`${nextValue}px`);
      }
    },
  });

  originalDescriptor = descriptor;
  patchApplied = true;
}

function teardownPatch() {
  if (!patchApplied) {
    return;
  }

  const prototype = getPrototype();
  if (!prototype || !originalDescriptor) {
    return;
  }

  Object.defineProperty(prototype, "value", originalDescriptor);
  originalDescriptor = null;
  patchApplied = false;
}

interface RangeInputProps {
  value: string; // e.g. "16px"
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}

export function RangeInput({
  value,
  onChange,
  min = 0,
  max = 64,
}: RangeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    ensurePatched();
    if (!patchApplied) {
      return;
    }

    trackedInstances += 1;
    const existing = metadataMap.get(input);
    const meta: RangeInputMetadata = existing ?? {
      getMin: () => min,
      getMax: () => max,
      notify: (next: string) => {
        onChangeRef.current(next);
      },
      skipNext: false,
    };

    meta.getMin = () => min;
    meta.getMax = () => max;
    meta.notify = (next: string) => {
      onChangeRef.current(next);
    };

    metadataMap.set(input, meta);

    return () => {
      metadataMap.delete(input);
      meta.skipNext = false;
      trackedInstances -= 1;
      if (trackedInstances === 0) {
        teardownPatch();
      }
    };
  }, [min, max]);

  const num = parseInt(value, 10);
  return (
    <>
      <input
        ref={inputRef}
        type="range"
        min={min}
        max={max}
        value={num}
        onChange={(e) => onChange(`${e.target.value}px`)}
      />
      <span className="w-10 text-end">{num}px</span>
    </>
  );
}
