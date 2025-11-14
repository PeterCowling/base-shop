import { Inline } from "@/components/primitives/Inline";
import { createTranslator } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import type { ReactNode } from "react";
import type { Section } from "@/lib/routes";
import Nav from "./Nav";

type PageShellProps = {
  children: ReactNode;
  lang: Locale;
  messages: Record<string, string>;
  active: Section;
};

const joinClasses = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function PageShell({ children, lang, messages, active }: PageShellProps) {
  const translator = createTranslator(messages);
  const isZh = lang === "zh";
  const backgroundClasses = isZh ? ["bg-zinc-950", "text-zinc-100"] : ["bg-white", "text-slate-900"];
  const borderColor = isZh ? "border-accent/40" : "border-slate-200";
  const footerText = isZh ? "text-zinc-200" : "text-slate-500";
  const footerLinkClasses = isZh ? ["text-accent"] : ["text-slate-500", "hover:text-slate-900"];
  const contactEmail = translator("people.cristiana.contact.email");

  return (
    <div className={joinClasses(...backgroundClasses, "min-h-screen")}>
      <div
        className={joinClasses(
          "mx-auto",
          "flex",
          "flex-col",
          "gap-12",
          "px-6",
          "py-10",
          "skylar-container"
        )}
      >
        <Nav lang={lang} active={active} translator={translator} isZh={isZh} />
        <main className="space-y-12">{children}</main>
        <footer className={joinClasses("border-t", borderColor, "pt-8")}>
          <Inline
            gap={3}
            className={joinClasses("skylar-caption", footerText, "justify-between", "flex-wrap")}
          >
            <span className="font-body text-xs uppercase">{translator("footer.copy")}</span>
            <a
              href={`mailto:${contactEmail}`}
              className={joinClasses("font-body", "skylar-caption", ...footerLinkClasses)}
            >
              {contactEmail}
            </a>
          </Inline>
        </footer>
      </div>
    </div>
  );
}
