// src/components/guides/TransportNotice.tsx
import { type ComponentProps, type ComponentPropsWithoutRef, memo } from "react";
import * as I18n from "react-i18next";
import clsx from "clsx";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { guideHref } from "@/routes.guides-helpers";

type TransComponentProps = ComponentProps<(typeof I18n)["Trans"]>;

const LINK_CLASS_NAME = clsx(
  "inline-flex",
  "min-h-10",
  "items-center",
  "px-2",
  "-mx-2",
  "py-1",
  "-my-1",
  "rounded-sm",
  "text-brand-primary",
  "underline",
  "underline-offset-4",
  "transition-colors",
  "hover:text-brand-primary/80",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-brand-primary",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-transparent"
);

type TransLinkProps = ComponentPropsWithoutRef<"a">;
type TransComponents = NonNullable<TransComponentProps["components"]>;

function TransLink({ children, className, ...props }: TransLinkProps): JSX.Element {
  return (
    <a className={className} {...props}>
      {children}
    </a>
  );
}

type NoticeItemKey = "buses" | "trains" | "ferries" | "airlink" | "driving";

type NoticeItem = {
  key: NoticeItemKey;
  components?: TransComponents;
};

type Props = {
  className?: string;
};

function TransportNotice({ className = "" }: Props): JSX.Element {
  const lang = useCurrentLanguage();
  // Some tests mock useTranslation() without providing a return value for
  // every call site. Avoid destructuring from undefined by falling back to
  // a minimal translator that returns defaultValue or the key.
  const translationHook = I18n.useTranslation("guides", { useSuspense: false }) as
    | { t?: (key: string, options?: Record<string, unknown>) => unknown }
    | undefined;
  const t =
    typeof translationHook?.t === "function"
      ? translationHook.t
      : (key: string, options?: Record<string, unknown>) =>
          (options && Object.prototype.hasOwnProperty.call(options, "defaultValue")
            ? (options as { defaultValue?: unknown }).defaultValue
            : key);

  const srLabelRaw = t("transportNotice.srLabel", { lng: lang });
  const srLabel = typeof srLabelRaw === "string" ? srLabelRaw : "";

  const titleRaw = t("transportNotice.title", { lng: lang });
  const titleText = typeof titleRaw === "string" ? titleRaw : "transportNotice.title";

  const noticeItems: ReadonlyArray<NoticeItem> = [
    {
      key: "buses",
      components: {
        sitaLink: (
          <TransLink
            className={LINK_CLASS_NAME}
            href="https://www.sitasudtrasporti.it"
            rel="nofollow noopener noreferrer"
            target="_blank"
          />
        ),
        curreriLink: (
          <TransLink
            className={LINK_CLASS_NAME}
            href="https://www.curreriviaggi.it/en/naples-airport-shuttle"
            rel="nofollow noopener noreferrer"
            target="_blank"
          />
        ),
      } satisfies TransComponents,
    },
    {
      key: "trains",
      components: {
        eavLink: (
          <TransLink
            className={LINK_CLASS_NAME}
            href="https://www.eavsrl.it/orari-linee-ferroviarie/"
            rel="nofollow noopener noreferrer"
            target="_blank"
          />
        ),
        trenitaliaLink: (
          <TransLink
            className={LINK_CLASS_NAME}
            href="https://www.trenitalia.com/en.html"
            rel="nofollow noopener noreferrer"
            target="_blank"
          />
        ),
      } satisfies TransComponents,
    },
    {
      key: "ferries",
      components: {
        travelmarLink: (
          <TransLink
            className={LINK_CLASS_NAME}
            href="https://www.travelmar.it"
            rel="noopener noreferrer"
            target="_blank"
          />
        ),
        nlgLink: (
          <TransLink
            className={LINK_CLASS_NAME}
            href="https://www.navlib.it"
            rel="noopener noreferrer"
            target="_blank"
          />
        ),
        positanoJetLink: (
          <TransLink
            className={LINK_CLASS_NAME}
            href="https://www.positanojet.com"
            rel="noopener noreferrer"
            target="_blank"
          />
        ),
        alicostLink: (
          <TransLink
            className={LINK_CLASS_NAME}
            href="https://www.alicost.it"
            rel="noopener noreferrer"
            target="_blank"
          />
        ),
      } satisfies TransComponents,
    },
    {
      key: "airlink",
      components: {
        airlinkLink: (
          <TransLink
            className={LINK_CLASS_NAME}
            href="https://www.fsbusitalia.it/it/turismo/servizi-speciali/collegamento-aeroporto-costa-amalfi.html"
            rel="noopener noreferrer"
            target="_blank"
          />
        ),
      } satisfies TransComponents,
    },
    {
      key: "driving",
      components: {
        arrivingByCarLink: <TransLink className={LINK_CLASS_NAME} href={guideHref(lang, "parking")} />,
      } satisfies TransComponents,
    },
  ];

  return (
    <aside
      aria-label={srLabel || undefined}
      className={clsx(
        "my-4",
        "rounded-md",
        "border",
        "border-brand-primary/40",
        "bg-brand-primary/10",
        "p-4",
        "text-sm",
        "text-brand-text",
        "dark:border-brand-primary/60",
        "dark:bg-brand-primary/20",
        "dark:text-brand-text",
      className
      )}
    >
      <p className="font-medium">{titleText}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {noticeItems.map(({ key, components }) => {
          // Some tests mock `react-i18next` without exporting `Trans`.
          // Vitest's module mock throws on missing named exports when accessed.
          // Guard the access to avoid an exception and fall back to plain text.
          type TransComponentType = (typeof I18n)["Trans"];
          let TransComponent: TransComponentType | undefined;
          try {
            TransComponent = (I18n as { Trans?: TransComponentType }).Trans;
          } catch {
            TransComponent = undefined;
          }

          if (TransComponent) {
            const baseProps = {
              ns: "guides",
              i18nKey: `transportNotice.items.${key}`,
              tOptions: { lng: lang },
            };
            return (
              <li key={key}>
                {components ? (
                  <TransComponent
                    {...baseProps}
                    components={components}
                  />
                ) : (
                  <TransComponent {...baseProps} />
                )}
              </li>
            );
          }

          const fallbackRaw = t(`transportNotice.items.${key}`, {
            lng: lang,
            defaultValue: key,
          });
          const fallback = typeof fallbackRaw === "string" ? fallbackRaw : key;

          return <li key={key}>{fallback}</li>;
        })}
      </ul>
    </aside>
  );
}

export default memo(TransportNotice);
