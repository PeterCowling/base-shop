// /src/components/bar/orderTaking/OrderTakingScreen.tsx

import React, { type FC } from "react";

import { Stack } from "@acme/design-system/primitives";

import {
  type AggregatedOrder,
  type CategoryType,
  type Product,
} from "../../../types/bar/BarTypes";

import CategoryHeader from "./CategoryHeader";
import OrderList from "./OrderList";
import PaymentSection from "./PaymentSection";
import PreorderButtons from "./preorder/PreorderButtons";
import ProductGrid from "./ProductGrid";

export interface OrderTakingScreenProps {
  categories: CategoryType[];
  selectedCategory: CategoryType;
  onSelectCategory: (cat: CategoryType) => void;
  products: Product[];
  onAddProduct: (name: string, price: number) => void;
  orders: AggregatedOrder[];
  onRemoveItem: (name: string) => void;
  onClearAll: () => void;
  onConfirmPayment: (method: "cash" | "card", usage: "bleep" | "go") => void;
  bleepNumber: string;
  onBleepNumberChange: (v: string) => void;
  totalPrice: number;
  children?: React.ReactNode; // allow modals
}

const OrderTakingScreen: FC<OrderTakingScreenProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  products,
  onAddProduct,
  orders,
  onRemoveItem,
  onClearAll,
  onConfirmPayment,
  bleepNumber,
  onBleepNumberChange,
  totalPrice,
  children,
}) => (
  <>
    <div className="flex w-full h-auto font-body gap-3 p-3">
      {/* LEFT panel */}
      <Stack gap={0} className="flex-1 bg-surface rounded-lg overflow-hidden">
        <CategoryHeader
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
        <ProductGrid products={products} onAddProduct={onAddProduct} />
        <PreorderButtons />
      </Stack>

      {/* RIGHT panel */}
      <Stack gap={0} className="w-1/3 border border-border-2 rounded-lg shadow-md bg-surface overflow-hidden">
        <OrderList
          orders={orders}
          onRemoveItem={onRemoveItem}
          onClearAll={onClearAll}
          onConfirmPayment={onConfirmPayment}
        />
        <PaymentSection
          bleepNumber={bleepNumber}
          onBleepNumberChange={onBleepNumberChange}
          totalPrice={totalPrice}
        />
      </Stack>
    </div>
    {children}
  </>
);

OrderTakingScreen.displayName = "OrderTakingScreen";
export default OrderTakingScreen;
