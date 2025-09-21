// apps/cms/src/app/cms/blog/sanity/connect/ConfirmationStep.tsx
"use client";

interface Props {
  message: string;
}

export default function ConfirmationStep({ message }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-success">{message}</p>
    </div>
  );
}
