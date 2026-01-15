"use client";

import React from 'react';

export interface PrimeRadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const PrimeRadio = React.forwardRef<HTMLInputElement, PrimeRadioProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} type="radio" className={className} {...props} />
  ),
);

PrimeRadio.displayName = 'PrimeRadio';

export default PrimeRadio;