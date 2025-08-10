"use client";

export default function ContactForm({
  action = "#",
  method = "post",
}: {
  action?: string;
  method?: string;
}) {
  return (
    <form className="space-y-2" action={action} method={method}>
      <input
        type="text"
        name="name"
        placeholder="Name"
        className="w-full rounded border p-2"
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        className="w-full rounded border p-2"
      />
      <textarea
        name="message"
        placeholder="Message"
        className="w-full rounded border p-2"
      />
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2 text-primary-fg"
      >
        Submit
      </button>
    </form>
  );
}
