import type { ComponentProps,CSSProperties } from "react";

import type { Locale } from "@acme/i18n/locales";
import type { TemplateDescriptor } from "@acme/page-builder-core";
import type { HistoryState,Page, PageComponent } from "@acme/types";

import type { ComponentType } from "./defaults";
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
  templates?: TemplateDescriptor[];
  shopId?: string | null;
  locale?: Locale;
  primaryLocale?: Locale;
  /** Optional allowlist of block types to expose in the palette (for system pages like checkout). */
  allowedBlockTypes?: ComponentType[];
  /** Optional runtime preview URL (tokenised) and source label */
  previewUrl?: string | null;
  previewSource?: string | null;
  publishedRevisionId?: string | null;
}

export type PageBuilderLayoutProps = ComponentProps<typeof PageBuilderLayout>;
