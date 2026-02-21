import CollectionSectionServer from "@acme/cms-ui/blocks/CollectionSection.server";

export const revalidate = 60;

export default async function Page(
  props: { params: Promise<{ lang: string; slug: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return <CollectionSectionServer params={params} searchParams={searchParams} />;
}
