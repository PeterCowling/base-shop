import type { GetStaticPaths, GetStaticProps } from "next";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { BASE_URL } from "@/config/site";
import type { LoaderFunctionArgs } from "@/compat/router-state";
import { RouteDataProvider } from "@/compat/router-state";
import AppLayout from "@/components/layout/AppLayout";
import RouteHead from "@/next/RouteHead";
import { collectI18nResources, type I18nResourcesPayload } from "@/next/i18nResources";
import HomeRoute, { clientLoader, links, meta } from "@/routes/home";

type HomeLoaderData = Awaited<ReturnType<typeof clientLoader>>;

type HomePageProps = {
  loaderData: HomeLoaderData;
  params: { lang: AppLanguage };
  head: { meta: ReturnType<typeof meta>; links: ReturnType<typeof links> };
  i18n: I18nResourcesPayload;
};

const buildRequest = (pathname: string): Request => {
  const base = BASE_URL || "http://localhost";
  const url = new URL(pathname, base);
  return new Request(url.toString());
};

export const getStaticPaths: GetStaticPaths = async () => {
  const langs = (i18nConfig.supportedLngs ?? []) as string[];
  const paths = langs.map((lang) => ({ params: { lang } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<HomePageProps> = async ({ params }) => {
  const lang = (params?.["lang"] as string | undefined) ?? "";
  const supported = (i18nConfig.supportedLngs ?? []) as readonly string[];
  if (!supported.includes(lang)) {
    return { notFound: true };
  }

  const pathname = `/${lang}`;
  const loaderData = await clientLoader({
    request: buildRequest(pathname),
    params: { lang },
  } as LoaderFunctionArgs);

  const headMeta = meta({ data: loaderData });
  const headLinks = links({ data: loaderData });
  const i18nResources = collectI18nResources(lang as AppLanguage);

  return {
    props: {
      loaderData,
      params: { lang: lang as AppLanguage },
      head: { meta: headMeta, links: headLinks },
      i18n: i18nResources,
    },
  };
};

export default function HomePage({ loaderData, head, params }: HomePageProps): JSX.Element {
  const lang = loaderData.lang ?? params.lang;

  return (
    <AppLayout lang={lang}>
      <RouteHead meta={head.meta ?? []} links={head.links} />
      <RouteDataProvider id="home" data={loaderData}>
        <HomeRoute />
      </RouteDataProvider>
    </AppLayout>
  );
}
