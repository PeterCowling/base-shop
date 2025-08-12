"use client";

import { NewsletterForm } from "./molecules";

interface Props {
  /** API endpoint to submit the email to */
  action?: string;
  /** Placeholder text for the email input */
  placeholder?: string;
  /** Label for the submit button */
  submitLabel?: string;
  /** Optional text displayed above the form */
  text?: string;
}

export default function NewsletterSignup({
  action,
  placeholder = "Email",
  submitLabel = "Subscribe",
  text,
}: Props) {
  return (
    <div className="space-y-2">
      {text && <p>{text}</p>}
      <NewsletterForm
        action={action}
        placeholder={placeholder}
        submitLabel={submitLabel}
      />
    </div>
  );
}

