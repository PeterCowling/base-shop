"use client";

import type { PageComponent } from "@acme/types";

import ImageAspectToolbar from "./ImageAspectToolbar";
import ImageCropOverlay from "./ImageCropOverlay";
import ImageFocalOverlay from "./ImageFocalOverlay";
import type { Action } from "./state";

type Props = {
  enabled: boolean;
  component: PageComponent;
  dispatch: React.Dispatch<Action>;
};

export default function ImageEditingOverlays({ enabled, component, dispatch }: Props) {
  if (!enabled || component.type !== "Image") return null;
  // Narrow known fields without using `any` to satisfy linting while keeping flexibility from augmented types
  const c = component as unknown as {
    id: string;
    focalPoint?: { x: number; y: number };
    cropAspect?: string;
  };
  return (
    <>
      <ImageFocalOverlay
        value={c.focalPoint}
        visible={true}
        onChange={(fp) => dispatch({ type: "update", id: c.id, patch: { focalPoint: fp } })}
      />
      <ImageAspectToolbar
        value={c.cropAspect}
        onChange={(next) => dispatch({ type: "update", id: c.id, patch: { cropAspect: next } })}
      />
      <ImageCropOverlay
        value={c.cropAspect}
        visible={true}
        onChange={(next) => dispatch({ type: "update", id: c.id, patch: { cropAspect: next } })}
      />
    </>
  );
}
