import { type ComponentPropsWithoutRef, type FC,memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

type TitlePartsResource = {
  before?: unknown;
  between?: unknown;
  home?: unknown;
};

function extractTitleParts(resource: unknown) {
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) {
    return null;
  }

  const { before, between, home } = resource as TitlePartsResource;
  const normalizedBefore = typeof before === "string" ? before.trim() : "";
  const normalizedBetween = typeof between === "string" ? between.trim() : "";
  const normalizedHome = typeof home === "string" ? home.trim() : "";

  if (!normalizedBefore || !normalizedHome) {
    return null;
  }

  return {
    before: normalizedBefore,
    between: normalizedBetween,
    home: normalizedHome,
  } as const;
}

type ContainerProps = ComponentPropsWithoutRef<"div">;
function Container({ className, ...props }: ContainerProps): JSX.Element {
  return (
    <div
      className={clsx("mx-auto", "w-full", "max-w-prose", "px-6", className)}
      {...props}
    />
  );
}

type StackProps = ComponentPropsWithoutRef<"div">;
function Stack({ className, ...props }: StackProps): JSX.Element {
  return <div className={clsx("flex", "flex-col", className)} {...props} />;
}

type InlineProps = ComponentPropsWithoutRef<"div">;
function Inline({ className, ...props }: InlineProps): JSX.Element {
  return <div className={clsx("flex", "items-center", className)} {...props} />;
}

type IntroTextBoxProps = {
  lang?: string;
  showTitle?: boolean;
  className?: string;
};

const IntroTextBox: FC<IntroTextBoxProps> = ({ lang, showTitle = true, className }) => {
  const { t, i18n, ready } = useTranslation("landingPage", { lng: lang });

  const rawTitle = t("introSection.title") as string;
  const activeLanguage = lang ?? i18n.language;
  const resource = i18n.getResource(activeLanguage, "landingPage", "introSection.titleParts");
  const titleParts = extractTitleParts(resource);

  const paragraphs = useMemo(() => {
    if (!ready) return [];
    return [
      { id: "p1", content: t("introSection.paragraph1") },
      { id: "p2", content: t("introSection.paragraph2") },
      { id: "p3", content: t("introSection.paragraph3") },
    ];
  }, [t, ready]);

  return (
    <section
      className={clsx(
        "bg-brand-surface",
        "py-12",
        "sm:py-14",
        "lg:py-16",
        "motion-safe:animate-fade-up",
        "dark:bg-brand-text",
        className
      )}
    >
      <Container>
        {showTitle ? (
          titleParts ? (
            <h2
              aria-label={rawTitle}
              className="mx-auto text-balance text-3xl font-extrabold tracking-tight text-brand-primary sm:text-4xl md:text-5xl"
            >
              <Inline className="justify-center gap-x-2 sm:gap-x-4">
                <Stack className="items-end text-end leading-none">
                  <span className="pe-1 sm:pe-2">{titleParts.before}</span>
                  <span className="pe-1 sm:pe-2">{titleParts.between}</span>
                </Stack>
                <span
                  className="self-center whitespace-nowrap text-5xl leading-none text-brand-bougainvillea sm:text-6xl md:text-7xl"
                  aria-hidden="true"
                >
                  {titleParts.home}
                </span>
              </Inline>
            </h2>
          ) : (
            <h2 className="text-balance text-center text-3xl font-extrabold tracking-tight text-brand-primary sm:text-4xl md:text-5xl">
              {rawTitle}
            </h2>
          )
        ) : null}

        <Stack
          className={clsx(
            "mx-auto",
            "gap-6",
            "text-center",
            showTitle ? ["mt-6", "sm:mt-8"] : "mt-0"
          )}
        >
          {paragraphs.map(({ id, content }) => (
            <p
              key={id}
              className="prose md:prose-lg prose-p:my-0 text-brand-text dark:text-brand-surface"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ))}
        </Stack>
      </Container>
    </section>
  );
};

export default memo(IntroTextBox);
export { IntroTextBox };
