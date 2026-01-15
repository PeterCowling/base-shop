"use client";

import React from 'react';

export interface PrimeFileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const PrimeFileInput = React.forwardRef<HTMLInputElement, PrimeFileInputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} type="file" className={className} {...props} />
  ),
);

PrimeFileInput.displayName = 'PrimeFileInput';

export default PrimeFileInput;