import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { SplitPane, useSplitPane } from "./SplitPane";

const meta: Meta<typeof SplitPane> = {
  title: "Operations/SplitPane",
  component: SplitPane,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
SplitPane is a resizable split view component that allows users to adjust the size of two panes.

### Features
- Horizontal and vertical splitting
- Draggable resize handle
- Keyboard navigation (arrow keys, Home, End)
- Touch support for mobile
- Collapsible panes
- Controlled and uncontrolled modes
- Double-click to reset to default size
- useSplitPane hook for custom implementations
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

// ─────────────────────────────────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────────────────────────────────

export const Default: StoryObj<typeof SplitPane> = {
  render: () => (
    <div style={{ height: 400 }}>
      <SplitPane>
        <div className="flex h-full items-center justify-center bg-slate-100 p-4">
          <div className="text-center">
            <h3 className="font-semibold">Primary Pane</h3>
            <p className="text-sm text-slate-500">Drag the handle to resize</p>
          </div>
        </div>
        <div className="flex h-full items-center justify-center bg-slate-50 p-4">
          <div className="text-center">
            <h3 className="font-semibold">Secondary Pane</h3>
            <p className="text-sm text-slate-500">This pane fills remaining space</p>
          </div>
        </div>
      </SplitPane>
    </div>
  ),
};

export const Vertical: StoryObj<typeof SplitPane> = {
  render: () => (
    <div style={{ height: 500 }}>
      <SplitPane direction="vertical" defaultSize="40%">
        <div className="flex h-full items-center justify-center bg-slate-100 p-4">
          <div className="text-center">
            <h3 className="font-semibold">Top Pane</h3>
            <p className="text-sm text-slate-500">Drag the handle to resize vertically</p>
          </div>
        </div>
        <div className="flex h-full items-center justify-center bg-slate-50 p-4">
          <div className="text-center">
            <h3 className="font-semibold">Bottom Pane</h3>
            <p className="text-sm text-slate-500">This pane fills remaining space</p>
          </div>
        </div>
      </SplitPane>
    </div>
  ),
};

export const WithConstraints: StoryObj<typeof SplitPane> = {
  render: () => (
    <div style={{ height: 400 }}>
      <SplitPane
        minSize={200}
        maxSize={500}
        minSecondarySize={150}
        defaultSize={300}
      >
        <div className="flex h-full flex-col items-center justify-center bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900">Constrained Pane</h3>
          <p className="text-sm text-blue-600">Min: 200px, Max: 500px</p>
        </div>
        <div className="flex h-full flex-col items-center justify-center bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-900">Secondary Pane</h3>
          <p className="text-sm text-amber-600">Min: 150px</p>
        </div>
      </SplitPane>
    </div>
  ),
};

export const Collapsible: StoryObj<typeof SplitPane> = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);

    return (
      <div className="flex flex-col gap-4" style={{ height: 400 }}>
        <div className="flex items-center gap-4 px-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded bg-slate-700 px-3 py-1 text-sm text-white"
          >
            {collapsed ? "Expand" : "Collapse"} Sidebar
          </button>
          <span className="text-sm text-slate-500">
            Or drag the handle to the left to collapse
          </span>
        </div>
        <div className="flex-1">
          <SplitPane
            collapsible
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            defaultSize={250}
            minSize={200}
          >
            <div className="flex h-full flex-col bg-slate-800 p-4 text-white">
              <h3 className="font-semibold">Sidebar</h3>
              <nav className="mt-4 space-y-2">
                <div className="rounded bg-slate-700 px-3 py-2">Dashboard</div>
                <div className="rounded px-3 py-2 hover:bg-slate-700">Projects</div>
                <div className="rounded px-3 py-2 hover:bg-slate-700">Settings</div>
              </nav>
            </div>
            <div className="flex h-full items-center justify-center bg-slate-50 p-4">
              <div className="text-center">
                <h3 className="font-semibold">Main Content</h3>
                <p className="text-sm text-slate-500">
                  The sidebar can be collapsed by dragging
                </p>
              </div>
            </div>
          </SplitPane>
        </div>
      </div>
    );
  },
};

export const CodeEditor: StoryObj<typeof SplitPane> = {
  render: () => (
    <div style={{ height: 500 }}>
      <SplitPane direction="vertical" defaultSize="70%">
        <div className="h-full bg-slate-900 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <span>index.tsx</span>
          </div>
          <pre className="font-mono text-sm text-slate-300">
{`import React from 'react';

function App() {
  return (
    <div className="app">
      <h1>Hello World</h1>
      <p>Welcome to the code editor</p>
    </div>
  );
}

export default App;`}
          </pre>
        </div>
        <div className="h-full bg-slate-950 p-4">
          <div className="mb-2 text-sm font-semibold text-slate-400">
            Terminal
          </div>
          <div className="font-mono text-sm text-green-400">
            $ npm run dev<br />
            <span className="text-slate-400">Starting development server...</span><br />
            <span className="text-blue-400">Ready on http://localhost:3000</span>
          </div>
        </div>
      </SplitPane>
    </div>
  ),
};

