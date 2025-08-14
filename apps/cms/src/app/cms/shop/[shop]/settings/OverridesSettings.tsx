// apps/cms/src/app/cms/shop/[shop]/settings/OverridesSettings.tsx
"use client";
import type { Shop } from "@acme/types";
import type { Dispatch, SetStateAction } from "react";
import { ErrorSetter } from "../utils/formValidators";
import KeyValueEditor from "./KeyValueEditor";

interface Props {
  info: Shop;
  setInfo: Dispatch<SetStateAction<Shop>>;
  errors: Record<string, string[]>;
  setErrors: ErrorSetter;
}

export default function OverridesSettings({
  info,
  setInfo,
  errors,
  setErrors,
}: Props) {
  return (
    <>
      <KeyValueEditor
        name="priceOverrides"
        label="Price Overrides"
        pairs={info.priceOverrides ?? {}}
        onChange={(pairs) =>
          setInfo((prev) => ({
            ...prev,
            priceOverrides: pairs as Record<string, number>,
          }))
        }
        errors={errors}
        setErrors={setErrors}
        keyPlaceholder="locale"
        valuePlaceholder="price"
        valueType="number"
      />
      <KeyValueEditor
        name="localeOverrides"
        label="Locale Overrides"
        pairs={info.localeOverrides ?? {}}
        onChange={(pairs) =>
          setInfo((prev) => ({
            ...prev,
            localeOverrides: pairs as Record<string, string>,
          }))
        }
        errors={errors}
        setErrors={setErrors}
        keyPlaceholder="path"
        valuePlaceholder="locale"
        valueType="locale"
      />
    </>
  );
}
