// packages/ui/src/components/atoms/primitives/__tests__/accordion.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../accordion";

describe("Accordion primitives", () => {
  test("single mode toggles one item and respects collapsible=false", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" defaultValue="a" collapsible={false}>
        <AccordionItem value="a">
          <AccordionTrigger>Section A</AccordionTrigger>
          <AccordionContent>A content</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Section B</AccordionTrigger>
          <AccordionContent>B content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    // A starts open, B closed
    expect(screen.getByText("A content")).toBeVisible();
    expect(screen.getByText("B content")).not.toBeVisible();

    // Clicking A does not collapse because collapsible=false
    await user.click(screen.getByText("Section A"));
    expect(screen.getByText("A content")).toBeVisible();

    // Clicking B closes A and opens B
    await user.click(screen.getByText("Section B"));
    expect(screen.getByText("A content")).not.toBeVisible();
    expect(screen.getByText("B content")).toBeVisible();
  });

  test("multiple mode keeps independent open states", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple" defaultValue={["a"]}>
        <AccordionItem value="a">
          <AccordionTrigger>Section A</AccordionTrigger>
          <AccordionContent>A content</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Section B</AccordionTrigger>
          <AccordionContent>B content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    // A open initially
    expect(screen.getByText("A content")).toBeVisible();
    expect(screen.getByText("B content")).not.toBeVisible();

    await user.click(screen.getByText("Section B"));
    // both open
    expect(screen.getByText("A content")).toBeVisible();
    expect(screen.getByText("B content")).toBeVisible();

    await user.click(screen.getByText("Section A"));
    // now only B open
    expect(screen.getByText("A content")).not.toBeVisible();
    expect(screen.getByText("B content")).toBeVisible();
  });
});

