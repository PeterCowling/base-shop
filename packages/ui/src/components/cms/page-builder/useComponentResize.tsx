import { useCallback, useMemo } from "react";
import type { PageComponent } from "@acme/types";
import { Button, Input } from "../../atoms/shadcn";

export function useComponentResize(
  component: PageComponent,
  onResize: (patch: { [key: string]: string | undefined }) => void,
) {
  const handleResize = useCallback(
    (field: string, value: string | undefined) => {
      onResize({ [field]: value });
    },
    [onResize],
  );

  const viewportControls = useMemo(
    () =>
      (["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={vp} className="space-y-2">
          <div className="flex items-end gap-2">
            <Input
              label={`Width (${vp})`}
              placeholder="e.g. 100px or 50%"
              value={(component as any)[`width${vp}`] ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                handleResize(`width${vp}`, v || undefined);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleResize(`width${vp}`, "100%")}
            >
              Full width
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <Input
              label={`Height (${vp})`}
              placeholder="e.g. 1px or 1rem"
              value={(component as any)[`height${vp}`] ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                handleResize(`height${vp}`, v || undefined);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleResize(`height${vp}`, "100%")}
            >
              Full height
            </Button>
          </div>
          <Input
            label={`Margin (${vp})`}
            value={(component as any)[`margin${vp}`] ?? ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              handleResize(`margin${vp}`, v || undefined);
            }}
          />
          <Input
            label={`Padding (${vp})`}
            value={(component as any)[`padding${vp}`] ?? ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              handleResize(`padding${vp}`, v || undefined);
            }}
          />
        </div>
      )),
    [component, handleResize],
  );

  const absoluteControls = useMemo(() => {
    if (component.position !== "absolute") return null;
    return (
      <>
        <Input
          label="Top"
          value={component.top ?? ""}
          onChange={(e) => {
            const v = e.target.value.trim();
            handleResize("top", v || undefined);
          }}
        />
        <Input
          label="Left"
          value={component.left ?? ""}
          onChange={(e) => {
            const v = e.target.value.trim();
            handleResize("left", v || undefined);
          }}
        />
      </>
    );
  }, [component, handleResize]);

  return { viewportControls, absoluteControls };
}

