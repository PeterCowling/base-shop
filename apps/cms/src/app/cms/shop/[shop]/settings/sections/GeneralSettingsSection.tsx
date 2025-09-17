"use client";

import type { ChangeEvent, Dispatch, SetStateAction } from "react";

import type { Shop } from "@acme/types";

import GeneralSettings from "../GeneralSettings";

interface GeneralSettingsSectionProps {
  info: Shop;
  setInfo: Dispatch<SetStateAction<Shop>>;
  errors: Record<string, string[]>;
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function GeneralSettingsSection({
  info,
  setInfo,
  errors,
  handleChange,
}: GeneralSettingsSectionProps) {
  return (
    <div className="space-y-6">
      <GeneralSettings
        info={info}
        setInfo={setInfo}
        errors={errors}
        handleChange={handleChange}
      />
    </div>
  );
}
