"use client";

import React, { useContext } from "react";
import {
  type BlockRenderProps,
  defineSchema,
  type PortableTextBlock,
  PortableTextEditor,
  type RenderBlockFunction,
  useEditor,
} from "@portabletext/editor";

import { Button } from "@acme/design-system/shadcn";

import { InvalidProductContext } from "./invalidProductContext";
import ProductPreview from "./ProductPreview";

export const schema = defineSchema({
  decorators: [{ name: "strong" }, { name: "em" }],
  styles: [
    { name: "normal" },
    { name: "h1" },
    { name: "h2" },
    { name: "h3" },
  ],
  lists: [{ name: "bullet" }, { name: "number" }],
  annotations: [
    {
      name: "link",
      type: "object",
      fields: [{ name: "href", type: "string" }],
    },
  ],
  inlineObjects: [],
  blockObjects: [
    {
      name: "productReference",
      type: "object",
      fields: [{ name: "slug", type: "string" }],
    },
    {
      name: "embed",
      type: "object",
      fields: [{ name: "url", type: "string" }],
    },
    {
      name: "image",
      type: "object",
      fields: [
        { name: "url", type: "string" },
        { name: "alt", type: "string" },
      ],
    },
  ],
});

function ProductReferenceBlock(props: BlockRenderProps) {
  const editor = useEditor();
  const ctx = useContext(InvalidProductContext);
    const { slug } = props.value as unknown as { slug: string; _key: string };
  const isInvalid = Boolean(ctx?.invalidProducts[props.value._key as string]);
  const remove = () => {
    const sel = {
      anchor: { path: props.path, offset: 0 },
      focus: { path: props.path, offset: 0 },
    };
    PortableTextEditor.delete(
      editor as unknown as PortableTextEditor,
      sel,
      { mode: "blocks" },
    );
  };
  const edit = () => {
    const next = prompt("Product slug", slug);
    if (!next) return;
    const sel = {
      anchor: { path: props.path, offset: 0 },
      focus: { path: props.path, offset: 0 },
    };
    PortableTextEditor.delete(
      editor as unknown as PortableTextEditor,
      sel,
      { mode: "blocks" },
    );
    PortableTextEditor.insertBlock(
      editor as unknown as PortableTextEditor,
      { name: "productReference" },
      { slug: next },
    );
  };
  const className = `space-y-2 ${isInvalid ? "rounded border border-danger p-2" : ""}`;
  return React.createElement(
    "div",
    { className },
    React.createElement(ProductPreview, {
      slug,
      onValidChange: (valid: boolean) =>
        ctx?.markValidity(props.value._key as string, valid, slug),
    }),
    React.createElement(
      "div",
      { className: "flex gap-2" },
      React.createElement(
        Button,
        { type: "button", variant: "outline", onClick: edit },
        "Edit",
      ),
      React.createElement(
        Button,
        { type: "button", variant: "outline", onClick: remove },
        "Remove",
      ),
    ),
  );
}

export const renderBlock: RenderBlockFunction = (props) => {
  if (props.value._type === "productReference") {
    return React.createElement(ProductReferenceBlock, props);
  }
    if (props.value._type === "embed") {
      const { url } = props.value as unknown as { url: string };
    return React.createElement(
      "div",
      { className: "aspect-video" },
      React.createElement("iframe", {
        src: url,
        className: "h-full w-full",
      }),
    );
  }
    if (props.value._type === "image") {
      const { url, alt } = props.value as unknown as {
        url: string;
        alt?: string;
      };
    return React.createElement("img", {
      src: url,
      alt: alt ?? "",
      className: "max-w-full",
    });
  }
  return React.createElement("div", null, props.children as React.ReactNode);
};

export const previewComponents = {
  types: {
    productReference: ({ value }: { value: { slug: string } }) =>
      React.createElement(ProductPreview, { slug: value.slug }),
    embed: ({ value }: { value: { url: string } }) =>
      React.createElement(
        "div",
        { className: "aspect-video" },
        React.createElement("iframe", { src: value.url, className: "h-full w-full" }),
      ),
    image: ({ value }: { value: { url: string; alt?: string } }) =>
      React.createElement("img", {
        src: value.url,
        alt: value.alt ?? "",
        className: "max-w-full",
      }),
  },
    marks: {
      link: ({
        children,
        value,
      }: {
        children: React.ReactNode;
        value?: { href: string };
      }) =>
        React.createElement(
          "a",
          {
            href: value?.href ?? "#",
            className: "text-link underline",
            target: "_blank",
            rel: "noopener noreferrer",
          },
          children,
        ),
    },
    block: {
      h1: ({ children }: { children?: React.ReactNode }) =>
        React.createElement("h1", null, children),
      h2: ({ children }: { children?: React.ReactNode }) =>
        React.createElement("h2", null, children),
      h3: ({ children }: { children?: React.ReactNode }) =>
        React.createElement("h3", null, children),
    },
};

export type { PortableTextBlock };
