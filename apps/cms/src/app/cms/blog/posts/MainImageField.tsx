import { Button } from "@acme/ui/components/atoms";
import { ImagePicker } from "@acme/page-builder-ui";
import Image from "next/image";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function MainImageField({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="block font-medium">Main image</label>
      <ImagePicker onSelect={onChange}>
        <Button type="button" variant="outline">
          {value ? "Change image" : "Select image"}
        </Button>
      </ImagePicker>
      {value && (
        <Image
          src={value}
          alt="Main image"
          width={128}
          height={128}
          unoptimized
          className="h-32 w-auto rounded object-cover"
        />
      )}
    </div>
  );
}
