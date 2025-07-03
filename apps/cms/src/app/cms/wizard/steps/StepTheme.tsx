import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms-shadcn";
import StyleEditor from "@/components/cms/StyleEditor";
import WizardPreview from "../WizardPreview";

interface Props {
  themes: string[];
  theme: string;
  setTheme: (v: string) => void;
  themeVars: Record<string, string>;
  setThemeVars: (v: Record<string, string>) => void;
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
}

export default function StepTheme({
  themes,
  theme,
  setTheme,
  themeVars,
  setThemeVars,
  themeStyle,
  onBack,
  onNext,
}: Props): React.JSX.Element {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select Theme</h2>
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <StyleEditor tokens={themeVars} onChange={setThemeVars} />
      <WizardPreview style={themeStyle} />
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
