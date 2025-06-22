// src/components/pdp/SizeSelector.tsx
"use client";
import { useState } from "react";
export default function SizeSelector({ sizes, onSelect, }) {
    const [selected, setSelected] = useState(null);
    function handleClick(size) {
        setSelected(size);
        onSelect(size);
    }
    return (<div className="flex flex-wrap gap-2">
      {sizes.map((s) => (<button key={s} type="button" onClick={() => handleClick(s)} className={`px-3 py-1 border rounded-full text-sm ${selected === s
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-100"}`}>
          {s}
        </button>))}
    </div>);
}
