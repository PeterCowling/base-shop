'use client';

import { Button, type ButtonProps } from '@acme/design-system/primitives';
import { cn } from '@acme/design-system/utils/style';

type PrimeButtonIntent = 'primary' | 'secondary';

export type PrimeButtonProps = Omit<ButtonProps, 'variant'> & {
  intent?: PrimeButtonIntent;
};

const intentClasses: Record<PrimeButtonIntent, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
};

export function PrimeButton({
  intent = 'primary',
  className,
  ...props
}: PrimeButtonProps) {
  return (
    <Button
      {...props}
      className={cn(intentClasses[intent], className)}
    />
  );
}

export default PrimeButton;