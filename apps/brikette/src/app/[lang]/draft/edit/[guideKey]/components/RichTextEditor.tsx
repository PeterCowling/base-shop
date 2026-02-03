"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor UI is developer-facing */
import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { getSchema } from "@tiptap/core";

import type { GuideKey } from "@/routes.guides-helpers";
import { sanitizeLinkLabel } from "@/routes/guides/utils/linkTokens";

import { GuideLinkPicker } from "./GuideLinkPicker";
import { TextArea } from "./FormFields";
import {
  createGuideMarkdownCodec,
  guideMarkdownToStringArray,
  stringArrayToGuideMarkdown,
} from "./guideMarkdown";

export type AllowedFormat = "bold" | "italic" | "bulletList" | "link";

type Props = {
  fieldId: string;
  value: unknown;
  onChange: (value: string[]) => void;
  allowedFormats?: AllowedFormat[];
  placeholder?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
};

type ErrorBoundaryProps = {
  fallback: ReactNode;
  children: ReactNode;
};

type ErrorBoundaryState = { hasError: boolean };

class EditorErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    console.error("Guide editor failed to render", error);
  }

  override render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function RichTextEditorInner({
  fieldId,
  value,
  onChange,
  allowedFormats = ["bold", "italic", "link"],
  placeholder,
  label,
  hint,
  disabled,
}: Props) {
  const allowBold = allowedFormats.includes("bold");
  const allowItalic = allowedFormats.includes("italic");
  const allowLists = allowedFormats.includes("bulletList");
  const allowLinks = allowedFormats.includes("link");

  const [linkOpen, setLinkOpen] = useState(false);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bold: allowBold ? {} : false,
        italic: allowItalic ? {} : false,
        bulletList: allowLists ? {} : false,
        listItem: allowLists ? {} : false,
        orderedList: false,
        strike: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        hardBreak: false,
        heading: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
    ],
    [allowBold, allowItalic, allowLists, placeholder],
  );

  const schema = useMemo(() => getSchema(extensions), [extensions]);
  const codec = useMemo(
    () => createGuideMarkdownCodec(schema, { allowLists }),
    [schema, allowLists],
  );

  const initialMarkdown = useMemo(() => stringArrayToGuideMarkdown(value), [value]);

  const ignoreUpdateRef = useRef(false);
  const lastAppliedMarkdownRef = useRef(initialMarkdown);
  const pendingMarkdownRef = useRef<string | null>(null);

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    content: codec.parse(initialMarkdown).toJSON(),
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          "min-h-28 w-full px-3 py-2 text-sm text-brand-heading outline-none prose prose-sm max-w-none",
      },
    },
    onUpdate: ({ editor: editorInstance }) => {
      if (ignoreUpdateRef.current) return;
      const serialized = codec.serialize(editorInstance.state.doc);
      if (serialized === lastAppliedMarkdownRef.current) return;
      lastAppliedMarkdownRef.current = serialized;
      onChange(guideMarkdownToStringArray(serialized));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const nextMarkdown = stringArrayToGuideMarkdown(value);
    if (nextMarkdown === lastAppliedMarkdownRef.current) return;
    if (editor.isFocused) {
      pendingMarkdownRef.current = nextMarkdown;
      return;
    }
    ignoreUpdateRef.current = true;
    editor.commands.setContent(codec.parse(nextMarkdown).toJSON(), false);
    ignoreUpdateRef.current = false;
    lastAppliedMarkdownRef.current = nextMarkdown;
  }, [codec, editor, fieldId, value]);

  useEffect(() => {
    if (!editor) return;
    const applyPending = () => {
      if (!pendingMarkdownRef.current) return;
      ignoreUpdateRef.current = true;
      editor.commands.setContent(codec.parse(pendingMarkdownRef.current).toJSON(), false);
      ignoreUpdateRef.current = false;
      lastAppliedMarkdownRef.current = pendingMarkdownRef.current;
      pendingMarkdownRef.current = null;
    };
    editor.on("blur", applyPending);
    return () => {
      editor.off("blur", applyPending);
    };
  }, [codec, editor]);

  const handleInsertLink = (guideKey: GuideKey, rawLabel: string) => {
    if (!editor) return;
    const labelText = sanitizeLinkLabel(rawLabel);
    if (!labelText) return;
    editor
      .chain()
      .focus()
      .insertContent(`%LINK:${guideKey}|${labelText}%`)
      .run();
  };

  const toolbarButton = (
    labelText: string,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      type="button"
      className={clsx(
        "rounded px-2 py-1 text-xs font-semibold transition",
        active
          ? "bg-brand-primary/10 text-brand-primary"
          : "text-brand-text/60 hover:bg-brand-surface",
      )}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {labelText}
    </button>
  );

  return (
    <div className="relative">
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label className="text-xs font-medium text-brand-text/80">{label}</label>
        ) : null}
        <div
          className={clsx(
            "rounded-md border bg-brand-bg",
            disabled ? "border-brand-outline/30 opacity-60" : "border-brand-outline/40",
          )}
        >
          <div
            className="flex flex-wrap items-center gap-1 border-b border-brand-outline/20 px-2 py-1"
            role="toolbar"
            aria-label="Formatting options"
          >
            {allowBold &&
              toolbarButton("B", editor?.isActive("bold") ?? false, () =>
                editor?.chain().focus().toggleBold().run(),
              )}
            {allowItalic &&
              toolbarButton("I", editor?.isActive("italic") ?? false, () =>
                editor?.chain().focus().toggleItalic().run(),
              )}
            {allowLists &&
              toolbarButton("•", editor?.isActive("bulletList") ?? false, () =>
                editor?.chain().focus().toggleBulletList().run(),
              )}
            {allowLinks && (
              <button
                type="button"
                className="rounded px-2 py-1 text-xs font-semibold text-brand-text/60 hover:bg-brand-surface"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setLinkOpen(true)}
              >
                Link
              </button>
            )}
          </div>
          <EditorContent editor={editor} />
        </div>
        {hint ? <p className="text-xs text-brand-text/50">{hint}</p> : null}
      </div>

      {allowLinks ? (
        <GuideLinkPicker
          isOpen={linkOpen}
          onClose={() => setLinkOpen(false)}
          onSelect={handleInsertLink}
        />
      ) : null}
    </div>
  );
}

export function RichTextEditor(props: Props) {
  const fallbackValue = stringArrayToGuideMarkdown(props.value);
  return (
    <EditorErrorBoundary
      fallback={
        <TextArea
          label={props.label ?? "Content"}
          value={fallbackValue}
          onChange={(next) => props.onChange(guideMarkdownToStringArray(next))}
          placeholder={props.placeholder}
          hint={props.hint}
          disabled={props.disabled}
          rows={6}
        />
      }
    >
      <RichTextEditorInner {...props} />
    </EditorErrorBoundary>
  );
}
