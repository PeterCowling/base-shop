"use client";

import Providers from "@/components/Providers";
import RoomsGrid from "@/components/roomgrid/RoomsGrid";

export default function RoomsGridClient() {
  return (
    <Providers>
      <RoomsGrid />
    </Providers>
  );
}