export const NestedSplits: StoryObj<typeof SplitPane> = {
  render: () => (
    <div style={{ height: 500 }}>
      <SplitPane defaultSize={200}>
        <div className="flex h-full flex-col bg-slate-800 p-3 text-white">
          <div className="text-sm font-semibold">Explorer</div>
          <div className="mt-3 space-y-1 text-sm">
            <div className="rounded bg-slate-700 px-2 py-1">src/</div>
            <div className="pl-4 text-slate-400">components/</div>
            <div className="pl-4 text-slate-400">pages/</div>
            <div className="rounded px-2 py-1 hover:bg-slate-700">package.json</div>
          </div>
        </div>
        <SplitPane direction="vertical" defaultSize="60%">
          <div className="h-full bg-slate-900 p-4">
            <div className="text-sm text-slate-400">Editor</div>
            <pre className="mt-2 font-mono text-sm text-slate-300">
              {"// Your code here"}
            </pre>
          </div>
          <SplitPane defaultSize="50%">
            <div className="flex h-full items-center justify-center bg-slate-800 p-2 text-sm text-slate-300">
              Problems
            </div>
            <div className="flex h-full items-center justify-center bg-slate-850 p-2 text-sm text-slate-300">
              Output
            </div>
          </SplitPane>
        </SplitPane>
      </SplitPane>
    </div>
  ),
};

export const WithResizeCallbacks: StoryObj<typeof SplitPane> = {
  render: () => {
    const [size, setSize] = useState<number | null>(null);
    const [isResizing, setIsResizing] = useState(false);

    return (
      <div className="flex flex-col gap-4" style={{ height: 400 }}>
        <div className="flex items-center gap-4 px-4">
          <div className="rounded bg-slate-100 px-3 py-1 text-sm">
            Size: {size ? `${Math.round(size)}px` : "–"}
          </div>
          <div
            className={`rounded px-3 py-1 text-sm ${
              isResizing ? "bg-green-100 text-green-700" : "bg-slate-100"
            }`}
          >
            {isResizing ? "Resizing..." : "Idle"}
          </div>
        </div>
        <div className="flex-1">
          <SplitPane
            defaultSize={300}
            onResize={setSize}
            onResizeStart={() => setIsResizing(true)}
            onResizeEnd={() => setIsResizing(false)}
          >
            <div className="flex h-full items-center justify-center bg-slate-100 p-4">
              Primary Pane
            </div>
            <div className="flex h-full items-center justify-center bg-slate-50 p-4">
              Secondary Pane
            </div>
          </SplitPane>
        </div>
      </div>
    );
  },
};

export const CustomHandle: StoryObj<typeof SplitPane> = {
  render: () => (
    <div style={{ height: 400 }}>
      <SplitPane
        handleSize={12}
        handleClassName="bg-gradient-to-r from-purple-500 to-pink-500 opacity-50 hover:opacity-100 transition-opacity"
      >
        <div className="flex h-full items-center justify-center bg-slate-100 p-4">
          <span>Left</span>
        </div>
        <div className="flex h-full items-center justify-center bg-slate-50 p-4">
          <span>Right</span>
        </div>
      </SplitPane>
    </div>
  ),
};

export const Disabled: StoryObj<typeof SplitPane> = {
  render: () => (
    <div style={{ height: 400 }}>
      <SplitPane disabled defaultSize={300}>
        <div className="flex h-full items-center justify-center bg-slate-100 p-4">
          <div className="text-center">
            <h3 className="font-semibold">Fixed Pane</h3>
            <p className="text-sm text-slate-500">Resizing is disabled</p>
          </div>
        </div>
        <div className="flex h-full items-center justify-center bg-slate-50 p-4">
          <div className="text-center">
            <h3 className="font-semibold">Secondary Pane</h3>
            <p className="text-sm text-slate-500">Handle is not interactive</p>
          </div>
        </div>
      </SplitPane>
    </div>
  ),
};

export const WithHook: StoryObj<typeof SplitPane> = {
  render: () => {
    function CustomSplitPane() {
      const { size, setSize, isResizing, handleProps, containerRef } = useSplitPane({
        defaultSize: 300,
        minSize: 150,
        maxSize: 500,
      });

      return (
        <div className="flex flex-col gap-4" style={{ height: 400 }}>
          <div className="flex items-center gap-4 px-4">
            <input
              type="range"
              min={150}
              max={500}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-40"
            />
            <span className="text-sm text-slate-600">{Math.round(size)}px</span>
            {isResizing && (
              <span className="text-sm text-green-600">Resizing...</span>
            )}
          </div>
          <div
            ref={containerRef}
            className="flex flex-1"
            style={{ width: "100%" }}
          >
            <div
              className="flex items-center justify-center bg-slate-100"
              style={{ width: size }}
            >
              Primary ({Math.round(size)}px)
            </div>
            <div
              {...handleProps}
              className="w-1 flex-shrink-0 bg-slate-300 hover:bg-slate-400 transition-colors"
            />
            <div className="flex flex-1 items-center justify-center bg-slate-50">
              Secondary
            </div>
          </div>
        </div>
      );
    }

    return <CustomSplitPane />;
  },
};
