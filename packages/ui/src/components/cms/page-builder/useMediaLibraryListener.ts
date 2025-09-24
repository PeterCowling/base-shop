import { useEffect } from "react";

type Listener = (event: Event) => void;

const useMediaLibraryListener = (listener: Listener) => {
  useEffect(() => {
    if (!listener) return;
    window.addEventListener("pb:insert-image", listener as EventListener);
    return () => {
      window.removeEventListener("pb:insert-image", listener as EventListener);
    };
  }, [listener]);
};

export default useMediaLibraryListener;
