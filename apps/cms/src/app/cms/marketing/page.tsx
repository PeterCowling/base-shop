import Link from 'next/link';

export default function Marketing() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Marketing Tools</h2>
      <ul className="list-disc pl-5">
        <li>
          <Link href="/cms/marketing/email">Email campaigns</Link>
        </li>
        <li>
          <Link href="/cms/marketing/discounts">Discount codes</Link>
        </li>
      </ul>
    </div>
  );
}
