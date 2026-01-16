import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

export type ContainerProps = HTMLAttributes<HTMLDivElement>;

export default function Container({ className, ...props }: ContainerProps) {
  return <div className={clsx('mx-auto w-full', className)} {...props} />;
}
