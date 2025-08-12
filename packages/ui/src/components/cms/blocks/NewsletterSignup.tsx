"use client";

export default function NewsletterSignup({
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  action = "/api/newsletter",
}: {
  placeholder?: string;
  buttonText?: string;
  action?: string;
}) {
  return (
    <form className="space-y-2" action={action} method="post">
      <input
        type="email"
        name="email"
        placeholder={placeholder}
        className="w-full rounded border p-2"
      />
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2 text-primary-fg"
      >
        {buttonText}
      </button>
    </form>
  );
}
