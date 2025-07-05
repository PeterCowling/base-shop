"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ContactForm from "./ContactForm";
export default function ContactFormWithMap({ mapSrc = "https://maps.google.com/maps?q=New%20York&t=&z=13&ie=UTF8&iwloc=&output=embed", }) {
    return (_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(ContactForm, {}), _jsx("iframe", { src: mapSrc, title: "map", className: "min-h-[300px] w-full rounded", loading: "lazy" })] }));
}
