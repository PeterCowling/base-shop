import type { PageComponent } from "@acme/types";
import type useBlockDimensions from "../../useBlockDimensions";
import type { Action } from "../../state";

export type Viewport = "desktop" | "tablet" | "mobile";

export type UpdateComponent = (patch: Partial<PageComponent>) => void;

export type ResizePayload = Record<string, string | undefined>;

export type HandleResize = (payload: ResizePayload) => void;

export type HandleFieldInput = <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;

export type BlockDimensions = ReturnType<typeof useBlockDimensions>;

export type PageBuilderDispatch = (action: Action) => void;
