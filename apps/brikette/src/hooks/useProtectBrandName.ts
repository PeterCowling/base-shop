/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
import { useEffect } from "react";

const BRAND_TEXT = "Hostel Brikette" as const;
const BRAND_TEXT_LOWER = BRAND_TEXT.toLowerCase();
const BRAND_DATA_VALUE = "hostel-brikette" as const;
const SKIP_WITHIN_SELECTOR = "script,style,noscript,code,pre,textarea";
const SKIP_ANCESTOR_SELECTOR = `[data-brand-name="${BRAND_DATA_VALUE}"],[translate="no"],.notranslate`;

/**
 * Ensures every visible occurrence of the brand name is wrapped in a
 * `translate="no"` span so browser auto-translation tools leave it intact.
 */
export function useProtectBrandName(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const doc = document;
    const MutationObserverImpl = (typeof MutationObserver !== "undefined"
      ? MutationObserver
      : undefined) as typeof MutationObserver | undefined;

    const wrapTextNode = (textNode: Text) => {
      const original = textNode.textContent;
      if (!original) return;

      const lower = original.toLowerCase();
      if (!lower.includes(BRAND_TEXT_LOWER)) return;

      const fragment = doc.createDocumentFragment();
      let cursor = 0;

      while (cursor < original.length) {
        const matchIndex = lower.indexOf(BRAND_TEXT_LOWER, cursor);
        if (matchIndex === -1) {
          fragment.appendChild(doc.createTextNode(original.slice(cursor)));
          break;
        }

        if (matchIndex > cursor) {
          fragment.appendChild(doc.createTextNode(original.slice(cursor, matchIndex)));
        }

        const brandSpan = doc.createElement("span");
        brandSpan.textContent = original.slice(matchIndex, matchIndex + BRAND_TEXT.length);
        brandSpan.setAttribute("translate", "no");
        brandSpan.setAttribute("lang", "en");
        brandSpan.classList.add("notranslate");
        brandSpan.dataset["brandName"] = BRAND_DATA_VALUE;
        fragment.appendChild(brandSpan);

        cursor = matchIndex + BRAND_TEXT.length;
      }

      textNode.replaceWith(fragment);
    };

    const protectBrandName = () => {
      const body = doc.body;
      if (!body) return;

      const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT;
          const parentElement = node.parentElement;
          if (!parentElement) return NodeFilter.FILTER_REJECT;
          if (parentElement.closest(SKIP_WITHIN_SELECTOR)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parentElement.closest(SKIP_ANCESTOR_SELECTOR)) {
            return NodeFilter.FILTER_REJECT;
          }
          const content = node.textContent;
          if (!content) return NodeFilter.FILTER_REJECT;
          return content.toLowerCase().includes(BRAND_TEXT_LOWER)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        },
      });

      const targets: Text[] = [];
      while (walker.nextNode()) {
        const current = walker.currentNode;
        if (current instanceof Text) {
          targets.push(current);
        }
      }

      if (targets.length === 0) return;

      targets.forEach(wrapTextNode);
    };

    protectBrandName();

    if (!MutationObserverImpl) return;

    let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
    let microtaskPending = false;

    const runProtection = () => {
      if (timeoutId !== undefined) {
        globalThis.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      microtaskPending = false;
      protectBrandName();
    };

    const scheduleProtect = () => {
      if (timeoutId !== undefined || microtaskPending) return;

      if (typeof queueMicrotask === "function") {
        microtaskPending = true;
        queueMicrotask(() => {
          if (!microtaskPending) return;
          runProtection();
        });
      }

      timeoutId = globalThis.setTimeout(() => {
        runProtection();
      }, 30);
    };

    const observer = new MutationObserverImpl(() => {
      scheduleProtect();
    });

    if (doc.body) {
      observer.observe(doc.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      observer.disconnect();
      if (timeoutId !== undefined) {
        globalThis.clearTimeout(timeoutId);
      }
      microtaskPending = false;
    };
  }, []);
}
