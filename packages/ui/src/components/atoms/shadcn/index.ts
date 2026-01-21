"use client";

// DEPRECATED: Import from @acme/design-system/shadcn instead
// This shim will be removed in the next major version.

if (process.env.NODE_ENV === "development") {
  console.warn(
    "[@acme/ui] Importing from '@acme/ui/components/atoms/shadcn' is deprecated. " +
      "Please import from '@acme/design-system/shadcn' instead."
  );
}

// Re-export from design-system
export {
  Accordion,
  AccordionContent,
  type AccordionContentProps,
  AccordionItem,
  type AccordionItemProps,
  type AccordionProps,
  AccordionTrigger,
  type AccordionTriggerProps,
  Card,
  CardContent,
  Checkbox,
  type CheckboxProps,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Input,
  type InputProps,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  type TextareaProps,
  Progress,
  type ProgressProps,
  Tag,
  type TagProps,
} from "@acme/design-system";

// Button comes from shadcn directory specifically
export { Button, type ButtonProps } from "@acme/design-system/shadcn/Button";
