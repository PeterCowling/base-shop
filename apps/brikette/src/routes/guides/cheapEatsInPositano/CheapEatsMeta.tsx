// src/routes/guides/cheapEatsInPositano/CheapEatsMeta.tsx
import ArticleStructuredData from "@/components/seo/ArticleStructuredData";
import BreadcrumbStructuredData from "@/components/seo/BreadcrumbStructuredData";
import GuideFaqJsonLd from "@/components/seo/GuideFaqJsonLd";

import { type CheapEatsMetaData,GUIDE_KEY, JSON_LD_TYPE } from "./constants";

export function CheapEatsMeta({ title, description, hero, breadcrumb, itemListJson }: CheapEatsMetaData) {
  const dateModified = new Date().toISOString().slice(0, 10);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:image" content={hero} />
      <ArticleStructuredData
        headline={title}
        description={description}
        dateModified={dateModified}
        image={hero}
      />
      <BreadcrumbStructuredData
        items={breadcrumb.itemListElement.map((e) => ({ name: e.name, item: e.item }))}
      />
      <GuideFaqJsonLd guideKey={GUIDE_KEY} />
      {itemListJson ? (
        <script type={JSON_LD_TYPE} dangerouslySetInnerHTML={{ __html: itemListJson }} />
      ) : null}
    </>
  );
}
