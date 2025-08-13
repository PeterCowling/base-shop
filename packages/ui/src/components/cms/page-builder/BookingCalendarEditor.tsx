import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function BookingCalendarEditor({ component, onChange }: Props) {
  const handleString = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  const handleNumber = (field: string, value: string) => {
    const num = value === "" ? undefined : Number(value);
    onChange({ [field]: num } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        label="Resource"
        value={(component as any).resource ?? ""}
        onChange={(e) => handleString("resource", e.target.value)}
      />
      <Input
        label="Start Date"
        type="date"
        value={(component as any).startDate ?? ""}
        onChange={(e) => handleString("startDate", e.target.value)}
      />
      <Input
        label="End Date"
        type="date"
        value={(component as any).endDate ?? ""}
        onChange={(e) => handleString("endDate", e.target.value)}
      />
      <Input
        label="Slot Duration (mins)"
        type="number"
        value={(component as any).slotDuration ?? ""}
        onChange={(e) => handleNumber("slotDuration", e.target.value)}
      />
    </div>
  );
}
