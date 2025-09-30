// packages/ui/src/components/cms/page-builder/DesignMenu.tsx
"use client";

import React from "react";
import { Button, Dialog, DialogTrigger } from "../../atoms/shadcn";
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from "../../atoms";
import ThemePanel from "./ThemePanel";
import BreakpointsPanel, { type Breakpoint } from "./panels/BreakpointsPanel";
import { useTranslations } from "@acme/i18n";

interface Props {
  breakpoints?: Breakpoint[];
  onChangeBreakpoints?: (list: Breakpoint[]) => void;
}

export function DesignMenuContent({ breakpoints = [], onChangeBreakpoints }: Props) {
  const t = useTranslations();
  const [themeOpen, setThemeOpen] = React.useState(false);
  const [breakpointsOpen, setBreakpointsOpen] = React.useState(false);
  React.useEffect(() => {
    const open = () => setThemeOpen(true);
    window.addEventListener("pb:open-theme", open as EventListener);
    return () => window.removeEventListener("pb:open-theme", open as EventListener);
  }, []);
  React.useEffect(() => {
    const open = () => setBreakpointsOpen(true);
    window.addEventListener("pb:open-breakpoints", open as EventListener);
    return () => window.removeEventListener("pb:open-breakpoints", open as EventListener);
  }, []);
  return (
    <div className="flex flex-col gap-2 text-sm">
      <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">{t("cms.builder.design.theme")}</Button>
        </DialogTrigger>
        <ThemePanel />
      </Dialog>
      <Dialog open={breakpointsOpen} onOpenChange={setBreakpointsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">{t("cms.builder.design.breakpoints")}</Button>
        </DialogTrigger>
        <BreakpointsPanel breakpoints={breakpoints} onChange={(list) => onChangeBreakpoints?.(list)} />
      </Dialog>
    </div>
  );
}

export default function DesignMenu({ breakpoints = [], onChangeBreakpoints }: Props) {
  const t = useTranslations();
  return (
    <Popover>
      <Tooltip text={t("cms.builder.design.options.tooltip")}>
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label={t("cms.builder.design.options.tooltip")}>
            {t("cms.builder.design.button")}
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-64">
        <DesignMenuContent breakpoints={breakpoints} onChangeBreakpoints={onChangeBreakpoints} />
      </PopoverContent>
    </Popover>
  );
}
