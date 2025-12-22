/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] class names are not user-facing */
import React from "react";
import clsx from "clsx";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<CardProps> = ({ className, ...rest }) => (
  <div className={clsx("rounded-lg border border-gray-200 bg-white shadow-sm", className)} {...rest} />
);

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export const CardHeader: React.FC<CardHeaderProps> = ({ className, ...rest }) => (
  <div className={clsx("p-4 border-b border-gray-100", className)} {...rest} />
);

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;
export const CardContent: React.FC<CardContentProps> = ({ className, ...rest }) => (
  <div className={clsx("p-4", className)} {...rest} />
);

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;
export const CardFooter: React.FC<CardFooterProps> = ({ className, ...rest }) => (
  <div className={clsx("p-3 border-t border-gray-100", className)} {...rest} />
);

export default Object.assign(Card, { Header: CardHeader, Content: CardContent, Footer: CardFooter });
