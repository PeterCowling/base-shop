import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

describe("Select", () => {
  it("fires onValueChange and shows indicator on selected item", async () => {
    const onValueChange = jest.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger data-cy="trigger">
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
});
