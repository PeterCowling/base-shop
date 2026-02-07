"use client";

import React, { useMemo, useState } from "react";

import { Grid } from "../../atoms/primitives/Grid";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";

type Props = {
  value?: string;
  columns?: number;
  rows?: number;
  onChange: (next: { areas: string; columns: number; rows: number }) => void;
};

function parseAreas(value?: string): string[][] {
  const raw = (value ?? "").trim();
  if (!raw) return [];
  const lines = raw.split(/\n+/).map((l) => l.trim().replace(/^"|"$/g, ""));
  return lines.filter(Boolean).map((line) => line.split(/\s+/));
}

function serializeAreas(matrix: string[][]): string {
  if (!Array.isArray(matrix) || matrix.length === 0) return "";
  return matrix.map((row) => `"${row.join(" ")}"`).join("\n");
}

export default function GridAreasEditor({ value, columns, rows, onChange }: Props) {
  const initial = useMemo(() => parseAreas(value), [value]);
  const initCols = Math.max(columns || 0, initial.reduce((max, r) => Math.max(max, r.length), 0));
  const initRows = Math.max(rows || 0, initial.length);
  const [cols, setCols] = useState<number>(Math.max(1, initCols || 4));
  const [rws, setRws] = useState<number>(Math.max(1, initRows || 2));
  const [matrix, setMatrix] = useState<string[][]>(() => {
    const m: string[][] = [];
    for (let y = 0; y < Math.max(1, initRows || 2); y++) {
      const row: string[] = [];
      for (let x = 0; x < Math.max(1, initCols || 4); x++) {
        row.push(initial[y]?.[x] ?? ".");
      }
      m.push(row);
    }
    return m;
  });
  const names = useMemo(() => {
    const s = new Set<string>();
    matrix.forEach((row) => row.forEach((c) => { if (c && c !== ".") s.add(c); }));
    return Array.from(s.values());
  }, [matrix]);
  const [brush, setBrush] = useState<string>(names[0] ?? "a");
  const [newName, setNewName] = useState<string>("");

  const resize = (nextRows: number, nextCols: number) => {
    const nr = Math.max(1, Math.min(20, nextRows | 0));
    const nc = Math.max(1, Math.min(20, nextCols | 0));
    const out: string[][] = [];
    for (let y = 0; y < nr; y++) {
      const row: string[] = [];
      for (let x = 0; x < nc; x++) {
        row.push(matrix[y]?.[x] ?? ".");
      }
      out.push(row);
    }
    setRws(nr);
    setCols(nc);
    setMatrix(out);
  };

  const paint = (y: number, x: number) => {
    setMatrix((prev) => prev.map((row, ry) => row.map((cell, cx) => (ry === y && cx === x ? brush : cell))));
  };

  const commit = () => {
    onChange({ areas: serializeAreas(matrix), columns: cols, rows: rws });
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <Input label="Columns" type="number" value={String(cols)} onChange={(e) => resize(rws, parseInt(e.target.value || "1", 10))} />
        <Input label="Rows" type="number" value={String(rws)} onChange={(e) => resize(parseInt(e.target.value || "1", 10), cols)} />
        <Select value={brush} onValueChange={setBrush}>
          <SelectTrigger><SelectValue placeholder="Brush" /></SelectTrigger>
          <SelectContent>
            {names.length === 0 && <SelectItem value=".">.</SelectItem>}
            {names.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
            <SelectItem value=".">.</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-end gap-2">
          <Input label="Add area" placeholder="name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button type="button" variant="outline" onClick={() => { const v = newName.trim(); if (!v) return; setNewName(""); setBrush(v); }}>
            Add
          </Button>
        </div>
      </div>
      <div className="rounded border p-2">
        <Grid gap={0} className="gap-px" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: rws }).map((_, y) => (
            // eslint-disable-next-line react/no-array-index-key -- PB-2416: grid rows addressed by coordinate, not reordered
            <React.Fragment key={`row-${y}`}>
              {Array.from({ length: cols }).map((__, x) => (
                <button
                  // eslint-disable-next-line react/no-array-index-key -- PB-2416: grid cells addressed by coordinate, not reordered
                  key={`cell-${y}-${x}`}
                  type="button"
                  className="bg-muted/40 hover:bg-muted rounded p-2 text-center text-xs min-h-10 min-w-10"
                  onClick={() => paint(y, x)}
                  title={`Row ${y + 1}, Col ${x + 1}`}
                >
                  {matrix[y]?.[x] ?? "."}
                </button>
              ))}
            </React.Fragment>
          ))}
        </Grid>
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={commit}>Apply areas</Button>
      </div>
    </div>
  );
}
