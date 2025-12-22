"use client";

import React, { useMemo } from "react";
import Button from "@/components/Button";

type CheckoutButtonProps = {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  label: string;
  loadingLabel: string;
};

const CheckoutButton = React.memo(function CheckoutButton({
  onClick,
  disabled,
  isLoading,
  label,
  loadingLabel,
}: CheckoutButtonProps) {
  const content = useMemo(() => (isLoading ? loadingLabel : label), [isLoading, label, loadingLabel]);
  return (
    <Button type="button" onClick={onClick} disabled={disabled || isLoading}>
      {content}
    </Button>
  );
});

export default CheckoutButton;
