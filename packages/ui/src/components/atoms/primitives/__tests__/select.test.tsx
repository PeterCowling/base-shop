import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen, configure } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Select,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectGroup,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../select";

configure({ testIdAttribute: "data-testid" });

describe("Select", () => {
  it("fires onValueChange and shows indicator on selected item", async () => {
    const onValueChange = jest.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger data-cy="trigger" data-testid="trigger">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="one">One</SelectItem>
          <SelectItem value="two">Two</SelectItem>
        </SelectContent>
      </Select>
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("trigger"));
    let optionTwo = await screen.findByRole("option", { name: "Two" });
    await user.click(optionTwo);

    expect(onValueChange).toHaveBeenCalledWith("two");
    expect(onValueChange).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("trigger"));
    optionTwo = await screen.findByRole("option", { name: "Two" });
    expect(optionTwo.getAttribute("data-state")).toBe("checked");
    expect(optionTwo.querySelector("svg")).not.toBeNull();
  });

  it("SelectLabel renders default and custom classes", async () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="custom">Label</SelectLabel>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId("trigger"));
    const label = await screen.findByText("Label");
    expect(label).toHaveClass("px-2", "py-1.5", "text-sm", "font-semibold", "custom");
  });

  it("SelectSeparator renders default and custom classes", async () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectSeparator data-testid="separator" className="custom" />
        </SelectContent>
      </Select>
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId("trigger"));
    const separator = await screen.findByTestId("separator");
    expect(separator).toHaveClass("bg-muted", "-mx-1", "my-1", "h-px", "custom");
  });

  it("SelectTrigger merges custom classes", () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger" className="custom">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
      </Select>
    );
    const trigger = screen.getByTestId("trigger");
    expect(trigger).toHaveClass("border-input");
    expect(trigger).toHaveClass("custom");
  });

  it("SelectItem merges custom classes", async () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="one" className="custom">
            One
          </SelectItem>
        </SelectContent>
      </Select>
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId("trigger"));
    const item = await screen.findByRole("option", { name: "One" });
    expect(item).toHaveClass("pl-8");
    expect(item).toHaveClass("custom");
  });

  it("forwards refs and attributes to subcomponents", async () => {
    const triggerRef = React.createRef<HTMLButtonElement>();
    const contentRef = React.createRef<HTMLDivElement>();
    const labelRef = React.createRef<HTMLDivElement>();
    const itemRef = React.createRef<HTMLDivElement>();
    const separatorRef = React.createRef<HTMLDivElement>();

    render(
      <Select>
        <SelectTrigger
          ref={triggerRef}
          data-testid="trigger"
          data-foo="trigger"
        >
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent
          ref={contentRef}
          data-testid="content"
          data-foo="content"
        >
          <SelectGroup>
            <SelectLabel
              ref={labelRef}
              data-testid="label"
              data-foo="label"
            >
              Label
            </SelectLabel>
            <SelectItem
              ref={itemRef}
              value="one"
              data-testid="item"
              data-foo="item"
            >
              One
            </SelectItem>
          </SelectGroup>
          <SelectSeparator
            ref={separatorRef}
            data-testid="separator"
            data-foo="separator"
          />
        </SelectContent>
      </Select>
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("trigger"));

    const content = await screen.findByTestId("content");
    const label = await screen.findByTestId("label");
    const item = await screen.findByTestId("item");
    const separator = await screen.findByTestId("separator");

    expect(triggerRef.current).toBe(screen.getByTestId("trigger"));
    expect(triggerRef.current).toHaveAttribute("data-foo", "trigger");

    expect(contentRef.current).toBe(content);
    expect(content).toHaveAttribute("data-foo", "content");

    expect(labelRef.current).toBe(label);
    expect(label).toHaveAttribute("data-foo", "label");

    expect(itemRef.current).toBe(item);
    expect(item).toHaveAttribute("data-foo", "item");

    expect(separatorRef.current).toBe(separator);
    expect(separator).toHaveAttribute("data-foo", "separator");
  });

  it("SelectContent renders in a portal", async () => {
    const { container } = render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="one">One</SelectItem>
        </SelectContent>
      </Select>
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId("trigger"));
    const content = await screen.findByRole("listbox");
    expect(container).not.toContainElement(content);
    expect(document.body).toContainElement(content);
  });
});
