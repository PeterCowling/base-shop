// /src/components/bar/orderTaking/OrderTakingContainer.tsx

import { FC, memo, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import { useBleepersData } from "../../../hooks/data/bar/useBleepersData";
import { useProducts } from "../../../hooks/data/bar/useProducts";
import { useBleeperMutations } from "../../../hooks/mutations/useBleeperMutations";
import { useAddItemToOrder } from "../../../hooks/orchestrations/bar/actions/mutations/useAddItemToOrder";
import { useBarOrder } from "../../../hooks/orchestrations/bar/actions/mutations/useBarOrder";
import {
  AggregatedOrder,
  CategoryType,
  Product,
} from "../../../types/bar/BarTypes";
import OrderTakingScreen from "./OrderTakingScreen";
import IcedCoffeeSweetnessModal from "./modal/IcedCoffeeSweetnessModal";
import MixerModal from "./modal/MixerModal";
import SelectCoffeeOrTeaModal from "./modal/SelectCoffeeOrTeaModal";
import WithMilkModal from "./modal/WithMilkModal";
import { getItalyLocalTimeHHMM } from "../../../utils/dateUtils";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const icedCoffeeKeywords = ["iced americano", "iced latte", "iced mocha"];
const isIcedCoffee = (n: string): boolean =>
  icedCoffeeKeywords.some((kw) => n.toLowerCase().includes(kw));

type MenuType = "food" | "nonalcoholic" | "alcoholic" | "other";

interface OrderTakingContainerProps {
  menuType: MenuType;
}

const OrderTakingContainer: FC<OrderTakingContainerProps> = memo(
  ({ menuType }) => {
    /* ---------------- Context / hooks ---------------------------------- */
    const { user } = useAuth();
    const {
      unconfirmedOrder,
      removeItemFromOrder,
      clearOrder,
      confirmOrder,
      updateItemInOrder,
    } = useBarOrder();
    const { addItemToOrder: addItemToOrderDb, error: addItemError } =
      useAddItemToOrder({
        mapToLineType: (c) => (c?.toLowerCase() === "kitchen" ? "kds" : "bds"),
      });
    const { bleepers, firstAvailableBleeper, findNextAvailableBleeper } =
      useBleepersData();
    const { setBleeperAvailability } = useBleeperMutations();
    const { getProductsByCategory, getProductCategory2: getSubCat } =
      useProducts();

    /* ---------------- Local state -------------------------------------- */
    const [bleepNumber, setBleepNumber] = useState("");
    const [selectedCategory, setSelectedCategory] =
      useState<CategoryType>("Sweet");

    /** remembers the **last caffeinated** product tapped until it’s merged */
    const [lastCaffClick, setLastCaffClick] = useState<{
      name: string;
      price: number;
    } | null>(null);

    /* modal flow */
    const [pendingMixedDrink, setPendingMixedDrink] = useState<{
      name: string;
      price: number;
    } | null>(null);
    const [pendingMilkChoice, setPendingMilkChoice] = useState<{
      name: string;
      price: number;
    } | null>(null);
    const [pendingIcedCoffee, setPendingIcedCoffee] = useState<{
      name: string;
      price: number;
    } | null>(null);
    const [milkName, setMilkName] = useState("");
    const [milkPrice, setMilkPrice] = useState(0);
    const [showSelectBaseModal, setShowSelectBaseModal] = useState(false);

    /* ---------------- Category plumbing -------------------------------- */
    const categories: CategoryType[] = useMemo(() => {
      switch (menuType) {
        case "food":
          return ["Sweet", "Savory", "Gelato"];
        case "nonalcoholic":
          return ["Coffee", "Tea", "Juices", "Smoothies", "Soda"];
        case "alcoholic":
          return ["Beer", "Wine", "Spritz", "Mixed Drinks", "Cocktails"];
        default:
          return ["Other"];
      }
    }, [menuType]);

    useEffect(() => {
      if (!categories.includes(selectedCategory)) {
        setSelectedCategory(categories[0]);
      }
    }, [categories, selectedCategory]);

    const categoryToId: Record<CategoryType, number> = useMemo(
      () => ({
        Sweet: 1,
        Savory: 2,
        Coffee: 3,
        Tea: 4,
        Beer: 5,
        Wine: 6,
        Spritz: 7,
        "Mixed Drinks": 8,
        Cocktails: 9,
        Other: 10,
        Gelato: 11,
        Juices: 13,
        Smoothies: 14,
        Soda: 15,
      }),
      []
    );

    const displayedProducts: Product[] = useMemo(() => {
      const rows = getProductsByCategory(categoryToId[selectedCategory]);
      return rows.map((r) => ({ name: r[0], price: r[2], bgColor: r[3] }));
    }, [selectedCategory, categoryToId, getProductsByCategory]);

    /* ---------------- Utility: isCaffeinated --------------------------- */
    const isCaffeinated = useCallback(
      (prod: string): boolean => {
        const codes = ["coffee", "tea", "caffeinatedSoftDrink", "energyDrink"];
        const sub = getSubCat(prod);
        if (sub && codes.includes(sub)) return true;

        const lower = prod.toLowerCase();
        return [
          "coffee",
          "espresso",
          "americano",
          "latte",
          "mocha",
          "cappuccino",
          "macchiato",
          "tea",
          "cola",
          "energy",
          "red bull",
          "monster",
        ].some((kw) => lower.includes(kw));
      },
      [getSubCat]
    );

    /* ---------------- Add‑product handler ------------------------------ */
    const categoryCode = menuType === "food" ? "Kitchen" : "Bar";

    const handleAddProduct = useCallback(
      (name: string, price: number): void => {
        /* 1. Mixed drink */
        if (selectedCategory === "Mixed Drinks") {
          setPendingMixedDrink({ name, price });
          return;
        }

        /* 2. Iced coffee */
        if (isIcedCoffee(name)) {
          setPendingIcedCoffee({ name, price });
          return;
        }

        /* 3. Base Americano/Tea quick path */
        if (name === "Americano" || name === "Breakfast Tea") {
          setPendingMilkChoice({ name, price });
          return;
        }

        /* 4. Milk add‑on branch ---------------------------------------- */
        if (getSubCat(name) === "milkAddOn") {
          /** first look in the live order */
          const caffeinatedItems =
            unconfirmedOrder?.items.filter((o) => isCaffeinated(o.product)) ??
            [];

          /** optimistic fallback using last click  */
          if (caffeinatedItems.length === 0 && lastCaffClick) {
            updateItemInOrder(
              lastCaffClick.name,
              `${lastCaffClick.name} + ${name}`,
              lastCaffClick.price + price
            );
            setLastCaffClick(null);
            return;
          }

          if (caffeinatedItems.length === 0) {
            alert("There are no caffeinated items to attach this milk to.");
            return;
          }

          if (caffeinatedItems.length === 1) {
            const [single] = caffeinatedItems;
            updateItemInOrder(
              single.product,
              `${single.product} + ${name}`,
              (single.price ?? 0) + price
            );
            setLastCaffClick(null);
            return;
          }

          /* multiple: ask user */
          setMilkName(name);
          setMilkPrice(price);
          setShowSelectBaseModal(true);
          return;
        }

        /* 5. Default add */
        addItemToOrderDb(name, price, categoryCode);

        /* store optimistic last‑click if caffeinated */
        if (isCaffeinated(name)) setLastCaffClick({ name, price });
      },
      [
        selectedCategory,
        /* isIcedCoffee intentionally excluded: stable reference defined outside component */
        isCaffeinated,
        getSubCat,
        unconfirmedOrder,
        lastCaffClick,
        updateItemInOrder,
        addItemToOrderDb,
        categoryCode,
      ]
    );

    /* ---------------- Modal attach callback ---------------------------- */
    const handleSelectBaseProduct = useCallback(
      (baseName: string): void => {
        const baseItem =
          unconfirmedOrder?.items.find((i) => i.product === baseName) ??
          lastCaffClick;
        const newPrice = (baseItem?.price ?? 0) + milkPrice;
        updateItemInOrder(baseName, `${baseName} + ${milkName}`, newPrice);
        setShowSelectBaseModal(false);
        setLastCaffClick(null);
      },
      [unconfirmedOrder, lastCaffClick, milkName, milkPrice, updateItemInOrder]
    );

    /* -------------------- BLEEPER auto‑fill ------------------------------ */
    useEffect(() => {
      if (!bleepNumber.trim() && firstAvailableBleeper) {
        setBleepNumber(firstAvailableBleeper.toString());
      }
    }, [bleepNumber, firstAvailableBleeper]);

    /* ----------------------- Confirm payment ----------------------------- */
    const doConfirmPayment = useCallback(
      async (method: "cash" | "card", usage: "bleep" | "go"): Promise<void> => {
        const userName = user?.user_name ?? "unknown";
        const time = getItalyLocalTimeHHMM();
        let finalBleep = "go";

        const chooseNext = (): void => {
          const next = findNextAvailableBleeper();
          if (next !== null) finalBleep = next.toString();
        };

        if (usage === "go") {
          chooseNext();
        } else {
          const typed = bleepNumber.trim().toLowerCase();
          if (!typed || typed === "go") chooseNext();
          else {
            const num = Number(typed);
            if (Number.isNaN(num) || num < 1 || num > 18) chooseNext();
            else if (!bleepers[num]) {
              const next =
                findNextAvailableBleeper(num + 1) ?? findNextAvailableBleeper();
              if (next !== null) finalBleep = next.toString();
            } else {
              finalBleep = num.toString();
            }
          }
        }

        if (finalBleep !== "go") {
          const n = Number(finalBleep);
          if (!Number.isNaN(n)) await setBleeperAvailability(n, false);
        }

        confirmOrder(finalBleep, userName, time, method);
        setBleepNumber("");
      },
      [
        user,
        bleepNumber,
        bleepers,
        confirmOrder,
        findNextAvailableBleeper,
        setBleeperAvailability,
      ]
    );

    /* -------------------- Aggregated orders ----------------------------- */
    const aggregatedOrders: AggregatedOrder[] = useMemo(
      () =>
        unconfirmedOrder?.items.map((item) => ({
          product: item.product,
          price: item.price ?? 0,
          count: item.count,
        })) ?? [],
      [unconfirmedOrder]
    );

    const totalPrice = useMemo(
      () =>
        aggregatedOrders.reduce(
          (sum, item) => sum + item.price * item.count,
          0
        ),
      [aggregatedOrders]
    );

    /* -------------------------- RENDER ---------------------------------- */
    return (
      <OrderTakingScreen
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        products={displayedProducts}
        onAddProduct={handleAddProduct}
        orders={aggregatedOrders}
        onRemoveItem={removeItemFromOrder}
        onClearAll={clearOrder}
        onConfirmPayment={doConfirmPayment}
        bleepNumber={bleepNumber}
        onBleepNumberChange={setBleepNumber}
        totalPrice={totalPrice}
      >
        {/* ---------------------- Modals ---------------------- */}
        {pendingMixedDrink && (
          <MixerModal
            onSelect={(mixerChoice: string): void => {
              if (!pendingMixedDrink) return;
              const finalName =
                mixerChoice === "nothing"
                  ? pendingMixedDrink.name
                  : `${pendingMixedDrink.name} + ${mixerChoice.replace(
                      "Mixer ",
                      ""
                    )}`;
              addItemToOrderDb(
                finalName,
                pendingMixedDrink.price,
                categoryCode
              );
              setPendingMixedDrink(null);
            }}
            onCancel={(): void => setPendingMixedDrink(null)}
          />
        )}

        {pendingMilkChoice && (
          <WithMilkModal
            productName={pendingMilkChoice.name}
            basePrice={pendingMilkChoice.price}
            onSelectMilkOption={(
              finalName: string,
              finalPrice: number
            ): void => {
              addItemToOrderDb(finalName, finalPrice, categoryCode);
              setPendingMilkChoice(null);
            }}
            onCancel={(): void => setPendingMilkChoice(null)}
          />
        )}

        {pendingIcedCoffee && (
          <IcedCoffeeSweetnessModal
            productName={pendingIcedCoffee.name}
            basePrice={pendingIcedCoffee.price}
            onSelectSweetness={(
              finalName: string,
              finalPrice: number
            ): void => {
              addItemToOrderDb(finalName, finalPrice, categoryCode);
              setPendingIcedCoffee(null);
            }}
            onCancel={(): void => setPendingIcedCoffee(null)}
          />
        )}

        {showSelectBaseModal && (
          <SelectCoffeeOrTeaModal
            coffeeOrTeaOrders={aggregatedOrders.filter((o) =>
              isCaffeinated(o.product)
            )}
            milkName={milkName}
            onSelectOrder={handleSelectBaseProduct}
            onCancel={(): void => setShowSelectBaseModal(false)}
          />
        )}

        {/* ---------------------- Error banner ----------------- */}
        {!!addItemError && (
          <div className="text-red-500 p-2">
            Error adding item to order: {String(addItemError)}
          </div>
        )}
      </OrderTakingScreen>
    );
  }
);

OrderTakingContainer.displayName = "OrderTakingContainer";
export default OrderTakingContainer;
