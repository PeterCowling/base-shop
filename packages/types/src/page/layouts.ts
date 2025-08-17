import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "./base";
import type { PageComponent } from "./page";

let pageComponentSchemaRef: z.ZodTypeAny;
export const bindPageComponentSchema = (schema: z.ZodTypeAny) => {
  pageComponentSchemaRef = schema;
};

export interface HeaderComponent extends PageComponentBase {
  type: "Header";
  nav?: { label: string; url: string }[];
  logo?: string;
}

export const headerComponentSchema = baseComponentSchema.extend({
  type: z.literal("Header"),
  nav: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  logo: z.string().optional(),
});

export interface FooterComponent extends PageComponentBase {
  type: "Footer";
  links?: { label: string; url: string }[];
  logo?: string;
}

export const footerComponentSchema = baseComponentSchema.extend({
  type: z.literal("Footer"),
  links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  logo: z.string().optional(),
});

export interface SectionComponent extends PageComponentBase {
  type: "Section";
  children?: PageComponent[];
}

export const sectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("Section"),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
});

export interface MultiColumnComponent extends PageComponentBase {
  type: "MultiColumn";
  columns?: number;
  gap?: string;
  children?: PageComponent[];
}

export const multiColumnComponentSchema = baseComponentSchema.extend({
  type: z.literal("MultiColumn"),
  columns: z.number().optional(),
  gap: z.string().optional(),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
});

export interface TabsComponent extends PageComponentBase {
  type: "Tabs";
  labels?: string[];
  active?: number;
  children?: PageComponent[];
}

export const tabsComponentSchema = baseComponentSchema.extend({
  type: z.literal("Tabs"),
  labels: z.array(z.string()).default([]),
  active: z.number().optional(),
  children: z.array(z.lazy(() => pageComponentSchemaRef)).default([]),
});

