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
    const [comp, setComp] = useState<PageComponent>({ id: "box", type: "Box" } as any);
    return (
      <div style={{ width: 480 }}>
        <InteractionsPanel
          component={comp}
          handleInput={(k, v) => setComp((c) => ({ ...c, [k]: v }))}
        />
        <pre style={{ marginTop: 8, fontSize: 12 }}>{JSON.stringify(comp, null, 2)}</pre>
      </div>
    );
  },
};

