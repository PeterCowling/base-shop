/* File: /src/hooks/client/cityTax/useCityTaxAmount.ts */

import { useEffect, useState } from "react";

import useCityTax from "../../../hooks/data/useCityTax";
import { type PayType } from "../../../types/domains/cityTaxDomain";
import { type CityTaxRecord } from "../../../types/hooks/data/cityTaxData";

import useComputeOutstandingCityTax from "./useComputeOutstandingCityTax";

/**
 * Client hook that combines:
 *  - cityTax data from useCityTax()
 *  - a local payType state
 *  - a computed `amount` based on occupant's tax record
 */
export default function useCityTaxAmount(
  bookingRef: string,
  occupantId: string,
  initialTaxRecord?: CityTaxRecord
) {
  const { cityTax, loading: hookLoading } = useCityTax();
  const loading = initialTaxRecord ? false : hookLoading;
  const { computeOutstandingCityTax } = useComputeOutstandingCityTax();

  const [payType, setPayType] = useState<PayType>("CASH");
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (loading || !bookingRef || !occupantId) {
      setAmount(0);
      return;
    }

    const occupantTax = initialTaxRecord ?? cityTax[bookingRef]?.[occupantId];
    const outstanding = computeOutstandingCityTax(occupantTax, payType);

    setAmount(outstanding);
  }, [
    bookingRef,
    occupantId,
    payType,
    computeOutstandingCityTax,
    cityTax,
    initialTaxRecord,
    loading,
  ]);
  return {
    payType,
    setPayType,
    amount,
    loading,
  };
}
