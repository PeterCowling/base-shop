import { Button } from "../../../../atoms/shadcn";

interface LinkedGlobalNoticeProps {
  globalId?: string;
  linkedLabel: string | null;
  onEditGlobally: () => void;
  onUnlink: () => void;
}

const LinkedGlobalNotice = ({ globalId, linkedLabel, onEditGlobally, onUnlink }: LinkedGlobalNoticeProps) => {
  if (!globalId || !linkedLabel) return null;

  return (
    <div
      className="flex items-center justify-between gap-2 rounded border bg-muted/60 px-2 py-1 text-xs"
      title="This block is linked to a Global template"
    >
      <div className="truncate">
        Linked to Global: <span className="font-medium">{linkedLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={onEditGlobally}>
          Edit globally
        </Button>
        <Button type="button" variant="ghost" className="h-7 px-2 text-xs" onClick={onUnlink} title="Unlink from Global">
          Unlink
        </Button>
      </div>
    </div>
  );
};

export default LinkedGlobalNotice;
