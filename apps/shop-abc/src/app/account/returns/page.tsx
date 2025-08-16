import { useState } from "react";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import shop from "../../../../shop.json";

export const metadata = { title: "Returns" };

export default async function ReturnsPage() {
  if (!shop.luxuryFeatures?.returns) {
    return <p className="p-6">Returns are unavailable.</p>;
  }
  const cfg = await getReturnLogistics();
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Returns</h1>
      {cfg.dropOffProvider && <p>Drop-off: {cfg.dropOffProvider}</p>}
      <p>Carriers: {cfg.returnCarrier.join(", ")}</p>
      {shop.returnPolicyUrl && (
        <p>
          <a
            href={shop.returnPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Return policy
          </a>
        </p>
      )}
      <ReturnRequestForm />
    </div>
  );
}

function ReturnRequestForm() {
  "use client";
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [raId, setRaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRaId(null);
    try {
      const res = await fetch("/api/return-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setRaId(data.raId);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        className="w-full border p-2"
        placeholder="Order ID"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
      />
      <input
        className="w-full border p-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-primary px-4 py-2 text-primary-foreground"
        data-token="--color-primary"
      >
        {loading ? "Submitting…" : "Request Return"}
      </button>
      {raId && <p className="text-sm">Return Authorization: {raId}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
