"use client";

import { Input, type InputProps } from '@acme/design-system/primitives';
import React from 'react';

export type PrimeInputProps = InputProps;

const PrimeInput = React.forwardRef<HTMLInputElement, PrimeInputProps>(
  ({ className, wrapperClassName, ...props }, ref) => (
    <Input
      ref={ref}
      wrapperClassName={wrapperClassName ?? 'contents'}
      className={className ? `h-auto ${className}` : 'h-auto'}
      {...props}
    />
  ),
);

PrimeInput.displayName = 'PrimeInput';

export default PrimeInput;