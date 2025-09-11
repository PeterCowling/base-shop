import { type ReactNode } from "react";
/**
 * Key–value map of translation messages.
 */
export type Messages = Record<string, ReactNode>;
/**
 * Props for {@link TranslationsProvider}.
 */
interface TranslationsProviderProps {
  readonly children: ReactNode;
  readonly messages: Messages;
}
/**
 * Provides translation messages to descendants via {@link TContext}.
 *
 * Memoises the incoming `messages` object to prevent unnecessary re-renders
 * when reference equality is stable between renders.
 */
declare function TranslationsProvider({
  children,
  messages,
}: TranslationsProviderProps): React.JSX.Element;
export { TranslationsProvider };
export default TranslationsProvider;
/**
 * Hook that returns a translation function.
 *
 * @returns A function that resolves a given key to its translated message, or
 *          the key itself if no translation exists.
 */
export declare function useTranslations(): (
  key: string,
  vars?: Record<string, ReactNode>
) => ReactNode;
