"use client";

import { useEffect, useState } from "react";
import { listLibrary, syncFromServer, removeLibrary, updateLibrary, type LibraryItem } from "../libraryStore";

export default function useLibraries(shop: string | null | undefined) {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [globalLibrary, setGlobalLibrary] = useState<LibraryItem[]>([]);

  useEffect(() => {
    setLibrary(listLibrary(shop));
    void syncFromServer(shop).then((remote) => { if (remote) setLibrary(remote); });
    setGlobalLibrary(listLibrary("_global"));
    void syncFromServer("_global").then((remote) => { if (remote) setGlobalLibrary(remote); });
  }, [shop]);

  useEffect(() => {
    const handler = () => {
      setLibrary(listLibrary(shop));
      setGlobalLibrary(listLibrary("_global"));
    };
    window.addEventListener("pb-library-changed", handler);
    return () => window.removeEventListener("pb-library-changed", handler);
  }, [shop]);

  return {
    library,
    setLibrary,
    globalLibrary,
    setGlobalLibrary,
    removeLibrary,
    updateLibrary,
  } as const;
}

