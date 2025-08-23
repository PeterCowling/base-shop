import { useCallback, useEffect, useMemo, useState, } from "react";
const defaultSansFonts = [
    '"Geist Sans", system-ui, sans-serif',
    "Arial, sans-serif",
    "ui-sans-serif, system-ui",
];
const defaultMonoFonts = [
    '"Geist Mono", ui-monospace, monospace',
    '"Courier New", monospace',
];
const googleFontList = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Merriweather",
    "Poppins",
];
export function useTokenEditor(tokens, baseTokens, onChange) {
    const setToken = useCallback((key, value) => {
        onChange({ ...tokens, [key]: value });
    }, [tokens, onChange]);
    const [sansFonts, setSansFonts] = useState([...defaultSansFonts]);
    const [monoFonts, setMonoFonts] = useState([...defaultMonoFonts]);
    const [googleFonts] = useState(googleFontList);
    const [newFont, setNewFont] = useState("");
    useEffect(() => {
        Object.entries(tokens).forEach(([k, v]) => {
            if (k.startsWith("--font-src-")) {
                const name = k.slice("--font-src-".length);
                if (!document.getElementById(`font-${name}`)) {
                    const style = document.createElement("style");
                    style.id = `font-${name}`;
                    style.textContent = `@font-face { font-family: '${name}'; src: url(${v}); }`;
                    document.head.appendChild(style);
                }
                const stack = `"${name}"`;
                setSansFonts((f) => (f.includes(stack) ? f : [...f, stack]));
                setMonoFonts((f) => (f.includes(stack) ? f : [...f, stack]));
            }
        });
    }, [tokens]);
    const handleUpload = useCallback((type, e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const name = file.name.replace(/\.[^.]+$/, "");
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            setToken(`--font-src-${name}`, dataUrl);
            const stack = `"${name}"`;
            if (type === "mono") {
                setMonoFonts((f) => (f.includes(stack) ? f : [...f, stack]));
                setToken("--font-mono", stack);
            }
            else {
                setSansFonts((f) => (f.includes(stack) ? f : [...f, stack]));
                setToken("--font-sans", stack);
            }
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    }, [setToken]);
    const addCustomFont = useCallback(() => {
        if (!newFont.trim())
            return;
        setSansFonts((f) => (f.includes(newFont) ? f : [...f, newFont]));
        setMonoFonts((f) => (f.includes(newFont) ? f : [...f, newFont]));
        setNewFont("");
    }, [newFont]);
    const loadGoogleFont = useCallback((name) => {
        const id = `google-font-${name}`;
        if (!document.getElementById(id)) {
            const link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}&display=swap`;
            document.head.appendChild(link);
        }
    }, []);
    const setGoogleFont = useCallback((type, name) => {
        loadGoogleFont(name);
        const stack = `"${name}", ${type === "mono" ? "monospace" : "sans-serif"}`;
        if (type === "mono") {
            setMonoFonts((f) => (f.includes(stack) ? f : [...f, stack]));
            setToken("--font-mono", stack);
        }
        else {
            setSansFonts((f) => (f.includes(stack) ? f : [...f, stack]));
            setToken("--font-sans", stack);
        }
    }, [loadGoogleFont, setToken]);
    const { colors, fonts, others } = useMemo(() => {
        const c = [];
        const f = [];
        const o = [];
        const keys = new Set([
            ...Object.keys(baseTokens),
            ...Object.keys(tokens),
        ]);
        keys.forEach((k) => {
            const current = tokens[k] ?? baseTokens[k];
            const def = baseTokens[k];
            const info = {
                key: k,
                value: current,
                defaultValue: def,
                isOverridden: def !== undefined && current !== def,
            };
            if (k.startsWith("--color")) {
                c.push(info);
            }
            else if (k.startsWith("--font")) {
                f.push(info);
            }
            else {
                o.push(info);
            }
        });
        return { colors: c, fonts: f, others: o };
    }, [tokens, baseTokens]);
    return {
        colors,
        fonts,
        others,
        sansFonts,
        monoFonts,
        googleFonts,
        newFont,
        setNewFont,
        setToken,
        handleUpload,
        addCustomFont,
        setGoogleFont,
    };
}
