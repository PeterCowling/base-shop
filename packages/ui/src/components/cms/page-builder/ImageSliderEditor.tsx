import type { PageComponent } from "@acme/types";
import { Button, Input } from "../../atoms/shadcn";
import ImagePicker from "./ImagePicker";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ImageSliderEditor({ component, onChange }: Props) {
  const slides = ((component as any).slides ?? []) as any[];
  const min = (component as any).minItems ?? 0;
  const max = (component as any).maxItems ?? Infinity;

  const update = (idx: number, field: string, value: string) => {
    const next = [...slides];
    next[idx] = { ...next[idx], [field]: value };
    onChange({ slides: next } as Partial<PageComponent>);
  };

  const move = (from: number, to: number) => {
    const next = [...slides];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange({ slides: next } as Partial<PageComponent>);
  };

  const remove = (idx: number) => {
    const next = slides.filter((_: unknown, i: number) => i !== idx);
    onChange({ slides: next } as Partial<PageComponent>);
  };

  const add = () => {
    onChange({ slides: [...slides, { src: "", alt: "", caption: "" }] } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      {slides.map((s, idx) => (
        <div key={idx} className="space-y-1 rounded border p-2">
          <div className="flex items-start gap-2">
            <Input
              value={s.src ?? ""}
              onChange={(e) => update(idx, "src", e.target.value)}
              placeholder="src"
              className="flex-1"
            />
            <ImagePicker onSelect={(url) => update(idx, "src", url)}>
              <Button type="button" variant="outline">Pick</Button>
            </ImagePicker>
          </div>
          <Input
            value={s.alt ?? ""}
            onChange={(e) => update(idx, "alt", e.target.value)}
            placeholder="alt"
          />
          <Input
            value={s.caption ?? ""}
            onChange={(e) => update(idx, "caption", e.target.value)}
            placeholder="caption"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={() => move(idx, idx - 1)} disabled={idx === 0}>
              Up
            </Button>
            <Button
              type="button"
              onClick={() => move(idx, idx + 1)}
              disabled={idx === slides.length - 1}
            >
              Down
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => remove(idx)}
              disabled={slides.length <= min}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button onClick={add} disabled={slides.length >= max}>
        Add
      </Button>
    </div>
  );
}
