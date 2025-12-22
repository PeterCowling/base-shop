"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SupplierCreateCard from "./SupplierCreateCard";
import SupplierTermsCard from "./SupplierTermsCard";
import SuppliersList from "./SuppliersList";
import type { SupplierOption, SuppliersStrings, SupplierSummary } from "./types";

export default function SuppliersClient({
  strings,
}: {
  strings: SuppliersStrings;
}) {
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/suppliers?limit=50");
      if (!response.ok) return;
      const data = (await response.json()) as {
        ok?: boolean;
        suppliers?: SupplierSummary[];
      };
      if (data.ok && Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  const options = useMemo<SupplierOption[]>(
    () =>
      suppliers.map((supplier) => ({
        id: supplier.id,
        label: supplier.name,
      })),
    [suppliers],
  );

  return (
    <div className="grid gap-6">
      <SupplierCreateCard
        loading={loading}
        strings={strings}
        onCreated={loadSuppliers}
      />
      <SupplierTermsCard
        suppliers={options}
        loading={loading}
        strings={strings}
        onAdded={loadSuppliers}
      />
      <SuppliersList suppliers={suppliers} loading={loading} strings={strings} />
    </div>
  );
}
