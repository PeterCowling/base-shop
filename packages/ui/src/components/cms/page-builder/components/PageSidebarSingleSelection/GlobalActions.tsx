import type { Dispatch, SetStateAction } from "react";
import { useTranslations } from "@acme/i18n";

import type { GlobalItem } from "../../libraryStore";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../atoms";
import { Button } from "../../../../atoms/shadcn";
import GlobalsPicker from "../GlobalsPicker";

interface GlobalActionsProps {
  globals: GlobalItem[];
  insertOpen: boolean;
  setInsertOpen: (open: boolean) => void;
  insertSearch: string;
  setInsertSearch: Dispatch<SetStateAction<string>>;
  insertGlobal: (item: GlobalItem) => void;
  makeGlobal: () => void;
  editGlobally: () => void;
}

const GlobalActions = ({
  globals,
  insertOpen,
  setInsertOpen,
  insertSearch,
  setInsertSearch,
  insertGlobal,
  makeGlobal,
  editGlobally,
}: GlobalActionsProps) => {
  const t = useTranslations();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={makeGlobal} aria-label={t("Make Global") as string}>
        {t("Make Global")}
      </Button>
      <Button type="button" variant="outline" onClick={editGlobally} aria-label={t("Edit globally") as string}>
        {t("Edit Globally")}
      </Button>
      <Popover open={insertOpen} onOpenChange={setInsertOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" aria-label={t("Insert Global") as string}>
            {t("Insert Global")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-2">
          <GlobalsPicker globals={globals} search={insertSearch} onSearchChange={setInsertSearch} onSelect={insertGlobal} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default GlobalActions;
