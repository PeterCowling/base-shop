import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Marketing Tools</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link href="/cms/marketing/email">Email Campaign</Link>
        </li>
        <li>
          <Link href="/cms/marketing/discounts">Discount Codes</Link>
        </li>
      </ul>
    </div>
  );
}
