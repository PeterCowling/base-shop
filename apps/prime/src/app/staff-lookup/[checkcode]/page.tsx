export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ checkcode: string }[]> {
  return [];
}

export default function CheckInLookupPage() {
  return <div>Test</div>;
}
