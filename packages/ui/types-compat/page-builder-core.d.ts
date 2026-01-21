// Types-compat declarations for @acme/page-builder-core

declare module "@acme/page-builder-core" {
  export interface PageComponent {
    id: string;
    type: string;
    [k: string]: any;
  }

  export interface Page {
    id: string;
    slug: string;
    components: PageComponent[];
    [k: string]: any;
  }

  export interface EditorState {
    page: Page;
    selectedIds: string[];
    [k: string]: any;
  }

  export interface BlockDescriptor {
    type: string;
    [k: string]: any;
  }

  export type BlockTypeId = string;

  export interface TemplateDescriptor {
    id: string;
    name?: string;
    [k: string]: any;
  }

  export interface ExportedComponent {
    id: string;
    type: string;
    [k: string]: any;
  }

  export interface HistoryState {
    past: any[];
    present: any;
    future: any[];
    editor?: any;
    [k: string]: any;
  }

  export interface EditorFlags {
    [k: string]: any;
  }

  export const pageComponentSchema: any;
  export const validatePage: any;
  export const serializePage: any;
  export const coreBlockDescriptors: BlockDescriptor[];
  export const buildBlockRegistry: <T>(descriptors: BlockDescriptor[], entries?: any[]) => { registry: Record<string, T> };
  export const diffPage: any;
  export const exportComponents: any;
  export const historyStateSchema: any;
  export const commit: any;
  export const undo: any;
  export const redo: any;
  export const scaffoldPageFromTemplate: any;
}
