import { Textarea } from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import { Dispatch, SetStateAction } from "react";
import { handleJsonInput } from "../utils/formValidators";

interface Props {
  info: Shop;
  errors: Record<string, string[]>;
  setInfo: Dispatch<SetStateAction<Shop>>;
  setErrors: Dispatch<SetStateAction<Record<string, string[]>>>;
}

export default function SEOSettings({ info, errors, setInfo, setErrors }: Props) {
  return (
    <>
      <label className="flex flex-col gap-1">
        <span>Filter Mappings (JSON)</span>
        <Textarea
          name="filterMappings"
          defaultValue={JSON.stringify(info.filterMappings, null, 2)}
          onChange={(e) =>
            handleJsonInput<Record<string, unknown>>(
              e.target.value,
              "filterMappings",
              (parsed) =>
                setInfo((prev) => ({ ...prev, filterMappings: parsed })),
              setErrors,
            )
          }
          rows={4}
        />
        {errors.filterMappings && (
          <span className="text-sm text-red-600">
            {errors.filterMappings.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Price Overrides (JSON)</span>
        <Textarea
          name="priceOverrides"
          defaultValue={JSON.stringify(info.priceOverrides ?? {}, null, 2)}
          onChange={(e) =>
            handleJsonInput<Record<string, unknown>>(
              e.target.value,
              "priceOverrides",
              (parsed) =>
                setInfo((prev) => ({ ...prev, priceOverrides: parsed })),
              setErrors,
            )
          }
          rows={4}
        />
        {errors.priceOverrides && (
          <span className="text-sm text-red-600">
            {errors.priceOverrides.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Locale Overrides (JSON)</span>
        <Textarea
          name="localeOverrides"
          defaultValue={JSON.stringify(info.localeOverrides ?? {}, null, 2)}
          onChange={(e) =>
            handleJsonInput<Record<string, unknown>>(
              e.target.value,
              "localeOverrides",
              (parsed) =>
                setInfo((prev) => ({ ...prev, localeOverrides: parsed })),
              setErrors,
            )
          }
          rows={4}
        />
        {errors.localeOverrides && (
          <span className="text-sm text-red-600">
            {errors.localeOverrides.join("; ")}
          </span>
        )}
      </label>
    </>
  );
}
