import { redirect } from "next/navigation";

export default async function WizardRedirect(
  props: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else if (value !== undefined) {
      params.append(key, value);
    }
  }
  const query = params.size ? `?${params.toString()}` : "";
  redirect(`/cms/configurator${query}`);
}
