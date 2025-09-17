"use client";

import { Checkbox, Input } from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";

interface GeneralSectionProps {
  info: Shop;
  setInfo: Dispatch<SetStateAction<Shop>>;
  errors: Record<string, string[]>;
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function GeneralSection({
  info,
  setInfo,
  errors,
  handleChange,
}: GeneralSectionProps) {
  return (
    <>
      <label className="flex flex-col gap-1">
        <span>Name</span>
        <Input
          className="border p-2"
          name="name"
          value={info.name}
          onChange={handleChange}
          aria-invalid={errors.name ? true : undefined}
        />
        {errors.name && (
          <span role="alert" className="text-sm text-red-600">
            {errors.name.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Theme</span>
        <Input
          className="border p-2"
          name="themeId"
          value={info.themeId}
          onChange={handleChange}
          aria-invalid={errors.themeId ? true : undefined}
        />
        {errors.themeId && (
          <span role="alert" className="text-sm text-red-600">
            {errors.themeId.join("; ")}
          </span>
        )}
      </label>
      <fieldset className="col-span-2 flex flex-col gap-1">
        <legend className="text-sm font-medium">Luxury features</legend>
        <div className="mt-2 grid gap-2">
          <label className="flex items-center gap-2">
            <Checkbox
              name="blog"
              checked={info.luxuryFeatures.blog ?? false}
              onCheckedChange={(value: boolean) =>
                setInfo((previous) => ({
                  ...previous,
                  luxuryFeatures: {
                    ...previous.luxuryFeatures,
                    blog: Boolean(value),
                  },
                }))
              }
            />
            <span>Enable blog</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              name="contentMerchandising"
              checked={info.luxuryFeatures.contentMerchandising ?? false}
              onCheckedChange={(value: boolean) =>
                setInfo((previous) => ({
                  ...previous,
                  luxuryFeatures: {
                    ...previous.luxuryFeatures,
                    contentMerchandising: Boolean(value),
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
              onCheckedChange={(value: boolean) =>
                setInfo((previous) => ({
                  ...previous,
                  luxuryFeatures: {
                    ...previous.luxuryFeatures,
                    raTicketing: Boolean(value),
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
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setInfo((previous) => ({
                  ...previous,
                  luxuryFeatures: {
                    ...previous.luxuryFeatures,
                    fraudReviewThreshold: Number(event.target.value),
                  },
                }))
              }
            />
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              name="requireStrongCustomerAuth"
              checked={info.luxuryFeatures.requireStrongCustomerAuth}
              onCheckedChange={(value: boolean) =>
                setInfo((previous) => ({
                  ...previous,
                  luxuryFeatures: {
                    ...previous.luxuryFeatures,
                    requireStrongCustomerAuth: Boolean(value),
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
              onCheckedChange={(value: boolean) =>
                setInfo((previous) => ({
                  ...previous,
                  luxuryFeatures: {
                    ...previous.luxuryFeatures,
                    strictReturnConditions: Boolean(value),
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
              onCheckedChange={(value: boolean) =>
                setInfo((previous) => ({
                  ...previous,
                  luxuryFeatures: {
                    ...previous.luxuryFeatures,
                    trackingDashboard: Boolean(value),
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
