// /src/components/bar/orderTaking/OrderTakingScreen.tsx

import React, { FC } from "react";
import {
  AggregatedOrder,
  CategoryType,
  Product,
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
    <div className="flex w-full h-auto font-body space-x-2">
      {/* LEFT panel */}
      <div className="flex-1 flex flex-col bg-white shadow rounded dark:bg-darkSurface">
        <CategoryHeader
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
        <ProductGrid products={products} onAddProduct={onAddProduct} />
        <PreorderButtons />
      </div>

      {/* RIGHT panel */}
      <div className="w-1/3 flex flex-col border border-info-main rounded shadow bg-white dark:bg-darkSurface">
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
      </div>
    </div>
    {children}
  </>
);

OrderTakingScreen.displayName = "OrderTakingScreen";
export default OrderTakingScreen;
