"use client";

/**
 * @deprecated Import directly from '@acme/ui/atoms', '@acme/design-system/atoms',
 * '@acme/design-system/primitives', or '@acme/design-system/shadcn' instead.
 *
 * This barrel is a backward-compatibility shim that re-exports from multiple sources.
 */

// Show deprecation warning in development
if (process.env.NODE_ENV === "development") {
  console.warn(
    "[@acme/ui] Importing from '@acme/ui/components/atoms' is deprecated. " +
    "Please import from the appropriate package instead."
  );
}

// Re-export domain-specific UI atoms (these take precedence for conflicting names)
export * from "@acme/ui/atoms";

// Re-export design-system atoms (excluding conflicts: IconButton)
export {
  Alert,
  ARViewer,
  Avatar,
  Chip,
  ColorSwatch,
  FileSelector,
  FormField,
  Icon,
  // IconButton - conflicts with @acme/ui/atoms
  LineChart,
  LinkText,
  Loader,
  Logo,
  OptionPill,
  type OptionPillProps,
  OptionTile,
  type OptionTileProps,
  PaginationDot,
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
  Price,
  ProductBadge,
  Progress,
  type ProgressProps,
  Radio,
  RatingStars,
  SelectField,
  Skeleton,
  Loader as Spinner, // Alias for backward compatibility
  StatCard,
  StockStatus,
  Switch,
  Tag,
  type TagProps,
  Toast,
  Tooltip,
  VideoPlayer,
  ZoomImage,
} from "@acme/design-system/atoms";

// Re-export layout primitives from design-system
export { Cluster, Cover, Inline, OverlayScrim,Sidebar, Stack } from "@acme/design-system/primitives";

// Re-export shadcn components for backward compatibility
export {
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  Input,
  type InputProps,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  type TextareaProps,
} from "@acme/design-system/shadcn";
