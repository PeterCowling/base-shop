import { Button } from "@/components/atoms/shadcn";
import Link from "next/link";
import type { Shop } from "@acme/types";

interface Row {
  token: string;
  defaultValue?: string;
  overrideValue?: string;
}

interface Props {
  shop: string;
  info: Shop;
  tokenRows: Row[];
  errors: Record<string, string[]>;
}

export default function ThemeTokens({ shop, info, tokenRows, errors }: Props) {
  return (
    <div className="col-span-2 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span>Theme Tokens</span>
        <Button asChild variant="link" className="h-auto p-0 text-primary">
          <Link href={`/cms/shop/${shop}/themes`}>Edit Theme</Link>
        </Button>
      </div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-2 py-1">Token</th>
            <th className="px-2 py-1">Default</th>
            <th className="px-2 py-1">Override</th>
          </tr>
        </thead>
        <tbody>
          {tokenRows.map(({ token, defaultValue, overrideValue }) => (
            <tr key={token}>
              <td className="border-t px-2 py-1 font-medium">{token}</td>
              <td className="border-t px-2 py-1">{defaultValue}</td>
              <td className="border-t px-2 py-1">{overrideValue ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <input
        type="hidden"
        name="themeDefaults"
        value={JSON.stringify(info.themeDefaults ?? {})}
      />
      <input
        type="hidden"
        name="themeOverrides"
        value={JSON.stringify(info.themeOverrides ?? {})}
      />
      {errors.themeDefaults && (
        <span className="text-sm text-red-600">
          {errors.themeDefaults.join("; ")}
        </span>
      )}
      {errors.themeOverrides && (
        <span className="text-sm text-red-600">
          {errors.themeOverrides.join("; ")}
        </span>
      )}
    </div>
  );
}
