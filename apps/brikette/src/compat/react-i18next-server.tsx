import React from "react";
import i18next, { type TFunction } from "i18next";

type UseTranslationOptions = {
  lng?: string;
};

type TransProps = {
  i18nKey?: string;
  ns?: string | string[];
  t?: TFunction;
  values?: Record<string, unknown>;
  components?: React.ReactNode[] | Record<string, React.ReactNode>;
  children?: React.ReactNode;
};

const resolveNamespace = (ns?: string | string[]) => (Array.isArray(ns) ? ns[0] : ns);

export const initReactI18next = {
  type: "3rdParty",
  init: () => {},
};

export const I18nextProvider = ({ children }: { children?: React.ReactNode }) => (
  <>{children ?? null}</>
);

export const useTranslation = (
  ns?: string | string[],
  options?: UseTranslationOptions,
): { t: TFunction; i18n: typeof i18next; ready: boolean } => {
  const lang = options?.lng ?? i18next.language;
  const namespace = resolveNamespace(ns);
  const t = i18next.getFixedT(lang, namespace);
  return { t, i18n: i18next, ready: true };
};

export const Trans = ({
  i18nKey,
  ns,
  t,
  values,
  children,
}: TransProps): React.ReactElement | null => {
  if (!i18nKey) return <>{children ?? null}</>;
  const namespace = resolveNamespace(ns);
  const translate = t ?? i18next.getFixedT(i18next.language, namespace);
  const text = translate(i18nKey, values ?? {}) as unknown as React.ReactNode;
  return <>{text ?? children ?? null}</>;
};
