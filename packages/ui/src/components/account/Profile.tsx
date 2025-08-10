import { getCustomerSession } from "@auth";

export interface ProfileProps {
  title?: string;
  loginMessage?: string;
}

export async function Profile({
  title = "Profile",
  loginMessage = "Please log in to view your profile.",
}: ProfileProps = {}) {
  const session = await getCustomerSession();
  if (!session) return <p>{loginMessage}</p>;
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl">{title}</h1>
      <pre className="rounded bg-muted p-4">{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
