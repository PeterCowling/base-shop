"use client";

import React from "react";

interface SidebarPaneProps {
  width: number;
  children: React.ReactNode;
}

/**
 * Simple fixed-width sidebar pane wrapper used in the Page Builder.
 * Note: Uses inline style for dynamic width; scoped here to avoid rule noise.
 */
/* eslint-disable react/forbid-dom-props -- PB-2419: dynamic width via style for builder sidebar */
const SidebarPane = ({ width, children }: SidebarPaneProps) => (
  <div className="shrink-0" style={{ width }}>
    {children}
  </div>
);
/* eslint-enable react/forbid-dom-props */

export default SidebarPane;
