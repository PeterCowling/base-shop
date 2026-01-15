"use client";

import { Textarea, type TextareaProps } from '@acme/ui';
import React from 'react';

export type PrimeTextareaProps = TextareaProps;

const PrimeTextarea = React.forwardRef<HTMLTextAreaElement, PrimeTextareaProps>(
  ({ className, wrapperClassName, ...props }, ref) => (
    <Textarea
      ref={ref}
      wrapperClassName={wrapperClassName ?? 'contents'}
      className={
        className ? `min-h-0 h-auto ${className}` : 'min-h-0 h-auto'
      }
      {...props}
    />
  ),
);

PrimeTextarea.displayName = 'PrimeTextarea';

export default PrimeTextarea;