// src/components/bar/Bar.tsx
import React, { FC, useCallback, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { ScreenType } from "../../types/bar/BarTypes";
import CompScreenComponent from "./CompScreen";
import HeaderControls from "./HeaderControls";
import OrderTakingContainer from "./orderTaking/OrderTakingContainer";
import SalesScreen from "./sales/SalesScreen";

/**
 * Extended menu type for bar screens.
 */
type MenuType = "food" | "alcoholic" | "nonalcoholic" | "other";

/**
 * BarRoot component:
 * - Manages screen switching (orderTaking, sales, comp).
 * - Manages which menuType is currently in use (food, alcoholic, etc.).
 */
const BarRoot: FC = React.memo(() => {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("orderTaking");
  const [menuType, setMenuType] = useState<MenuType>("food");

  const switchScreen = useCallback((screen: ScreenType) => {
    setCurrentScreen(screen);
  }, []);

  const content = useMemo(() => {
    switch (currentScreen) {
      case "orderTaking":
        return <OrderTakingContainer menuType={menuType} />;
      case "sales":
        return <SalesScreen />;
      case "comp":
        return <CompScreenComponent />;
      default:
        return <OrderTakingContainer menuType={menuType} />;
    }
  }, [currentScreen, menuType]);

  return (
    <div className="bg-gray-50 min-h-screen w-full font-body relative p-4 space-y-4 dark:bg-darkBg dark:text-darkAccentGreen">
      {user && (
        <HeaderControls
          currentUser={user.user_name}
          onScreenChange={switchScreen}
          menuType={menuType}
          onSelectMenuType={setMenuType}
        />
      )}
      <div className="shadow bg-white p-4 rounded dark:bg-darkSurface">{content}</div>
    </div>
  );
});

BarRoot.displayName = "BarRoot";
export default BarRoot;
