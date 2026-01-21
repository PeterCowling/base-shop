"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import {
  Button,
  Card,
  CardContent,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@acme/ui/components/atoms";
import { FormField } from "@acme/ui/components/molecules";

import type { ActionResult } from "../../components/actionResult";

export interface Discount {
  code: string;
  description?: string;
  discountPercent: number;
  active?: boolean;
  redemptions?: number;
}

export interface DiscountManagerProps {
  loadDiscounts: () => Promise<Discount[]>;
  createDiscount: (input: { code: string; description: string; discountPercent: number }) => Promise<ActionResult>;
  toggleDiscount: (code: string, active: boolean) => Promise<ActionResult>;
  deleteDiscount: (code: string) => Promise<ActionResult>;
  onNotify: (result: ActionResult) => void;
}

const formSchema = z.object({
  code: z
    .string()
    .min(1, "Enter a code customers will type at checkout.")
    .regex(/^[A-Z0-9_-]+$/i, "Use letters, numbers, dashes, or underscores."),
  description: z.string().trim().max(160, "Keep the description under 160 characters.").default(""),
  percent: z
    .coerce
    .number({ invalid_type_error: "Provide a numeric percentage." })
    .min(1, "Discounts must be at least 1%.")
    .max(100, "Discounts cannot exceed 100%.")
    .transform((value) => Math.round(value * 100) / 100),
});

type FormErrors = Partial<Record<keyof z.input<typeof formSchema>, string>>;

export function DiscountManager({
  loadDiscounts,
  createDiscount,
  toggleDiscount,
  deleteDiscount,
  onNotify,
}: DiscountManagerProps) {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [form, setForm] = useState({ code: "", description: "", percent: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    loadDiscounts()
      .then((items) => {
        if (isMounted) setDiscounts(items);
      })
      .catch(() => {
        if (isMounted) {
          setDiscounts([]);
          onNotify({ status: "error", message: "Unable to load discounts." });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [loadDiscounts, onNotify]);

  const activeCount = useMemo(() => discounts.filter((discount) => discount.active !== false).length, [discounts]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const parsed = formSchema.safeParse({
      code: form.code,
      description: form.description,
      percent: form.percent,
    });

    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key as keyof FormErrors]) {
          next[key as keyof FormErrors] = issue.message;
        }
      }
      setErrors(next);
      setIsSubmitting(false);
      return;
    }

    const payload = parsed.data;
    const result = await createDiscount({
      code: payload.code.trim(),
      description: payload.description.trim(),
      discountPercent: payload.percent,
    });
    onNotify(result);
    if (result.status === "success") {
      setForm({ code: "", description: "", percent: "" });
      setErrors({});
      try {
        const items = await loadDiscounts();
        setDiscounts(items);
      } catch {
        onNotify({ status: "error", message: "Discount saved but refresh failed." });
      }
    }
    setIsSubmitting(false);
  }

  async function handleToggle(discount: Discount) {
    const result = await toggleDiscount(discount.code, discount.active === false);
    onNotify(result);
    if (result.status === "success") {
      try {
        const items = await loadDiscounts();
        setDiscounts(items);
      } catch {
        onNotify({ status: "error", message: "Discount updated but refresh failed." });
      }
    }
  }

  async function handleDelete(code: string) {
    const result = await deleteDiscount(code);
    onNotify(result);
    if (result.status === "success") {
      setDiscounts((prev) => prev.filter((discount) => discount.code !== code));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-6">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">New discount</h2>
            <p className="text-sm text-muted-foreground">
              Create reusable codes that sync to checkout within a minute and respect storefront scheduling.
            </p>
          </header>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Code" htmlFor="discount-code" error={errors.code} required>
                <Input
                  id="discount-code"
                  placeholder="SUMMER25"
                  value={form.code}
                  onChange={(event) => updateField("code", event.target.value.toUpperCase())}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Codes are not case-sensitive. Customers apply them during checkout.
                </p>
              </FormField>
              <FormField label="Discount %" htmlFor="discount-percent" error={errors.percent} required>
                <Input
                  id="discount-percent"
                  type="number"
                  inputMode="decimal"
                  placeholder="15"
                  value={form.percent}
                  onChange={(event) => updateField("percent", event.target.value)}
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Choose the percent off the order subtotal. Stackable rules apply per cart.
                </p>
              </FormField>
            </div>
            <FormField label="Internal note" htmlFor="discount-description" error={errors.description}>
              <Textarea
                id="discount-description"
                placeholder="Optional context for the team"
                value={form.description}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => updateField("description", event.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This description is only visible in the CMS to help teammates recall campaign intent.
              </p>
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save discount"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Current programs</h2>
            <p className="text-sm text-muted-foreground">
              {activeCount} active {activeCount === 1 ? "code" : "codes"}. Toggle availability to pause or reintroduce offers.
            </p>
          </header>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading discounts…</p>
          ) : discounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No discounts have been configured yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-end">Percent</TableHead>
                    <TableHead className="text-end">Redemptions</TableHead>
                    <TableHead className="text-end">Status</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.map((discount) => (
                    <TableRow key={discount.code}>
                      <TableCell className="font-mono">{discount.code}</TableCell>
                      <TableCell>{discount.description || "—"}</TableCell>
                      <TableCell className="text-end">{discount.discountPercent}%</TableCell>
                      <TableCell className="text-end">{discount.redemptions ?? 0}</TableCell>
                      <TableCell className="text-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleToggle(discount)}
                        >
                          {discount.active === false ? "Inactive" : "Active"}
                        </Button>
                      </TableCell>
                      <TableCell className="flex justify-end gap-2 text-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 px-3 text-xs text-destructive"
                          onClick={() => handleDelete(discount.code)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DiscountManager;
