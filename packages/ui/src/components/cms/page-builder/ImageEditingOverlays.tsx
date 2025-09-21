"use client";

import ImageFocalOverlay from "./ImageFocalOverlay";
import ImageAspectToolbar from "./ImageAspectToolbar";
import ImageCropOverlay from "./ImageCropOverlay";
import type { PageComponent } from "@acme/types";
import type { Action } from "./state";

type Props = {
  enabled: boolean;
  component: PageComponent;
  dispatch: React.Dispatch<Action>;
};

export default function ImageEditingOverlays({ enabled, component, dispatch }: Props) {
  if (!enabled || component.type !== "Image") return null;
  return (
    <>
      <ImageFocalOverlay
        value={(component as any).focalPoint as any}
        visible={true}
        onChange={(fp) =>
          dispatch({ type: "update", id: component.id, patch: { focalPoint: fp } as any })
        }
      />
      <ImageAspectToolbar
        value={(component as any).cropAspect as any}
        onChange={(next) => dispatch({ type: "update", id: component.id, patch: { cropAspect: next } as any })}
      />
      <ImageCropOverlay
        value={(component as any).cropAspect as any}
        visible={true}
        onChange={(next) => dispatch({ type: "update", id: component.id, patch: { cropAspect: next } as any })}
      />
    </>
  );
}

