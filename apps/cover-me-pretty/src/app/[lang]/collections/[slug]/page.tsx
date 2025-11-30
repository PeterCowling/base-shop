import CollectionSectionServer from "@acme/ui/components/cms/blocks/CollectionSection.server";

export const revalidate = 60;

export default async function Page({ params, searchParams }: { params: { lang: string; slug: string }; searchParams?: Record<string, string | string[] | undefined> }) {
  return <CollectionSectionServer params={params} searchParams={searchParams} />;
}
