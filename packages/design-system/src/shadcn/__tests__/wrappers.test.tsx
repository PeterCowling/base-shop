// packages/ui/src/components/atoms/shadcn/__tests__/wrappers.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Card, CardContent } from "../Card";
import { Checkbox } from "../Checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../Dialog";
import { Input } from "../Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Select";
import { Textarea } from "../Textarea";

describe("shadcn wrappers", () => {
  test("Card re-exports render", () => {
    render(
      <Card>
        <CardContent>content</CardContent>
      </Card>
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  test("Checkbox renders and toggles", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="agree" />);
    const cb = screen.getByLabelText("agree");
    expect(cb).toBeInTheDocument();
    await user.click(cb);
  });

  test("Dialog opens content via trigger", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Test-only description</DialogDescription>
          Dialog Body
        </DialogContent>
      </Dialog>
    );
    await user.click(screen.getByText("Open"));
    expect(await screen.findByText("Dialog Body")).toBeInTheDocument();
  });

  test("Input and Textarea render", () => {
    render(
      <div>
        <Input placeholder="name" />
        <Textarea placeholder="message" />
      </div>
    );
    expect(screen.getByPlaceholderText("name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("message")).toBeInTheDocument();
  });

  test("Select renders items (no user interaction needed)", () => {
    // Render without opening to ensure module executes and exports are valid
    render(
      <Select>
        <SelectTrigger aria-label="flavour">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByLabelText("flavour")).toBeInTheDocument();
  });
});
