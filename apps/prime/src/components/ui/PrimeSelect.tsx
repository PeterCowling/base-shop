"use client";

import React from 'react';

export interface PrimeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const PrimeSelect = React.forwardRef<HTMLSelectElement, PrimeSelectProps>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={className} {...props} />
  ),
);

PrimeSelect.displayName = 'PrimeSelect';

export default PrimeSelect;