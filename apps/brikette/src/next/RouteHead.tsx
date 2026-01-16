import Head from "next/head";
import type { ReactNode } from "react";
import type { LinkDescriptor, MetaDescriptor } from "react-router";

type RouteHeadProps = {
  meta?: MetaDescriptor[];
  links?: LinkDescriptor[];
};

const renderMeta = (descriptors: MetaDescriptor[]): ReactNode[] =>
  descriptors.map((descriptor, index) => {
    if ("title" in descriptor && typeof descriptor.title === "string") {
      return <title key={`title-${index}`}>{descriptor.title}</title>;
    }

    if ("tagName" in descriptor && descriptor.tagName === "link") {
      const { tagName: _tag, key: _key, ...rest } = descriptor as Record<string, string | undefined> & {
        tagName: string;
        key?: string;
      };
      return <link key={`link-meta-${index}`} {...rest} />;
    }

    const { tagName: _ignored, key: _key, ...rest } = descriptor as Record<string, string | undefined> & {
      tagName?: string;
      key?: string;
    };

    if ("charSet" in rest) {
      return <meta key={`meta-${index}`} charSet={rest["charSet"]} />;
    }

    return <meta key={`meta-${index}`} {...rest} />;
  });

const renderLinks = (links: LinkDescriptor[]): ReactNode[] =>
  links.map((link, index) => {
    const { rel, href, hrefLang } = link;
    const key = `${rel ?? "link"}-${href ?? ""}-${hrefLang ?? ""}-${index}`;
    const { key: _key, tagName: _tagName, ...rest } = link as Record<string, string | undefined> & {
      key?: string;
      tagName?: string;
    };
    return <link key={key} {...rest} />;
  });

export default function RouteHead({ meta, links }: RouteHeadProps): JSX.Element | null {
  const hasMeta = Array.isArray(meta) && meta.length > 0;
  const hasLinks = Array.isArray(links) && links.length > 0;
  if (!hasMeta && !hasLinks) return null;

  return (
    <Head>
      {hasMeta ? renderMeta(meta!) : null}
      {hasLinks ? renderLinks(links!) : null}
    </Head>
  );
}
