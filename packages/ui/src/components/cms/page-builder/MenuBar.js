import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../../atoms/shadcn";
function MenuBar({ editor }) {
    if (!editor)
        return null;
    return (_jsxs("div", { className: "mb-1 flex gap-1 border-b pb-1", children: [_jsx(Button, { type: "button", variant: editor.isActive("bold") ? "default" : "outline", onClick: () => editor.chain().focus().toggleBold().run(), children: "B" }), _jsx(Button, { type: "button", variant: editor.isActive("italic") ? "default" : "outline", onClick: () => editor.chain().focus().toggleItalic().run(), children: "I" }), _jsx(Button, { type: "button", variant: editor.isActive("link") ? "default" : "outline", onClick: () => {
                    const url = window.prompt("URL");
                    if (url) {
                        editor
                            .chain()
                            .focus()
                            .extendMarkRange("link")
                            .setLink({ href: url })
                            .run();
                    }
                }, children: "Link" })] }));
}
export default MenuBar;
