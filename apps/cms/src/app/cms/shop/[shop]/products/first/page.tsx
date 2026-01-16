// apps/cms/src/app/cms/shop/[shop]/products/first/page.tsx

import { redirect } from "next/navigation";
import { Button, Card, CardContent, Input } from "@acme/ui/components/atoms/shadcn";
import { Alert, Tag } from "@acme/ui/components/atoms";
import { Grid } from "@acme/ui/components/atoms/primitives";
import { checkShopExists } from "@acme/lib";
import { createMinimalFirstProduct } from "@cms/actions/products.server";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import type { Locale } from "@acme/i18n/locales";

interface Params {
  shop: string;
}

export default async function FirstProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;

  if (!(await checkShopExists(shop))) {
    redirect("/cms/products");
  }

  const t = await getServerTranslations("en" as Locale);

  async function createFirstProductAction(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);
    const quantity = Number(formData.get("quantity") ?? 0);
    const location = String(formData.get("location") ?? "").trim() || "main";
    const imageUrlRaw = String(formData.get("imageUrl") ?? "").trim();
    const imageUrl = imageUrlRaw.length > 0 ? imageUrlRaw : undefined;

    if (!name || Number.isNaN(price) || price < 0 || Number.isNaN(quantity) || quantity <= 0) {
      return;
    }

    const product = await createMinimalFirstProduct(shop, {
      name,
      price,
      quantity,
      location,
      imageUrl,
    });

    redirect(`/cms/shop/${shop}/products/${product.id}/edit`);
  }

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative grid gap-6 px-6 py-7 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-4 lg:col-span-2">
            <div className="space-y-1">
              <Tag variant="default">
                {t("cms.products.tag.catalog")} · {shop}
              </Tag>
              <h1 className="text-3xl font-semibold md:text-4xl">
                {t("cms.products.firstWizard.title")}
              </h1>
              <p className="text-sm text-hero-foreground/80">
                {t("cms.products.firstWizard.subtitle")}
              </p>
            </div>
            <Alert variant="info" tone="soft" heading={t("cms.products.firstWizard.callout.heading")}>
              <p className="text-sm text-muted-foreground">
                {t("cms.products.firstWizard.callout.body")}
              </p>
            </Alert>
          </div>
        </div>
      </section>

      <section>
        <Card className="border border-border/10 bg-surface-2 text-foreground shadow-elevation-3">
          <CardContent className="p-6">
            <form action={createFirstProductAction} className="space-y-6">
              <Grid gap={4} className="md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-foreground">
                    {t("cms.products.firstWizard.fields.name.label")}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder={t("cms.products.firstWizard.fields.name.placeholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="price" className="block text-sm font-medium text-foreground">
                    {t("cms.products.firstWizard.fields.price.label")}
                  </label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder={t("cms.products.firstWizard.fields.price.placeholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="quantity" className="block text-sm font-medium text-foreground">
                    {t("cms.products.firstWizard.fields.quantity.label")}
                  </label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder={t("cms.products.firstWizard.fields.quantity.placeholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="location" className="block text-sm font-medium text-foreground">
                    {t("cms.products.firstWizard.fields.location.label")}
                  </label>
                  <Input
                    id="location"
                    name="location"
                    placeholder={t("cms.products.firstWizard.fields.location.placeholder")}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-foreground">
                    {t("cms.products.firstWizard.fields.imageUrl.label")}
                  </label>
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    placeholder={t("cms.products.firstWizard.fields.imageUrl.placeholder")}
                  />
                </div>
              </Grid>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {t("cms.products.firstWizard.footer.hint")}
                </p>
                <Button type="submit" className="h-11 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground shadow-elevation-2 hover:bg-success/90">
                  {t("cms.products.firstWizard.actions.create")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
