"use client";
import type { Editor } from "@tiptap/react";
import { Button } from "../../atoms/shadcn";

function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return (
    <div className="mb-1 flex gap-1 border-b pb-1">
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
        variant={editor.isActive("link") ? "default" : "outline"}
        onClick={() => {
          const url = window.prompt("URL");
          if (url) {
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: url })
              .run();
          }
        }}
      >
        Link
      </Button>
    </div>
  );
}

export default MenuBar;
