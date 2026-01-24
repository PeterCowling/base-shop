"use client";

// Core atoms - presentation components without domain logic
// Note: this module also re-exports a small set of common primitives for
// compatibility with existing import patterns. Prefer `@acme/design-system/shadcn`
// (and `@acme/design-system/primitives` for layout utilities) for new usage.

export {
  Accordion,
  AccordionContent,
  type AccordionContentProps,
  AccordionItem,
  type AccordionItemProps,
  type AccordionProps,
  AccordionTrigger,
  type AccordionTriggerProps,
} from "../primitives/accordion";
export { Button, type ButtonProps } from "../primitives/button";
export { Card, CardContent } from "../primitives/card";
export { Checkbox, type CheckboxProps } from "../primitives/checkbox";
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../primitives/dialog";
export { Input, type InputProps } from "../primitives/input";
export { OverlayScrim } from "../primitives/overlayScrim";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../primitives/select";
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../primitives/table";
export { Textarea, type TextareaProps } from "../primitives/textarea";
export { Alert } from "./Alert";
export { ARViewer } from "./ARViewer";
export { Avatar } from "./Avatar";
export { Chip } from "./Chip";
export { ColorSwatch } from "./ColorSwatch";
export { FileSelector } from "./FileSelector";
export { FormField } from "./FormField";
export { Icon } from "./Icon";
export { IconButton } from "./IconButton";
export { LineChart } from "./LineChart";
export { LinkText, type LinkTextProps } from "./LinkText";
export { Loader, Loader as Spinner } from "./Loader";
export { Logo } from "./Logo";
export { OptionPill, type OptionPillProps } from "./OptionPill";
export { OptionTile, type OptionTileProps } from "./OptionTile";
export { PaginationDot } from "./PaginationDot";
export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "./Popover";
export { Price } from "./Price";
export { ProductBadge } from "./ProductBadge";
export { Progress, type ProgressProps } from "./Progress";
export { Radio } from "./Radio";
export { RatingStars } from "./RatingStars";
export { Section, type SectionProps } from "./Section";
export { SelectField } from "./SelectField";
export { Skeleton } from "./Skeleton";
export { StatCard } from "./StatCard";
export { StockStatus } from "./StockStatus";
export { Switch } from "./Switch";
export { Tag, type TagProps } from "./Tag";
export { Toast, type ToastProps } from "./Toast";
export { Tooltip } from "./Tooltip";
export { VideoPlayer } from "./VideoPlayer";
export { ZoomImage } from "./ZoomImage";
