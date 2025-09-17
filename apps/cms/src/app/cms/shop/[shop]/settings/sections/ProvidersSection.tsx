"use client";

import { Card, CardContent, Checkbox, FormField } from "@ui";
import type { Provider } from "@acme/configurator/providers";
import { renderError } from "./shared";

export interface ProvidersSectionProps {
  providers: Provider[];
  selected: string[];
  error?: string[];
  onToggle: (providerId: string, checked: boolean) => void;
}

export function ProvidersSection({
  providers,
  selected,
  error,
  onToggle,
}: ProvidersSectionProps) {
  return (
    <Card className="border-0 shadow-none">
      <CardContent>
        <FormField
          label="Tracking providers"
          error={renderError(error)}
        >
          <div className="space-y-2">
            {providers.map((provider) => {
              const checked = selected.includes(provider.id);
              const checkboxId = `tracking-provider-${provider.id}`;
              const labelId = `${checkboxId}-label`;
              return (
                <div
                  key={provider.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={checkboxId}
                      aria-labelledby={labelId}
                      checked={checked}
                      onCheckedChange={(next) =>
                        onToggle(provider.id, Boolean(next))
                      }
                    />
                    <span id={labelId} className="text-sm">
                      {provider.name}
                    </span>
                  </div>
                  {checked && (
                    <input
                      type="hidden"
                      name="trackingProviders"
                      value={provider.id}
                      aria-hidden
                    />
                  )}
                </div>
              );
            })}
            {providers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No tracking providers available.
              </p>
            )}
          </div>
        </FormField>
      </CardContent>
    </Card>
  );
}

export default ProvidersSection;
