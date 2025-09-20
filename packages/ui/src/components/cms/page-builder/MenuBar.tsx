"use client";
import type { Editor } from "@tiptap/react";
import { Button } from "../../atoms/shadcn";
import { useMemo, useState } from "react";
import LinkModal from "./LinkModal";

function MenuBar({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false);
  const currentHref = useMemo(() => {
    if (!editor) return "";
    try {
      return editor.getAttributes("link").href ?? "";
    } catch {
      return "";
    }
  }, [editor, editor?.state?.selection?.from, editor?.state?.selection?.to]);

  if (!editor) return null;

  return (
    <div className="mb-1 flex flex-wrap gap-1 border-b pb-1">
      <Button
        type="button"
        variant={editor.isActive("bold") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </Button>
      <Button
        type="button"
        variant={editor.isActive("italic") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </Button>
      <Button
        type="button"
        variant={editor.isActive("code") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        Code
      </Button>
      <Button
        type="button"
        variant={editor.isActive("blockquote") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        {">"}
      </Button>
      <Button
        type="button"
        variant={editor.isActive("bulletList") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </Button>
      <Button
        type="button"
        variant={editor.isActive("orderedList") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </Button>
      <Button
        type="button"
        variant={editor.isActive("heading", { level: 1 }) ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </Button>
      <Button
        type="button"
        variant={editor.isActive("heading", { level: 2 }) ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Button>
      <Button
        type="button"
        variant={editor.isActive("heading", { level: 3 }) ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Button>
      <Button
        type="button"
        variant={editor.isActive("link") ? "default" : "outline"}
        onClick={() => setOpen(true)}
      >
        Link
      </Button>
      {editor.isActive("link") && (
        <Button
          type="button"
          variant="outline"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          Unlink
        </Button>
      )}

      <LinkModal
        open={open}
        initialUrl={currentHref}
        onClose={() => setOpen(false)}
        onSave={(href) => {
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href })
            .run();
          setOpen(false);
        }}
      />
    </div>
  );
}

export default MenuBar;
