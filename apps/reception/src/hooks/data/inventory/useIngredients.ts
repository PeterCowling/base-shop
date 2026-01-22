import { useCallback, useMemo, useState } from "react";
import { get, ref, set } from "firebase/database";

import { useFirebaseDatabase } from "../../../services/useFirebase";
import useFirebaseSubscription from "../useFirebaseSubscription";

export interface Ingredient {
  name: string;
  quantity: number;
}

export type IngredientsMap = Record<string, Ingredient>;

export default function useIngredients() {
  const database = useFirebaseDatabase();
  const {
    data: rawData,
    loading,
    error: subscriptionError,
  } = useFirebaseSubscription<Record<string, { quantity: number }>>(
    "inventory/ingredients"
  );
  const [mutationError, setMutationError] = useState<unknown>(null);

  const ingredients = useMemo(() => {
    if (!rawData) return {} as IngredientsMap;
    const mapped: IngredientsMap = {};
    Object.entries(rawData).forEach(([name, info]) => {
      mapped[name] = { name, quantity: info.quantity ?? 0 };
    });
    return mapped;
  }, [rawData]);

  const updateIngredient = useCallback(
    async (name: string, quantity: number): Promise<void> => {
      try {
        await set(ref(database, `inventory/ingredients/${name}`), { quantity });
      } catch (err) {
        setMutationError(err);
        throw err;
      }
    },
    [database]
  );

  const decrementIngredient = useCallback(
    async (name: string, amount: number): Promise<void> => {
      try {
        const ingRef = ref(database, `inventory/ingredients/${name}/quantity`);
        const snap = await get(ingRef);
        const current = snap.exists() ? (snap.val() as number) : 0;
        const newQty = current - amount;
        await set(ingRef, newQty < 0 ? 0 : newQty);
      } catch (err) {
        setMutationError(err);
        throw err;
      }
    },
    [database]
  );

  const error = mutationError || subscriptionError;

  return useMemo(
    () => ({
      ingredients,
      loading,
      error,
      updateIngredient,
      decrementIngredient,
    }),
    [ingredients, loading, error, updateIngredient, decrementIngredient]
  );
}
