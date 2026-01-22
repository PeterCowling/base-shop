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
 
const SidebarPane = ({ width, children }: SidebarPaneProps) => (
  <div className="shrink-0" style={{ width }}>
    {children}
  </div>
);
 

export default SidebarPane;
