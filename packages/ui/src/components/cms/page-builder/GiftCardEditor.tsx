import type { PageComponent } from "@acme/types";
import { Button, Input, Textarea } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function GiftCardEditor({ component, onChange }: Props) {
  const amounts = ((component as any).amounts ?? []) as number[];

  const updateAmount = (idx: number, value: number) => {
    const next = [...amounts];
    next[idx] = value;
    onChange({ amounts: next } as Partial<PageComponent>);
  };

  const removeAmount = (idx: number) => {
    onChange({
      amounts: amounts.filter((_, i) => i !== idx),
    } as Partial<PageComponent>);
  };

  const addAmount = () => {
    onChange({ amounts: [...amounts, 0] } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={(component as any).description ?? ""}
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
            onChange={(e) => updateAmount(i, Number(e.target.value))}
            placeholder="amount"
            className="flex-1"
          />
          <Button
            variant="destructive"
            type="button"
            onClick={() => removeAmount(i)}
            disabled={amounts.length <= 1}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" onClick={addAmount}>
        Add Amount
      </Button>
    </div>
  );
}
