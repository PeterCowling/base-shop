/**
 * Polyfill `HTMLFormElement#requestSubmit` for the JSDOM environment used by Jest.
 *
 * JSDOM 20 (bundled with Jest 29) has not yet implemented this API, so clicking
 * a submit button throws a "not implemented" error instead of dispatching the
 * form's submit event. Providing a lightweight shim keeps tests aligned with
 * real browser behaviour.
 */
function applyFormRequestSubmitPolyfill() {
  if (
    typeof HTMLFormElement === "undefined" ||
    typeof document === "undefined"
  ) {
    return;
  }

  type HtmlFormPrototypeWithRequestSubmit = HTMLFormElement & {
    requestSubmit?: unknown;
  } & Record<symbol, unknown>;

  const htmlFormPrototype = HTMLFormElement.prototype as HtmlFormPrototypeWithRequestSubmit;

  const hasNativeRequestSubmit =
    typeof htmlFormPrototype.requestSubmit === "function";
  const isJSDOM =
    typeof navigator !== "undefined" &&
    typeof navigator.userAgent === "string" &&
    navigator.userAgent.toLowerCase().includes("jsdom");

  if (hasNativeRequestSubmit && !isJSDOM) {
    return;
  }

  const appliedMarker = Symbol.for("form-request-submit-polyfill");
  if (htmlFormPrototype[appliedMarker]) {
    return;
  }

  const sampleForm = document.createElement("form");
  const implSymbol = Object.getOwnPropertySymbols(sampleForm).find(
    (symbol) => symbol.toString() === "Symbol(impl)",
  );

  const formImpl = implSymbol
    ? (sampleForm as HTMLFormElement & Record<symbol, unknown>)[implSymbol]
    : undefined;
  const wrapperSymbol = formImpl
    ? Object.getOwnPropertySymbols(formImpl).find(
        (symbol) => symbol.toString() === "Symbol(wrapper)",
      )
    : undefined;
  const formImplProto = formImpl
    ? Object.getPrototypeOf(formImpl as object)
    : undefined;

  const normalizeSubmitter = (value: unknown): HTMLElement | undefined => {
    if (!value) {
      return undefined;
    }
    if (value instanceof HTMLElement) {
      return value;
    }
    if (
      wrapperSymbol &&
      typeof value === "object" &&
      value !== null &&
      wrapperSymbol in (value as object)
    ) {
      const wrapperCandidate = (value as Record<symbol, unknown>)[
        wrapperSymbol
      ];
      if (wrapperCandidate instanceof HTMLElement) {
        return wrapperCandidate;
      }
    }
    return undefined;
  };

  const findSubmitter = (form: HTMLFormElement): HTMLElement | undefined => {
    const candidates = Array.from(form.elements) as HTMLElement[];
    for (const candidate of candidates) {
      const elementType =
        "type" in candidate && typeof (candidate as HTMLButtonElement).type === "string"
          ? (candidate as HTMLButtonElement).type
          : candidate.getAttribute?.("type") ?? "";
      const normalizedType = elementType.toLowerCase();
      const isButton = candidate instanceof HTMLButtonElement;
      const isInput = candidate instanceof HTMLInputElement;

      if (isButton || isInput) {
        const isSubmitType =
          normalizedType === "" ||
          normalizedType === "submit" ||
          normalizedType === "image";
        const disabled =
          "disabled" in candidate &&
          Boolean((candidate as HTMLButtonElement).disabled);

        if (isSubmitType && !disabled) {
          return candidate;
        }
      }
    }
    return undefined;
  };

  const createSubmitEvent = (
    form: HTMLFormElement,
    submitter?: HTMLElement,
  ): SubmitEvent => {
    if (typeof SubmitEvent === "function") {
      return new SubmitEvent("submit", {
        bubbles: true,
        cancelable: true,
        submitter,
      });
    }

    type SubmitEventLike = Event & { submitter?: HTMLElement };

    const event = new Event("submit", {
      bubbles: true,
      cancelable: true,
    }) as SubmitEventLike;

    if (submitter && !event.submitter) {
      Object.defineProperty(event, "submitter", {
        configurable: true,
        enumerable: false,
        value: submitter,
      });
    }
    return event as SubmitEvent;
  };

  const triggerSubmit = (
    form: HTMLFormElement,
    submitter?: HTMLElement,
  ): void => {
    if (!form || !form.ownerDocument) {
      return;
    }

    const normalizedSubmitter = normalizeSubmitter(submitter);

    if (
      normalizedSubmitter &&
      ((normalizedSubmitter as HTMLElement & { form?: HTMLFormElement | null }).form ?? null) !== form
    ) {
      if (typeof DOMException === "function") {
        throw new DOMException(
          // i18n-exempt -- TEST-000 [ttl=2026-12-31] polyfill error message mirrors DOM NotFoundError text
          "The specified element is not owned by this form element",
          "NotFoundError",
        );
      }
      throw new Error(
        // i18n-exempt -- TEST-000 [ttl=2026-12-31] polyfill error message mirrors DOM NotFoundError text
        "The specified element is not owned by this form element",
      );
    }

    if (
      !form.hasAttribute("novalidate") &&
      typeof form.reportValidity === "function" &&
      !form.reportValidity()
    ) {
      return;
    }

    const submitterOrDefault =
      normalizedSubmitter ?? findSubmitter(form);
    const submitEvent = createSubmitEvent(form, submitterOrDefault);
    const shouldContinue = form.dispatchEvent(submitEvent);
    if (!shouldContinue) {
      return;
    }
  };

  HTMLFormElement.prototype.requestSubmit = function requestSubmit(
    this: HTMLFormElement,
    submitter?: HTMLElement,
  ) {
    triggerSubmit(this, normalizeSubmitter(submitter));
  };

  HTMLFormElement.prototype.submit = function submit(this: HTMLFormElement) {
    triggerSubmit(this);
  };

  if (formImplProto) {
    const invokeOnWrapper = (
      impl: unknown,
      submitter?: HTMLElement,
    ): void => {
      if (!wrapperSymbol || !impl || !(wrapperSymbol in (impl as object))) {
        return;
      }
      const wrapper = (impl as Record<symbol, unknown>)[
        wrapperSymbol
      ] as HTMLFormElement | undefined;
      if (wrapper) {
        triggerSubmit(wrapper, submitter);
      }
    };

    type FormImplProto = {
      _doRequestSubmit?: (this: unknown, submitter?: HTMLElement) => void;
      requestSubmit?: (this: unknown, submitter?: HTMLElement) => void;
      submit?: (this: unknown, submitter?: HTMLElement) => void;
      [appliedMarker]?: boolean;
    };

    const protoWithMethods = formImplProto as FormImplProto;

    const patchImplMethod = (method: keyof FormImplProto) => {
      const original = protoWithMethods[method];
      if (typeof original === "function") {
        (protoWithMethods as Record<keyof FormImplProto, unknown>)[method] = function (
          this: unknown,
          submitter?: HTMLElement,
        ) {
          invokeOnWrapper(this, normalizeSubmitter(submitter));
        } as FormImplProto[typeof method];
      }
    };

    patchImplMethod("_doRequestSubmit");
    patchImplMethod("requestSubmit");
    patchImplMethod("submit");

    Object.defineProperty(formImplProto, appliedMarker, { value: true });
  }

  Object.defineProperty(HTMLFormElement.prototype, appliedMarker, {
    value: true,
  });
}

applyFormRequestSubmitPolyfill();

export { applyFormRequestSubmitPolyfill };
