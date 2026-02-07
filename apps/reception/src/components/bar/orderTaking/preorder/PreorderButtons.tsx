// src/components/bar/orderTaking/preorder/PreorderButtons.tsx

import {
  type FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type DataSnapshot,
  getDatabase,
  off,
  onValue,
  ref,
  remove,
} from "firebase/database";

import { useAuth } from "../../../../context/AuthContext";
import { useBleepersData } from "../../../../hooks/data/bar/useBleepersData";
import { useBleeperMutations } from "../../../../hooks/mutations/useBleeperMutations";
import { useConfirmOrder } from "../../../../hooks/orchestrations/bar/actions/mutations/useConfirmOrder";
import { useDeletePreorder } from "../../../../hooks/orchestrations/bar/actions/mutations/useDeletePreorder";
import {
  getCurrentDateInRome,
  getItalyLocalDateParts,
  getItalyLocalTimeHHMM,
  timeToMinutes,
} from "../../../../utils/dateUtils";

/* ------------------------------------------------------------------ */
/* 🔹 Helpers                                                          */
/* ------------------------------------------------------------------ */
function getPreorderType(): "breakfastPreorders" | "evDrinkPreorders" | null {
  const now = getCurrentDateInRome();
  const hour = now.getHours();
  if (hour >= 7 && hour < 11) return "breakfastPreorders";
  if (hour >= 18 && hour < 21) return "evDrinkPreorders";
  return null;
}

/* ------------------------------------------------------------------ */
/* 🔹 Types                                                            */
/* ------------------------------------------------------------------ */
export interface PreorderButtonData {
  transactionId: string;
  preorderType: "breakfastPreorders" | "evDrinkPreorders";
  monthName: string;
  day: string;
  preorderTime: string;
  firstName: string;
  surname: string;
  uuid: string;
  items: {
    count: number;
    lineType: "bds" | "kds";
    price: number;
    product: string;
  }[];
}

export interface PreorderOrder {
  uuid: string;
  guestFirstName: string;
  guestSurname: string;
  confirmed: boolean;
  paymentMethod: "complimentary";
  items: {
    count: number;
    lineType: "bds" | "kds";
    price: number;
    product: string;
  }[];
}

interface PreorderButtonDataWithRemoval extends PreorderButtonData {
  /* When true we trigger the fade‑out transition before removing */
  isRemoving?: boolean;
}

interface PreorderButtonProps {
  data: PreorderButtonDataWithRemoval;
  onClick: (order: PreorderOrder) => void;
}

interface ConfirmDeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/* ------------------------------------------------------------------ */
/* 🔹 Confirm‑delete modal                                             */
/* ------------------------------------------------------------------ */
const ConfirmDeleteModal: FC<ConfirmDeleteModalProps> = memo(
  ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[300px] rounded-lg bg-white p-6 shadow-xl dark:bg-darkSurface dark:text-darkAccentGreen">
        <p className="mb-4 text-center text-sm font-medium text-gray-700 dark:text-darkAccentGreen">
          Are you sure you want to delete this preorder?
        </p>
        <div className="flex justify-evenly">
          <button
            className="rounded bg-red-500 px-4 py-1 text-white outline-none transition-colors hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-red-400 dark:bg-darkSurface dark:text-darkAccentGreen"
            onClick={onConfirm}
          >
            Yes
          </button>
          <button
            className="rounded bg-gray-300 px-4 py-1 text-black outline-none transition-colors hover:bg-gray-400 focus-visible:ring-2 focus-visible:ring-gray-400 dark:bg-darkSurface dark:text-darkAccentGreen"
            onClick={onCancel}
          >
            No
          </button>
        </div>
      </div>
    </div>
  )
);
ConfirmDeleteModal.displayName = "ConfirmDeleteModal";

