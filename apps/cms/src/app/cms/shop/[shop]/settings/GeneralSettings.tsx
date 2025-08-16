// apps/cms/src/app/cms/shop/[shop]/settings/GeneralSettings.tsx
"use client";
import { Input, Checkbox } from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";

interface Props {
  info: Shop;
  setInfo: Dispatch<SetStateAction<Shop>>;
  errors: Record<string, string[]>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function GeneralSettings({
  info,
  setInfo,
  errors,
  handleChange,
}: Props) {
  return (
    <>
      <label className="flex flex-col gap-1">
        <span>Name</span>
        <Input
          className="border p-2"
          name="name"
          value={info.name}
          onChange={handleChange}
        />
        {errors.name && (
          <span className="text-sm text-red-600">{errors.name.join("; ")}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Theme</span>
        <Input
          className="border p-2"
          name="themeId"
          value={info.themeId}
          onChange={handleChange}
        />
        {errors.themeId && (
          <span className="text-sm text-red-600">{errors.themeId.join("; ")}</span>
        )}
      </label>
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <Checkbox
            name="enableEditorial"
            checked={info.enableEditorial ?? false}
            onCheckedChange={(v) =>
              setInfo((prev) => ({ ...prev, enableEditorial: Boolean(v) }))
            }
          />
          <span>Enable blog</span>
        </label>
        {errors.enableEditorial && (
          <span className="text-sm text-red-600">
            {errors.enableEditorial.join("; ")}
          </span>
        )}
      </div>
      <fieldset className="col-span-2 flex flex-col gap-1">
        <legend className="text-sm font-medium">Luxury features</legend>
        <div className="mt-2 grid gap-2">
          <label className="flex items-center gap-2">
            <Checkbox
              name="contentMerchandising"
              checked={info.luxuryFeatures.contentMerchandising ?? false}
              onCheckedChange={(v) =>
                setInfo((prev) => ({
                  ...prev,
                  luxuryFeatures: {
                    ...prev.luxuryFeatures,
                    contentMerchandising: Boolean(v),
                  },
                }))
              }
            />
            <span>Content merchandising</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              name="raTicketing"
              checked={info.luxuryFeatures.raTicketing ?? false}
              onCheckedChange={(v) =>
                setInfo((prev) => ({
                  ...prev,
                  luxuryFeatures: {
                    ...prev.luxuryFeatures,
                    raTicketing: Boolean(v),
                  },
                }))
              }
            />
            <span>RA ticketing</span>
          </label>
          <label className="flex flex-col gap-1">
            <span>Fraud review threshold</span>
            <Input
              type="number"
              name="fraudReviewThreshold"
              value={info.luxuryFeatures.fraudReviewThreshold}
              onChange={(e) =>
                setInfo((prev) => ({
                  ...prev,
                  luxuryFeatures: {
                    ...prev.luxuryFeatures,
                    fraudReviewThreshold: Number(e.target.value),
                  },
                }))
              }
            />
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              name="requireStrongCustomerAuth"
              checked={info.luxuryFeatures.requireStrongCustomerAuth}
              onCheckedChange={(v) =>
                setInfo((prev) => ({
                  ...prev,
                  luxuryFeatures: {
                    ...prev.luxuryFeatures,
                    requireStrongCustomerAuth: Boolean(v),
                  },
                }))
              }
            />
            <span>Require strong customer auth</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              name="strictReturnConditions"
              checked={info.luxuryFeatures.strictReturnConditions}
              onCheckedChange={(v) =>
                setInfo((prev) => ({
                  ...prev,
                  luxuryFeatures: {
                    ...prev.luxuryFeatures,
                    strictReturnConditions: Boolean(v),
                  },
                }))
              }
            />
            <span>Strict return conditions</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              name="trackingDashboard"
              checked={info.luxuryFeatures.trackingDashboard}
              onCheckedChange={(v) =>
                setInfo((prev) => ({
                  ...prev,
                  luxuryFeatures: {
                    ...prev.luxuryFeatures,
                    trackingDashboard: Boolean(v),
                  },
                }))
              }
            />
            <span>Tracking dashboard</span>
          </label>
        </div>
      </fieldset>
    </>
  );
}
