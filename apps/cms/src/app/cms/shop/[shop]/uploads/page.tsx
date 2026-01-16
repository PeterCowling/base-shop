import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { getServerSession } from "next-auth";
import { hasPermission } from "@auth";
import type { Role } from "@auth/types";
import { authOptions } from "@cms/auth/options";
import { checkShopExists } from "@acme/lib";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@ui/components/atoms";
import { Grid as DSGrid, Stack } from "@ui/components/atoms/primitives";

export const revalidate = 0;

function canAccessUploads(role: Role): boolean {
  return (
    hasPermission(role, "manage_catalog") ||
    hasPermission(role, "manage_inventory") ||
    hasPermission(role, "manage_media")
  );
}

export default async function UploadsIndex({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();

  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;
  if (!role || !canAccessUploads(role)) {
    redirect(
      `/403?shop=${encodeURIComponent(shop)}&reason=${encodeURIComponent(
        "uploads"
      )}`
    );
  }

  const cards = [
    ...(hasPermission(role, "manage_catalog")
      ? [
          {
            title: "Import products",
            eyebrow: "Catalogue",
            description: "Bulk upsert catalogue records with preview + audit log.",
            bullets: [
              "JSON/CSV supported (upload or paste).",
              "Idempotency key prevents double-applying.",
              "Per-row validation and change summary.",
            ],
            href: (s: string) => `/cms/shop/${s}/uploads/products`,
            cta: "Open product import",
            accent: "bg-hero-contrast",
          },
          ...(shop === "cochlearfit"
            ? [
                {
                  title: "Variant pricing & Stripe IDs",
                  eyebrow: "Catalogue",
                  description: "Manage cochlearfit checkout variant pricing and Stripe price IDs.",
                  bullets: [
                    "Writes data/shops/cochlearfit/variants.json",
                    "Controls checkout pricing and Stripe price IDs",
                    "Requires rebuild/deploy to take effect",
                  ],
                  href: (s: string) => `/cms/shop/${s}/pricing/variants`,
                  cta: "Open variant pricing",
                  accent: "bg-hero-contrast",
                },
              ]
            : []),
        ]
      : []),
    ...(hasPermission(role, "manage_inventory")
      ? [
          {
            title: "Receive stock",
            eyebrow: "Inventory",
            description: "Bulk receive stock inflows with preview + audit trail.",
            bullets: [
              "Upload-like workflow (preview then commit).",
              "Idempotency key prevents double-receiving.",
              "Immutable receipt log per shop.",
            ],
            href: (s: string) => `/cms/shop/${s}/uploads/stock-inflows`,
            cta: "Open stock inflows",
            accent: "bg-hero-contrast",
          },
          {
            title: "Adjust stock",
            eyebrow: "Inventory",
            description: "Add or subtract stock with required reasons and audit trail.",
            bullets: [
              "Positive or negative deltas.",
              "Reason codes required.",
              "Idempotency + immutable log.",
            ],
            href: (s: string) => `/cms/shop/${s}/uploads/stock-adjustments`,
            cta: "Open stock adjustments",
            accent: "bg-hero-contrast",
          },
        ]
      : []),
    ...(hasPermission(role, "manage_media")
      ? [
          {
            title: "Media library",
            eyebrow: "Assets",
            description: "Manage media files and metadata for your storefront.",
            bullets: [
              "Upload, tag, and delete assets.",
              "Edit alt text and titles.",
              "Reuse assets across pages/products.",
            ],
            href: (s: string) => `/cms/shop/${s}/media`,
            cta: "Open media",
            accent: "bg-hero-contrast",
          },
        ]
      : []),
  ] as const;

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/20 to-transparent" />
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default">Uploads · {shop}</Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">Uploads</h1>
          <p className="text-sm text-hero-foreground/80 md:text-base">
            Import catalogue data, receive stock, and manage media — centrally and safely.
          </p>
        </div>
      </section>

      <section>
        <DSGrid cols={1} gap={4} className="md:grid-cols-2">
          {cards.map((card) => (
            <Card
              key={card.title}
              className={`border border-border/10 ${card.accent} text-hero-foreground shadow-elevation-3`}
            >
              <CardContent>
                <Stack gap={4} className="h-full p-6">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-hero-foreground/80">
                      {card.eyebrow}
                    </span>
                    <h2 className="text-xl font-semibold leading-tight">{card.title}</h2>
                    <p className="text-sm text-hero-foreground/80">{card.description}</p>
                  </div>
                  <ul className="grow list-disc space-y-2 pl-5 text-sm text-hero-foreground/80">
                    {card.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant="outline"
                    className="group mt-auto inline-flex h-11 items-center justify-between rounded-xl px-4 text-sm font-semibold"
                  >
                    <Link href={card.href(shop)}>
                      <span>{card.cta}</span>
                      <ArrowRightIcon
                        className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden
                      />
                    </Link>
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </DSGrid>
      </section>
    </div>
  );
}
