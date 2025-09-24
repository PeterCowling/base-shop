import type { CSSProperties, ComponentProps } from "react";
import type { Page, PageComponent, HistoryState } from "@acme/types";
import type PageBuilderLayout from "./PageBuilderLayout";

export interface PageBuilderProps {
  page: Page;
  history?: HistoryState;
  onSave: (fd: FormData) => Promise<unknown>;
  onPublish: (fd: FormData) => Promise<unknown>;
  saving?: boolean;
  publishing?: boolean;
  saveError?: string | null;
  publishError?: string | null;
  onChange?: (components: PageComponent[]) => void;
  style?: CSSProperties;
  presetsSourceUrl?: string;
  pagesNav?: { items: { label: string; value: string; href: string }[]; current: string };
  mode?: "page" | "section";
}

export type PageBuilderLayoutProps = ComponentProps<typeof PageBuilderLayout>;
