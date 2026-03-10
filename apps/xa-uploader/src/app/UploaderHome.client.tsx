"use client";

import CatalogConsole from "../components/catalog/CatalogConsole.client";

import UploaderShell from "./UploaderShell.client";

export default function UploaderHomeClient({
  displayClassName,
  monoClassName,
}: {
  displayClassName: string;
  monoClassName: string;
}) {
  return (
    <UploaderShell
      displayClassName={displayClassName}
      monoClassName={monoClassName}
    >
      <CatalogConsole monoClassName={monoClassName} />
    </UploaderShell>
  );
}
