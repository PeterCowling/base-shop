"use client";

import React from 'react';

export interface PrimeCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const PrimeCheckbox = React.forwardRef<HTMLInputElement, PrimeCheckboxProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} type="checkbox" className={className} {...props} />
  ),
);

PrimeCheckbox.displayName = 'PrimeCheckbox';

export default PrimeCheckbox;