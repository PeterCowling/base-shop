import { useCallback, useMemo, useState } from "react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";
import { Cluster } from "@acme/design-system/primitives";

import { ActivityCode } from "../../../constants/activities";
import { withModalBackground } from "../../../hoc/withModalBackground";
import useActivitiesMutations from "../../../hooks/mutations/useActivitiesMutations";
import { useBookingDatesMutator } from "../../../hooks/mutations/useChangeBookingDatesMutator";
import useCityTaxMutation from "../../../hooks/mutations/useCityTaxMutation";
import { type CityTaxRecord } from "../../../types/hooks/data/cityTaxData";
import { addDays, formatDate, parseLocalDate } from "../../../utils/dateUtils";
import { roundDownTo50Cents } from "../../../utils/moneyUtils";
import { showToast } from "../../../utils/toastUtils";
import ModalContainer from "../../bar/orderTaking/modal/ModalContainer";

type ExtendType = "single" | "all";

export interface ExtensionPayModalProps {
  fullName: string;
  nightlyRate: number;
  occupantCount: number;
  nights: number;
  bookingRef: string;
  occupantId: string;
  occupantIds: string[];
  checkOutDate: string;
  bookingOccupants: Record<
    string,
    { checkInDate?: string; checkOutDate?: string }
  >;
  cityTaxRecords: Record<string, CityTaxRecord | undefined>;
  onClose: () => void;
  defaultExtendType?: ExtendType;
}