/* ------------------------------------------------------------------ */
/* 🔹 PreorderButton                                                   */
/* ------------------------------------------------------------------ */
const PreorderButton: FC<PreorderButtonProps> = memo(({ data, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { user } = useAuth();
  const userName = user?.user_name ?? "unknown";

  const { bleepers, firstAvailableBleeper, findNextAvailableBleeper } =
    useBleepersData();
  const { setBleeperAvailability } = useBleeperMutations();
  const [bleepNumber, setBleepNumber] = useState<string>("");

  /* Seed bleep number                                */
  useEffect(() => {
    if (!bleepNumber && firstAvailableBleeper) {
      setBleepNumber(firstAvailableBleeper.toString());
    }
  }, [bleepNumber, firstAvailableBleeper]);

  const { createSale } = useConfirmOrder({
    getCategoryTypeByProductName: () => "Other",
  });
  const { deletePreorder } = useDeletePreorder();

  /* Complimentary preorder object                    */
  const complimentaryOrder: PreorderOrder = useMemo(
    () => ({
      uuid: data.uuid,
      guestFirstName: data.firstName,
      guestSurname: data.surname,
      confirmed: true,
      paymentMethod: "complimentary",
      items: data.items,
    }),
    [data]
  );

  /* ────────────────────────────────────────────────
   * Single‑click  → mark as complimentary preorder
   * Double‑click → convert to zero‑price sale
   * ──────────────────────────────────────────────── */
  const handleClick = useCallback(
    () => onClick(complimentaryOrder),
    [complimentaryOrder, onClick]
  );

  const handleDoubleClick = useCallback(async () => {
    try {
      const saleItems = data.items.map((i) => ({ ...i, price: 0 }));

      /* 🛎️ Determine bleep number */
      let finalBleep = bleepNumber.trim().toLowerCase();
      if (!finalBleep || finalBleep === "go") {
        const next = findNextAvailableBleeper();
        finalBleep = next !== null ? next.toString() : "go";
      } else {
        const num = Number.parseInt(finalBleep, 10);
        if (!Number.isInteger(num) || num < 1 || num > 18 || !bleepers[num]) {
          const next = findNextAvailableBleeper(num + 1);
          finalBleep = next !== null ? next.toString() : "go";
        }
      }

      if (finalBleep !== "go") {
        await setBleeperAvailability(Number.parseInt(finalBleep, 10), false);
      }

      /* Create zero‑price sale record */
      const time = getItalyLocalTimeHHMM();

      const txnId = await createSale(
        saleItems,
        finalBleep,
        data.uuid,
        userName,
        time,
        "card",
        true,
        data.transactionId
      );

      /* Remove preorder if successful */
      if (txnId) {
        const db = getDatabase();
        const oldPath = ref(
          db,
          `barOrders/${data.preorderType}/${data.monthName}/${data.day}/${data.transactionId}`
        );
        await remove(oldPath);
      }
      setBleepNumber("");
    } catch (err) {
      console.error("Error converting preorder to sale:", err);
    }
  }, [
    bleepNumber,
    bleepers,
    data,
    findNextAvailableBleeper,
    setBleeperAvailability,
    userName,
    createSale,
  ]);

  /* Tooltip text                                       */
  const tooltipText = useMemo(
    () =>
      data.items?.length
        ? data.items.map((i) => `${i.count}× ${i.product}`).join("\n")
        : "No items found.",
    [data.items]
  );

  /* Delete workflow                                    */
  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const handleConfirmDelete = useCallback(async () => {
    setIsDeleteModalOpen(false);
    try {
      await deletePreorder(
        data.transactionId,
        data.preorderType,
        data.monthName,
        data.day
      );
    } catch (err) {
      console.error("Error deleting preorder:", err);
    }
  }, [data, deletePreorder]);

  /* ────────────────────────────────────────────────
   *  Render
   * ──────────────────────────────────────────────── */
  return (
    <div
      data-removing={Boolean(data.isRemoving)}
      className={`
        relative select-none
        transition-all duration-[800ms] ease-out
        data-[removing=true]:scale-75
        data-[removing=true]:opacity-0
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main button */}
      <button
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`
          group flex h-[80px] w-28 flex-col items-center justify-center gap-0.5
          rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600
          text-center font-semibold text-white shadow-lg ring-1 ring-inset ring-black/10
          transition-transform hover:scale-[1.02] active:scale-95
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300
        `}
      >
        <span className="text-sm">{data.preorderTime}</span>
        <span className="inline-flex items-center gap-1">
          <span className="truncate text-xs">{data.firstName}</span>
          <span className="truncate text-xs">{data.surname}</span>
        </span>

        {/* Badge with item count */}
        <span className="mt-0.5 rounded-full bg-white/20 px-2 text-[10px] font-bold backdrop-blur-sm dark:bg-darkSurface dark:text-darkAccentGreen">
          {data.items.length} items
        </span>
      </button>

      {/* Delete “×” */}
      <button
        type="button"
        aria-label="Delete preorder"
        onClick={openDeleteModal}
        className={`
          absolute right-0 top-0 z-20 flex h-5 w-5 translate-x-1/2 -translate-y-1/2
          items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white
          shadow-md ring-1 ring-inset ring-black/20 transition-colors
          hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300
        `}
      >
        ×
      </button>

      {/* Tooltip */}
      {isHovered && (
        <div
          className={`
            absolute bottom-full left-1/2 z-30 w-60 -translate-x-1/2
            whitespace-pre-line rounded-md bg-black/90 px-3 py-2 text-[13px] font-medium text-white
            shadow-lg backdrop-blur-md
            before:absolute before:bottom-[-6px] before:left-1/2 before:-translate-x-1/2
            before:h-3 before:w-3 before:rotate-45 before:rounded-sm before:bg-black/90
            dark:bg-darkSurface dark:text-darkAccentGreen dark:before:bg-darkSurface
          `}
        >
          {tooltipText}
        </div>
      )}

      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
});
PreorderButton.displayName = "PreorderButton";

/* ------------------------------------------------------------------ */
/* 🔹 PreorderButtons                                                  */
/* ------------------------------------------------------------------ */
type PreorderButtonsProps = Record<string, never>;

const PreorderButtons: FC<PreorderButtonsProps> = memo(() => {
    /* Firebase → snapshot state */
    const [snapshotData, setSnapshotData] = useState<PreorderButtonData[]>([]);

    /* Render state that supports fade‑out animation */
    const [displayData, setDisplayData] = useState<
      PreorderButtonDataWithRemoval[]
    >([]);
    const removalTimers = useRef<Record<string, NodeJS.Timeout>>({});

    /* Cleanup any pending removal timers when unmounting */
    useEffect(() => {
      const timers = removalTimers.current;
      return () => {
        Object.values(timers).forEach((timer) => {
          clearTimeout(timer);
        });
      };
    }, []);

    /* ────────────────────────────────────────────────
     * Firebase live listener
     * ──────────────────────────────────────────────── */

    useEffect(() => {
      const preorderType = getPreorderType();
      if (!preorderType) {
        setSnapshotData([]);
        return;
      }

      const { monthName, day } = getItalyLocalDateParts(0);
      const db = getDatabase();
      const pathRef = ref(db, `barOrders/${preorderType}/${monthName}/${day}`);

      onValue(pathRef, (snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          setSnapshotData([]);
          return;
        }
        const dataFromDb = snapshot.val();
        const newData: PreorderButtonData[] = Object.keys(dataFromDb).map(
          (txnId) => {
            const txnObj = dataFromDb[txnId];
            const firstName =
              txnObj.guestFirstName ?? txnObj.firstName ?? "Unknown";
            const surname = txnObj.guestSurname ?? txnObj.surname ?? "Unknown";

            let items: PreorderButtonData["items"] = [];
            if (Array.isArray(txnObj.items)) {
              if (
                txnObj.items.length > 0 &&
                typeof txnObj.items[0] === "string"
              ) {
                items = txnObj.items.map((str: string) => ({
                  count: 1,
                  lineType: "bds",
                  price: 0,
                  product: str,
                }));
              } else {
                items = txnObj.items;
              }
            }

            return {
              transactionId: txnId,
              preorderType,
              monthName,
              day,
              preorderTime: txnObj.preorderTime || "N/A",
              firstName,
              surname,
              uuid: txnObj.uuid || "",
              items,
            };
          }
        );
        setSnapshotData(newData);
      });

      return () => off(pathRef);
    }, []);

    /* ────────────────────────────────────────────────
     * Animate additions / removals
     * ──────────────────────────────────────────────── */
    useEffect(() => {
      const snapshotMap = new Map(
        snapshotData.map((i) => [i.transactionId, i])
      );

      setDisplayData((prev) => {
        /* Mark removed ones for fading */
        const updated = prev.map((o) => {
          if (!snapshotMap.has(o.transactionId)) {
            if (!o.isRemoving) {
              const fading = { ...o, isRemoving: true };
              removalTimers.current[o.transactionId] = setTimeout(() => {
                setDisplayData((curr) =>
                  curr.filter((x) => x.transactionId !== o.transactionId)
                );
                delete removalTimers.current[o.transactionId];
              }, 800);
              return fading;
            }
            return o;
          }
          const updatedData = snapshotMap.get(o.transactionId);
          return updatedData ? { ...o, ...updatedData } : o;
        });

        /* Add new ones */
        const existingIds = new Set(updated.map((u) => u.transactionId));
        snapshotData.forEach((s) => {
          if (!existingIds.has(s.transactionId)) {
            updated.push({ ...s, isRemoving: false });
          }
        });
        return updated;
      });
    }, [snapshotData]);

    /* Sort by earliest preorder time first */
    const sortedDisplayData = useMemo(
      () =>
        [...displayData].sort(
          (a, b) =>
            timeToMinutes(a.preorderTime) - timeToMinutes(b.preorderTime)
        ),
      [displayData]
    );

    /* Single‑click handler (complimentary flow) */
    const handlePreorderClick = useCallback((order: PreorderOrder) => {
      /* Replace with toast / mutation as desired */
      console.log("Complimentary order:", order);
    }, []);

    /* ────────────────────────────────────────────────
     *  Render
     * ──────────────────────────────────────────────── */
    return (
      <div
        id="preorder-buttons-container"
        className={`
        grid auto-rows-fr grid-flow-row gap-4 p-4
        border-t border-info-main/40 bg-gradient-to-b from-white to-slate-50
        dark:from-darkSurface dark:to-darkBg
        transition-all duration-[800ms] md:grid-cols-[repeat(auto-fill,minmax(7rem,1fr))]
      `}
      >
        {sortedDisplayData.map((data) => (
          <PreorderButton
            key={data.transactionId}
            data={data}
            onClick={handlePreorderClick}
          />
        ))}
      </div>
    );
  }
);
PreorderButtons.displayName = "PreorderButtons";

export default PreorderButtons;
