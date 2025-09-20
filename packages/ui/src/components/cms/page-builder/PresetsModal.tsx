"use client";

import { Dialog, DialogContent, DialogTitle, DialogTrigger, Button } from "../../atoms/shadcn";
import Image from "next/image";
import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";

interface Props { onInsert: (component: PageComponent) => void }

const presets: { id: string; label: string; description?: string; preview: string; build: () => PageComponent }[] = [
  {
    id: "hero-simple",
    label: "Hero: Simple",
    preview: "/window.svg",
    build: () => ({
      id: ulid(),
      type: "Section",
      padding: "40px",
      children: [
        {
          id: ulid(),
          type: "HeroBanner",
          title: { en: "Welcome to Our Store" } as any,
          subtitle: { en: "Discover our new arrivals" } as any,
          ctaLabel: { en: "Shop now" } as any,
          ctaHref: "/shop",
        } as any,
      ],
    } as any),
  },
  {
    id: "feature-columns",
    label: "Features: 3 Columns",
    preview: "/window.svg",
    build: () => ({
      id: ulid(),
      type: "Section",
      padding: "24px",
      children: [
        {
          id: ulid(),
          type: "MultiColumn",
          columns: 3,
          children: [
            { id: ulid(), type: "ValueProps", title: { en: "Fast" } as any } as any,
            { id: ulid(), type: "ValueProps", title: { en: "Reliable" } as any } as any,
            { id: ulid(), type: "ValueProps", title: { en: "Secure" } as any } as any,
          ],
        } as any,
      ],
    } as any),
  },
];

export default function PresetsModal({ onInsert }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Insert Preset</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Starter Layouts</DialogTitle>
        <div className="grid grid-cols-2 gap-4">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className="rounded border p-2 text-left hover:bg-accent"
              onClick={() => onInsert(p.build())}
            >
              <Image src={p.preview} alt="" width={300} height={160} className="w-full rounded" />
              <div className="mt-2 font-medium">{p.label}</div>
              {p.description && <div className="text-sm text-muted-foreground">{p.description}</div>}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
