// Types-compat declarations for @acme/ui/* and @/components/* paths
// These allow typecheck to pass without requiring the full UI package build

declare module "@/components/atoms/shadcn" {
  import type { ButtonHTMLAttributes, ComponentType, ForwardRefExoticComponent, HTMLAttributes, InputHTMLAttributes, ReactNode, RefAttributes } from "react";

  export const Button: ForwardRefExoticComponent<ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    asChild?: boolean;
    color?: string;
    tone?: string;
    trailingIcon?: React.ReactNode;
    leadingIcon?: React.ReactNode;
  } & RefAttributes<HTMLButtonElement>>;

  export const Input: ForwardRefExoticComponent<InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  } & RefAttributes<HTMLInputElement>>;

  export const Label: ForwardRefExoticComponent<HTMLAttributes<HTMLLabelElement> & RefAttributes<HTMLLabelElement>>;

  export const Card: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;
  export const CardHeader: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;
  export const CardTitle: ForwardRefExoticComponent<HTMLAttributes<HTMLHeadingElement> & RefAttributes<HTMLHeadingElement>>;
  export const CardDescription: ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement> & RefAttributes<HTMLParagraphElement>>;
  export const CardContent: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;
  export const CardFooter: ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>>;

  export const Select: ComponentType<any>;
  export const SelectTrigger: ComponentType<any>;
  export const SelectValue: ComponentType<any>;
  export const SelectContent: ComponentType<any>;
  export const SelectItem: ComponentType<any>;
  export const SelectGroup: ComponentType<any>;
  export const SelectLabel: ComponentType<any>;

  export const Dialog: ComponentType<any>;
  export const DialogTrigger: ComponentType<any>;
  export const DialogContent: ComponentType<any>;
  export const DialogHeader: ComponentType<any>;
  export const DialogTitle: ComponentType<any>;
  export const DialogDescription: ComponentType<any>;
  export const DialogFooter: ComponentType<any>;
  export const DialogClose: ComponentType<any>;

  export const Tabs: ComponentType<any>;
  export const TabsList: ComponentType<any>;
  export const TabsTrigger: ComponentType<any>;
  export const TabsContent: ComponentType<any>;

  export const Table: ComponentType<any>;
  export const TableHeader: ComponentType<any>;
  export const TableBody: ComponentType<any>;
  export const TableFooter: ComponentType<any>;
  export const TableHead: ComponentType<any>;
  export const TableRow: ComponentType<any>;
  export const TableCell: ComponentType<any>;
  export const TableCaption: ComponentType<any>;

  export const Textarea: ForwardRefExoticComponent<any>;
  export const Checkbox: ForwardRefExoticComponent<any>;
  export const Switch: ForwardRefExoticComponent<any>;
  export const RadioGroup: ComponentType<any>;
  export const RadioGroupItem: ComponentType<any>;

  export const DropdownMenu: ComponentType<any>;
  export const DropdownMenuTrigger: ComponentType<any>;
  export const DropdownMenuContent: ComponentType<any>;
  export const DropdownMenuItem: ComponentType<any>;
  export const DropdownMenuCheckboxItem: ComponentType<any>;
  export const DropdownMenuRadioItem: ComponentType<any>;
  export const DropdownMenuLabel: ComponentType<any>;
  export const DropdownMenuSeparator: ComponentType<any>;
  export const DropdownMenuShortcut: ComponentType<any>;
  export const DropdownMenuGroup: ComponentType<any>;
  export const DropdownMenuPortal: ComponentType<any>;
  export const DropdownMenuSub: ComponentType<any>;
  export const DropdownMenuSubContent: ComponentType<any>;
  export const DropdownMenuSubTrigger: ComponentType<any>;
  export const DropdownMenuRadioGroup: ComponentType<any>;

  export const Popover: ComponentType<any>;
  export const PopoverTrigger: ComponentType<any>;
  export const PopoverContent: ComponentType<any>;

  export const Tooltip: ComponentType<any>;
  export const TooltipTrigger: ComponentType<any>;
  export const TooltipContent: ComponentType<any>;
  export const TooltipProvider: ComponentType<any>;

  export const Sheet: ComponentType<any>;
  export const SheetTrigger: ComponentType<any>;
  export const SheetContent: ComponentType<any>;
  export const SheetHeader: ComponentType<any>;
  export const SheetTitle: ComponentType<any>;
  export const SheetDescription: ComponentType<any>;
  export const SheetFooter: ComponentType<any>;
  export const SheetClose: ComponentType<any>;

  export const Alert: ComponentType<any>;
  export const AlertTitle: ComponentType<any>;
  export const AlertDescription: ComponentType<any>;

  export const Badge: ComponentType<any>;
  export const Skeleton: ComponentType<any>;
  export const Separator: ComponentType<any>;
  export const ScrollArea: ComponentType<any>;
  export const Progress: ComponentType<any>;
  export const Avatar: ComponentType<any>;
  export const AvatarImage: ComponentType<any>;
  export const AvatarFallback: ComponentType<any>;

  export const Command: ComponentType<any>;
  export const CommandInput: ComponentType<any>;
  export const CommandList: ComponentType<any>;
  export const CommandEmpty: ComponentType<any>;
  export const CommandGroup: ComponentType<any>;
  export const CommandItem: ComponentType<any>;
  export const CommandShortcut: ComponentType<any>;
  export const CommandSeparator: ComponentType<any>;

  export const Accordion: ComponentType<any>;
  export const AccordionItem: ComponentType<any>;
  export const AccordionTrigger: ComponentType<any>;
  export const AccordionContent: ComponentType<any>;

  export const Form: ComponentType<any>;
  export const FormField: ComponentType<any>;
  export const FormItem: ComponentType<any>;
  export const FormLabel: ComponentType<any>;
  export const FormControl: ComponentType<any>;
  export const FormDescription: ComponentType<any>;
  export const FormMessage: ComponentType<any>;

  export const Calendar: ComponentType<any>;
  export const Slider: ComponentType<any>;
  export const Toggle: ComponentType<any>;
  export const ToggleGroup: ComponentType<any>;
  export const ToggleGroupItem: ComponentType<any>;

  // Layout primitives
  export const Grid: ComponentType<any>;
  export const Inline: ComponentType<any>;
  export const Stack: ComponentType<any>;
  export const Cluster: ComponentType<any>;

  // Additional components
  export const Tag: ComponentType<any>;
  export const Toast: ComponentType<any>;
  export const Toaster: ComponentType<any>;
  export const useToast: () => { toast: (options: any) => void; dismiss: (id?: string) => void };
  export const toast: (options: any) => void;
}


