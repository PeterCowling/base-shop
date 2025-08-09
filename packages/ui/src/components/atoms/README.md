# Atoms

Small building blocks used throughout the UI.

Shadcn-based primitives live in a sibling directory named `atoms/shadcn`. These wrappers expose the original shadcn/ui look and feel while fitting into our Atomic Design layers. Import them directly when you need the stock shadcn styles:

```ts
import { Button } from "@/components/atoms/shadcn";

```

If you need an in-house atom alongside a shadcn wrapper, alias the
wrapper so its origin is obvious:

```ts
import { Button } from "@/components/atoms";
import { Button as ShButton } from "@/components/atoms/shadcn";
```

In-house atoms continue to live in this folder.

All atoms should accept optional layout props. Use `width`, `height`, `padding` and
`margin` to adjust their sizing or spacing. Values may be Tailwind classes
(e.g. `w-8`) or numeric pixel values where supported.

Available components:

- `StatCard`
- `LineChart`
- `ProductBadge`
  `RatingStars`
- `StockStatus`
- `ColorSwatch`
- `Price`
- `Avatar`
- `Logo`
- `Radio`
- `Switch`
- `Tag`
- `Skeleton`
- `Loader`
- `Tooltip`
- `Toast`
- `PaginationDot`
- `Icon`
- `Popover`
- `Chip`
- `ARViewer`
- `VideoPlayer`
- `ZoomImage`