function ExtensionPayModalBase({
  fullName,
  nightlyRate,
  occupantCount,
  nights,
  bookingRef,
  occupantId,
  occupantIds,
  checkOutDate,
  bookingOccupants,
  cityTaxRecords,
  onClose,
  defaultExtendType,
}: ExtensionPayModalProps) {
  const [extendType, setExtendType] = useState<ExtendType>(
    defaultExtendType ?? "single"
  );
  const { updateBookingDates } = useBookingDatesMutator();
  const { saveCityTax } = useCityTaxMutation();
  const { saveActivity } = useActivitiesMutations();
  const [isSaving, setIsSaving] = useState(false);
  const [markCityTaxPaid, setMarkCityTaxPaid] = useState(false);
  const [markKeyExtended, setMarkKeyExtended] = useState(false);
  const handleClose = useCallback(() => onClose(), [onClose]);
  const pricePerGuest = roundDownTo50Cents(nightlyRate * nights);
  const showSingleOption = occupantCount === 1 || defaultExtendType !== "all";
  const showAllOption = occupantCount > 1 && defaultExtendType !== "single";

  const cityTaxTargets = useMemo(
    () => (extendType === "single" ? [occupantId] : occupantIds),
    [extendType, occupantId, occupantIds]
  );

  const defaultCityTaxPerGuest = useMemo(
    () => Number((nights * 2.5).toFixed(2)),
    [nights]
  );

  const displayedCityTaxTotal = useMemo(() => {
    const total = cityTaxTargets.reduce((sum, id) => {
      const record = cityTaxRecords[id];
      if (record && record.balance > 0) {
        return sum + record.balance;
      }
      return sum + defaultCityTaxPerGuest;
    }, 0);
    return Number(total.toFixed(2));
  }, [cityTaxTargets, cityTaxRecords, defaultCityTaxPerGuest]);


  const handleExtend = useCallback(async () => {
    const newCheckout = formatDate(
      addDays(parseLocalDate(checkOutDate) || new Date(checkOutDate), nights)
    );
    const targetOccupantIds = extendType === "single" ? [occupantId] : occupantIds;
    let updatedOccupants = 0;

    setIsSaving(true);
    try {
      for (const id of targetOccupantIds) {
        const occ = bookingOccupants[id] || {};
        const nextCheckOut =
          extendType === "single"
            ? newCheckout
            : formatDate(
                addDays(
                  parseLocalDate(occ.checkOutDate ?? checkOutDate) ||
                    new Date(occ.checkOutDate ?? checkOutDate),
                  nights,
                )
              );

        await updateBookingDates({
          bookingRef,
          occupantId: id,
          oldCheckIn: occ.checkInDate ?? "",
          oldCheckOut: occ.checkOutDate ?? "",
          newCheckIn: occ.checkInDate ?? "",
          newCheckOut: nextCheckOut,
          extendedPrice: String(pricePerGuest),
        });
        updatedOccupants += 1;
      }

      if (markCityTaxPaid) {
        await Promise.all(
          cityTaxTargets.map(async (id) => {
            const record = cityTaxRecords[id];
            if (record) {
              if (record.balance > 0) {
                await saveCityTax(bookingRef, id, {
                  balance: 0,
                  totalPaid: record.totalDue,
                });
                const cityTaxActivityResult = await saveActivity(id, {
                  code: ActivityCode.CITY_TAX_PAYMENT,
                });
                if (!cityTaxActivityResult.success) {
                  throw new Error(
                    cityTaxActivityResult.error ??
                      `Failed to save city tax activity for occupant ${id}.`
                  );
                }
              }
            }
          })
        );
      }
      if (markKeyExtended) {
        await Promise.all(
          cityTaxTargets.map(async (id) => {
            const keyActivityResult = await saveActivity(id, {
              code: ActivityCode.KEY_EXTENSION,
            });
            if (!keyActivityResult.success) {
              throw new Error(
                keyActivityResult.error ??
                  `Failed to save key extension activity for occupant ${id}.`
              );
            }
          })
        );
      }
      showToast("Extension saved", "success");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error extending booking";
      if (updatedOccupants > 0 && updatedOccupants < targetOccupantIds.length) {
        showToast(
          `Extension partially applied (${updatedOccupants}/${targetOccupantIds.length}). ${message}`,
          "error"
        );
      } else {
        showToast(message, "error");
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    bookingRef,
    occupantId,
    occupantIds,
    bookingOccupants,
    checkOutDate,
    extendType,
    nights,
    pricePerGuest,
    onClose,
    updateBookingDates,
    markCityTaxPaid,
    markKeyExtended,
    cityTaxTargets,
    cityTaxRecords,
    saveCityTax,
    saveActivity,
  ]);

  const amount =
    extendType === "single"
      ? pricePerGuest
      : roundDownTo50Cents(pricePerGuest * occupantCount);

  return (
    <ModalContainer widthClasses="w-96">
      <h2 className="text-xl font-semibold mb-4 text-center">Extend Booking</h2>

      <p className="mb-4 text-center">Guest: {fullName}</p>

      <div className="space-y-3 mb-6">
        {showSingleOption && (
          <label className="flex items-center space-x-2 cursor-pointer">
            <Input compatibilityMode="no-wrapper"
              type="radio"
              value="single"
              checked={extendType === "single"}
              onChange={() => setExtendType("single")}
              className="form-radio h-4 w-4 text-primary-main"
            />
            <span>Extend only this guest</span>
          </label>
        )}

        {showAllOption && (
          <label className="flex items-center space-x-2 cursor-pointer">
            <Input compatibilityMode="no-wrapper"
              type="radio"
              value="all"
              checked={extendType === "all"}
              onChange={() => setExtendType("all")}
              className="form-radio h-4 w-4 text-primary-main"
            />
            <span>Extend all guests in booking ({occupantCount})</span>
          </label>
        )}
      </div>

      <p className="font-semibold text-center mb-6">
        Collect:&nbsp;
        {amount.toLocaleString("it-IT", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>

      <p className="font-semibold text-center mb-6">
        Collect city tax:&nbsp;
        {displayedCityTaxTotal.toLocaleString("it-IT", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>

      <div className="space-y-2 mb-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <Input compatibilityMode="no-wrapper"
            type="checkbox"
            checked={markCityTaxPaid}
            onChange={(event) => setMarkCityTaxPaid(event.target.checked)}
            className="form-checkbox h-4 w-4 text-primary-main"
          />
          <span>Mark city tax as paid</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <Input compatibilityMode="no-wrapper"
            type="checkbox"
            checked={markKeyExtended}
            onChange={(event) => setMarkKeyExtended(event.target.checked)}
            className="form-checkbox h-4 w-4 text-primary-main"
          />
          <span>Confirm key has been extended</span>
        </label>
      </div>

      <Cluster gap={2} justify="center">
        <Button
          onClick={handleExtend}
          color="primary"
          tone="solid"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Extend"}
        </Button>{" "}
        <Button
          onClick={handleClose}
          color="default"
          tone="soft"
          disabled={isSaving}
        >
          Close
        </Button>
      </Cluster>
    </ModalContainer>
  );
}

ExtensionPayModalBase.displayName = "ExtensionPayModalBase";

const ExtensionPayModal = withModalBackground(ExtensionPayModalBase);
ExtensionPayModal.displayName = "ExtensionPayModal";

export default ExtensionPayModal;
