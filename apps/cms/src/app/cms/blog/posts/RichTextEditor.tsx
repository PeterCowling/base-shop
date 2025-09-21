"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Input } from "@ui/components/atoms";
import { ImagePicker } from "@ui/components/cms/page-builder";
import Image from "next/image";
import {
  EditorProvider,
  PortableTextEditable,
  PortableTextEditor,
  usePortableTextEditor,
} from "@portabletext/editor";
import { EventListenerPlugin } from "@portabletext/editor/plugins";
import type { PortableTextBlock } from "./schema";
import { schema, renderBlock } from "./schema";
import type { SKU } from "@acme/types";
import { formatCurrency } from "@acme/shared-utils";

function Toolbar() {
  const editor = usePortableTextEditor();
  const addLink = () => {
    const href = prompt("URL");
    if (!href) return;
    if (PortableTextEditor.isAnnotationActive(editor, "link")) {
      PortableTextEditor.removeAnnotation(editor, { name: "link" });
    }
    PortableTextEditor.addAnnotation(editor, { name: "link" }, { href });
  };
  const addEmbed = () => {
    const url = prompt("Embed URL");
    if (url) PortableTextEditor.insertBlock(editor, { name: "embed" }, { url });
  };
  const addImage = useCallback(
    (url: string) => {
      PortableTextEditor.insertBlock(editor, { name: "image" }, { url });
    },
    [editor]
  );
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => PortableTextEditor.toggleMark(editor, "strong")}
      >
        Bold
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => PortableTextEditor.toggleMark(editor, "em")}
      >
        Italic
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => PortableTextEditor.toggleBlockStyle(editor, "h1")}
      >
        H1
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => PortableTextEditor.toggleBlockStyle(editor, "h2")}
      >
        H2
      </Button>
      <Button type="button" variant="outline" onClick={addLink}>
        Link
      </Button>
      <Button type="button" variant="outline" onClick={addEmbed}>
        Embed
      </Button>
      <ImagePicker onSelect={addImage}>
        <Button type="button" variant="outline">
          Image
        </Button>
      </ImagePicker>
    </div>
  );
}

function ProductSearch({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (v: string) => void;
}) {
  const editor = usePortableTextEditor();
  const [matches, setMatches] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setMatches([]);
      setError(null);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Failed to load products");
        const data: SKU[] = await res.json();
        setMatches(data);
        setError(null);
      } catch {
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="space-y-1">
      <Input
        label="Search products"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <div>Loading…</div>}
      {error && <div className="text-danger-foreground">{error}</div>}
      {query && !loading && !error && (
        <ul className="space-y-1">
          {matches.map((p) => {
            const imageUrl = p.media.find((m) => m.type === "image")?.url;
            return (
              <li key={p.slug}>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() =>
                    PortableTextEditor.insertBlock(
                      editor,
                      { name: "productReference" },
                      {
                        slug: p.slug,
                      }
                    )
                  }
                >
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={p.title}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-cover"
                    />
                  )}
                  <span className="flex-1 text-left">{p.title}</span>
                  <span className="text-sm">{formatCurrency(p.price)}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: PortableTextBlock[];
  onChange: (v: PortableTextBlock[]) => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <EditorProvider
      initialConfig={{ schemaDefinition: schema, initialValue: value }}
    >
      <EventListenerPlugin
        on={(event) => {
          if (event.type === "mutation") {
            onChange(event.value as PortableTextBlock[]);
          }
        }}
      />
      <Toolbar />
      <PortableTextEditable
        className="min-h-[200px] rounded border p-2"
        renderBlock={renderBlock}
      />
      <ProductSearch query={query} setQuery={setQuery} />
    </EditorProvider>
  );
}
