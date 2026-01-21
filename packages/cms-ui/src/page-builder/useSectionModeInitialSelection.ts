import { useEffect } from "react";

import type { PageComponent } from "@acme/types";

interface Params {
  mode: "page" | "section";
  components: PageComponent[];
  setSelectedIds: (ids: string[]) => void;
}

const useSectionModeInitialSelection = ({ mode, components, setSelectedIds }: Params) => {
  useEffect(() => {
    if (mode !== "section") return;
    const firstSection = components.find((component) => component.type === "Section");
    if (firstSection) {
      setSelectedIds([firstSection.id]);
    }
  }, [mode, components, setSelectedIds]);
};

export default useSectionModeInitialSelection;
