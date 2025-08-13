import type { PageComponent } from "@acme/types";
import { Button, Input, Textarea } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function GiftCardEditor({ component, onChange }: Props) {
  const amounts = ((component as any).amounts ?? []) as number[];
  const description = (component as any).description ?? "";

  const updateAmounts = (next: number[]) => {
    onChange({ amounts: next } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={description}
        onChange={(e) =>
          onChange({ description: e.target.value } as Partial<PageComponent>)
        }
        placeholder="description"
      />
      {amounts.map((amt, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            type="number"
            value={amt}
            onChange={(e) => {
              const next = [...amounts];
              next[i] = Number(e.target.value);
              updateAmounts(next);
            }}
            placeholder="amount"
            className="flex-1"
          />
          <Button
            variant="destructive"
            onClick={() => updateAmounts(amounts.filter((_, idx) => idx !== i))}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button onClick={() => updateAmounts([...amounts, 0])}>Add Amount</Button>
    </div>
  );
}