declare module "@acme/ui/components/atoms/Tag" {
  const Tag: React.FC<any>;
  export default Tag;
  export { Tag };
}

declare module "@acme/ui/components/atoms/Toast" {
  const Toast: React.FC<any>;
  export default Toast;
  export { Toast };
  export const useToast: () => { toast: (options: any) => void; dismiss: (id?: string) => void };
  export const toast: (options: any) => void;
  export const Toaster: React.FC<any>;
}


declare module "@acme/ui/components/cms" {
  export const PageBuilder: React.FC<any>;
  export const ThemeEditor: React.FC<any>;
  export const MediaManager: React.FC<any>;
  export const ComponentEditor: React.FC<any>;
  export const StyleEditor: React.FC<any>;
  export const CmsLaunchChecklist: React.FC<any>;

  // CmsLaunchChecklistItem - both value and type
  export interface CmsLaunchChecklistItem {
    id: string;
    label: string;
    status?: CmsLaunchStatus;
    statusLabel?: string;
    fixLabel?: string;
    href?: string;
    targetHref?: string;
    [k: string]: any;
  }
  export const CmsLaunchChecklistItem: React.FC<CmsLaunchChecklistItem>;

  export const CmsBuildHero: React.FC<any>;

  // CmsLaunchStatus - both value and type
  export type CmsLaunchStatus = "ready" | "pending" | "error" | "in_progress" | "complete" | "warning";
  export interface CmsLaunchStatusProps {
    status: CmsLaunchStatus;
    message?: string;
    [k: string]: any;
  }
  export const CmsLaunchStatus: React.FC<CmsLaunchStatusProps>;

