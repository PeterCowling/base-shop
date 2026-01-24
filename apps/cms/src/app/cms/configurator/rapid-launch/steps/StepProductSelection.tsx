"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Alert, Tag } from "@acme/design-system/atoms";
import { Grid, Inline } from "@acme/design-system/primitives";
import { Button, Checkbox, Input } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import { formatCurrency } from "@acme/lib/format";

import { useConfigurator } from "../../ConfiguratorContext";
import useStepCompletion from "../../hooks/useStepCompletion";
import { useRapidLaunchProducts } from "../hooks/useRapidLaunchProducts";
import type { RapidLaunchStepProps } from "../types";

const MAX_SELECTION = 5;

export default function StepProductSelection({
  prevStepId,
  nextStepId,
}: RapidLaunchStepProps): React.JSX.Element {
  const t = useTranslations();
  const router = useRouter();
  const { state, update } = useConfigurator();
  const [, markComplete] = useStepCompletion("products");

  const shopId = state.shopId ?? "";
  const locale = state.locale ?? "en";
  const { products, loading, error, refresh } = useRapidLaunchProducts({
    shopId,
    locale,
  });

  const [query, setQuery] = useState("");

  const launchReadyIds = useMemo(
    () => products.filter((p) => p.launchReady).map((p) => p.id),
    [products]
  );

  useEffect(() => {
    if (products.length === 0) return;
    const available = new Set(products.map((p) => p.id));
    const current = state.rapidLaunchProductIds ?? [];
    const sanitized = current.filter((id) => available.has(id));
    if (sanitized.length !== current.length) {
      update("rapidLaunchProductIds", sanitized);
      return;
    }
    if (sanitized.length === 0 && launchReadyIds.length > 0 && launchReadyIds.length <= MAX_SELECTION) {
      update("rapidLaunchProductIds", launchReadyIds);
    }
  }, [products, state.rapidLaunchProductIds, launchReadyIds, update]);

  const selected = state.rapidLaunchProductIds ?? [];
  const selectedCount = selected.length;

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.trim().toLowerCase();
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, query]);

  const canSelectMore = selectedCount < MAX_SELECTION;

  const handleToggle = (id: string, allowed: boolean) => {
    if (!allowed) return;
    if (selected.includes(id)) {
      update(
        "rapidLaunchProductIds",
        selected.filter((pid) => pid !== id)
      );
      return;
    }
    if (!canSelectMore) return;
    update("rapidLaunchProductIds", [...selected, id]);
  };

  const canContinue = selectedCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {t("cms.rapidLaunch.products.heading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("cms.rapidLaunch.products.subheading", { max: MAX_SELECTION })}
        </p>
      </div>

      {!shopId && (
        <Alert
          variant="warning"
          tone="soft"
          heading={t("cms.rapidLaunch.products.shopIdRequired") as string}
        />
      )}

      {error && (
        <div className="space-y-2">
          <Alert variant="warning" tone="soft" heading={error} />
          <Button variant="outline" size="sm" onClick={refresh}>
            {t("cms.rapidLaunch.products.retry")}
          </Button>
        </div>
      )}

      {products.length > 20 && (
        <Input
          value={query}
          placeholder={String(t("cms.rapidLaunch.products.searchPlaceholder"))}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQuery(e.target.value)
          }
        />
      )}

      <Inline alignY="center" gap={3} className="justify-between text-sm text-muted-foreground">
        <span>
          {t("cms.rapidLaunch.products.selectionCount", {
            count: String(selectedCount),
            max: String(MAX_SELECTION),
          })}
        </span>
        {loading && (
          <span>{t("cms.rapidLaunch.products.loading")}</span>
        )}
      </Inline>

      {filteredProducts.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("cms.rapidLaunch.products.empty")}
        </div>
      ) : (
        <Grid cols={1} gap={4} className="md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const isSelected = selected.includes(product.id);
            const disabled =
              !isSelected && (!product.launchReady || !canSelectMore);
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => handleToggle(product.id, product.launchReady || isSelected)}
                className={`flex h-full flex-col gap-3 rounded-2xl border p-4 text-left transition ${
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                } ${disabled ? "opacity-60" : "hover:border-primary/60"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isSelected}
                      disabled={disabled}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      onCheckedChange={() =>
                        handleToggle(product.id, product.launchReady || isSelected)
                      }
                    />
                    <div>
                      <div className="text-sm font-semibold">{product.title || product.sku}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(product.price, product.currency, locale)}
                      </div>
                    </div>
                  </div>
                  {product.launchReady ? (
                    <Tag variant="success">
                      {t("cms.rapidLaunch.products.launchReady")}
                    </Tag>
                  ) : (
                    <Tag variant="warning">
                      {t("cms.rapidLaunch.products.needsFixes")}
                    </Tag>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={96}
                      height={96}
                      className="h-20 w-20 rounded border object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded border bg-muted/40" />
                  )}
                  <div className="text-xs text-muted-foreground">
                    <div>
                      {t("cms.rapidLaunch.products.stock", {
                        count: String(product.stock),
                      })}
                    </div>
                    <div>
                      {t("cms.rapidLaunch.products.variants", {
                        count: String(product.variantCount),
                      })}
                    </div>
                    {!product.launchReady && product.missingFields.length > 0 && (
                      <div className="mt-1 text-xs text-warning-foreground">
                        {t("cms.rapidLaunch.products.missing", {
                          fields: product.missingFields.join(", "),
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </Grid>
      )}

      <Inline gap={3} className="justify-between">
        {prevStepId ? (
          <Button variant="outline" onClick={() => router.push(`/cms/configurator/rapid-launch/${prevStepId}`)}>
            {t("wizard.back")}
          </Button>
        ) : (
          <span />
        )}
        {nextStepId && (
          <Button
            onClick={() => {
              markComplete(true);
              router.push(`/cms/configurator/rapid-launch/${nextStepId}`);
            }}
            disabled={!canContinue}
          >
            {t("wizard.next")}
          </Button>
        )}
      </Inline>
    </div>
  );
}
