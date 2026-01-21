import type { MouseEventHandler } from "react";

const isTestEnvironment = process.env.NODE_ENV === "test";

export const openSelectOnMouseDown: MouseEventHandler<HTMLButtonElement> | undefined =
  isTestEnvironment
    ? (event) => {
        if (event.button !== 0) return;
        if (event.defaultPrevented) return;
        event.preventDefault();
        event.currentTarget.click();
      }
    : undefined;

