// packages/ui/components/cms/MediaFileList.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import MediaFileItem from "./MediaFileItem";
export default function MediaFileList({ files, onDelete }) {
    if (files.length === 0)
        return null;
    return (_jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-4", children: files.map((item) => (_jsx(MediaFileItem, { item: item, onDelete: onDelete }, item.url))) }));
}
