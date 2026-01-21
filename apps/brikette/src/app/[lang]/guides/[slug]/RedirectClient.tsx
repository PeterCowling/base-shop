"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  destination: string;
};

export default function RedirectClient({ destination }: Props) {
  const router = useRouter();

  useEffect(() => {
    // Preserve query string and hash from current URL
    const { search, hash } = window.location;
    const target = `${destination}${search}${hash}`;
    router.replace(target);
  }, [destination, router]);

  return null;
}
