"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../atoms/shadcn";

export default function AppMarketStub({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>App Market</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>A curated marketplace of apps and editor add-ons will appear here.</p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>Install marketing, commerce, and content apps</li>
            <li>Manage installed apps</li>
            <li>Integrate editor tooling</li>
          </ul>
          <p className="text-muted-foreground">This is a stub for now.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

