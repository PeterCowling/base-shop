"use client";

import * as React from "react";

import CatalogConsole from "../components/catalog/CatalogConsole.client";

import UploaderShell from "./UploaderShell.client";

export default function UploaderHomeClient({
  displayClassName,
  monoClassName,
}: {
  displayClassName: string;
  monoClassName: string;
}) {
  const [headerExtra, setHeaderExtra] = React.useState<React.ReactNode>(null);

  return (
    <UploaderShell
      displayClassName={displayClassName}
      monoClassName={monoClassName}
      page="console"
      headerExtra={headerExtra}
    >
      <CatalogConsole monoClassName={monoClassName} onHeaderExtra={setHeaderExtra} />
    </UploaderShell>
  );
}
