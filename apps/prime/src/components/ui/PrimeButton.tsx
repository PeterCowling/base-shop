'use client';

import { Button, type ButtonProps } from '@acme/ui';
import classNames from 'classnames';

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
      className={classNames(intentClasses[intent], className)}
    />
  );
}

export default PrimeButton;