  export const CmsInlineHelpBanner: React.FC<any>;
  export const ImagePicker: React.FC<any>;
  export const Loader: React.FC<any>;
  export function getContrast(color1: string, color2: string): number;
  export function suggestContrastColor(color: string, reference: string, ratio?: number): string | null;
  export const CmsMetricTiles: React.FC<any>;

  // CmsMetricTile - both value and type
  export interface CmsMetricTile {
    id: string;
    label: string;
    value: string | number;
    caption?: string;
    [k: string]: any;
  }
  export const CmsMetricTile: React.FC<CmsMetricTile>;

  export const CodeBlock: React.FC<any>;
  export const PagesTable: React.FC<any>;
  export const Sidebar: React.FC<any>;
  export const LineChart: React.FC<any>;
  export const CmsSettingsSnapshot: React.FC<any>;

  // CmsSettingsSnapshotRow - both value and type
  export interface CmsSettingsSnapshotRow {
    key: string;
    value: any;
    [k: string]: any;
  }
  export const CmsSettingsSnapshotRow: React.FC<CmsSettingsSnapshotRow>;
}

declare module "@acme/ui/components/cms/PageBuilder" {
  const PageBuilder: React.FC<any>;
  export default PageBuilder;
  export { PageBuilder };
  export type PageBuilderProps = any;
}

declare module "@acme/ui/utils/style" {
  export function cn(...inputs: any[]): string;
  export function cva(base: string, config?: any): any;
}

declare module "@acme/ui/utils/devicePresets" {
  export interface DevicePreset {
    id: string;
    label: string;
    name: string;
    type: string;
    orientation: string;
    width: number;
    height: number;
    [k: string]: any;
  }
  export const devicePresets: DevicePreset[];
  export const getDevicePreset: (name: string) => DevicePreset | undefined;
}

declare module "@/components/devicePresets" {
  export interface DevicePreset {
    id: string;
    label: string;
    name: string;
    type: string;
    orientation: string;
    width: number;
    height: number;
    [k: string]: any;
  }
  export const devicePresets: DevicePreset[];
  export const getDevicePreset: (name: string) => DevicePreset | undefined;
}

declare module "@acme/ui" {
  export * from "@acme/ui/components";
  export * from "@acme/ui/hooks";
  export * from "@acme/ui/utils";
}

declare module "@acme/ui/utils/devicePresets" {
  export interface DevicePreset {
    id: string;
    label: string;
    name: string;
    type: string;
    orientation: string;
    width: number;
    height: number;
    [k: string]: any;
  }
  export const devicePresets: DevicePreset[];
  export const getDevicePreset: (name: string) => DevicePreset | undefined;
}

declare module "@acme/ui/*" {
  const content: any;
  export = content;
}

declare module "@/components/cms/CmsLaunchChecklist" {
  const CmsLaunchChecklist: React.FC<any>;
  export default CmsLaunchChecklist;
  export { CmsLaunchChecklist };
}

declare module "@/components/cms/CmsBuildHero" {
  const CmsBuildHero: React.FC<any>;
  export default CmsBuildHero;
  export { CmsBuildHero };
}

declare module "@/components/cms/CmsLaunchStatus" {
  const CmsLaunchStatus: React.FC<any>;
  export default CmsLaunchStatus;
  export { CmsLaunchStatus };
}

declare module "@/components/cms/CmsInlineHelpBanner" {
  const CmsInlineHelpBanner: React.FC<any>;
  export default CmsInlineHelpBanner;
  export { CmsInlineHelpBanner };
}

declare module "@/components/cms" {
  export const CmsLaunchChecklist: React.FC<any>;
  export const CmsBuildHero: React.FC<any>;
  export const CmsLaunchStatus: React.FC<any>;
  export const CmsInlineHelpBanner: React.FC<any>;
  export const PageBuilder: React.FC<any>;
  export const ThemeEditor: React.FC<any>;
  export const MediaManager: React.FC<any>;
}
