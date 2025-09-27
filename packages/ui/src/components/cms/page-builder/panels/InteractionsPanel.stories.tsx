// packages/ui/src/components/cms/page-builder/panels/InteractionsPanel.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import InteractionsPanel from "./InteractionsPanel";
import type { PageComponent } from "@acme/types";

const meta: Meta<typeof InteractionsPanel> = {
  title: "CMS/Page Builder/Animations & Interactions",
  component: InteractionsPanel,
};
export default meta;

type Story = StoryObj<typeof InteractionsPanel>;

export const Basic: Story = {
  render: () => {
    function StoryContent() {
      // Use a known atom type to avoid `any` casts
      const [comp, setComp] = useState<PageComponent>({ id: "txt", type: "Text" });
      return (
        <div style={{ width: 480 }}>
          <InteractionsPanel
            component={comp}
            handleInput={(k, v) => setComp((c) => ({ ...c, [k]: v }))}
          />
          <pre className="mt-2 text-xs font-mono">{JSON.stringify(comp, null, 2)}</pre>
        </div>
      );
    }
    return <StoryContent />;
  },
};
