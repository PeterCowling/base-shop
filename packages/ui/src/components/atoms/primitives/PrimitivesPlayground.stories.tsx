import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
  Card,
  CardContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "./";

const meta: Meta = {
  title: "Atoms/Primitives/Playground",
};

export default meta;

type Story = StoryObj;

function BasicControlsTemplate() {
  const [checked, setChecked] = useState(false);
  return (
    <div className="space-y-4 max-w-xl">
      <Card>
        <CardContent className="space-y-3">
          <h3 className="text-lg font-semibold">Form controls</h3>
          <div className="flex items-center gap-3">
            <Checkbox
              id="demo-checkbox"
              checked={checked}
              onCheckedChange={(v) => setChecked(Boolean(v))}
            />
            <label htmlFor="demo-checkbox">Subscribe to updates</label>
          </div>
          <Input placeholder="Inline input" />
          <Textarea placeholder="Longer text entry" />
          <Select defaultValue="md">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button tone="ghost">Ghost</Button>
          </div>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Details</AccordionTrigger>
          <AccordionContent>
            Content stretches to long strings without wrapping issues.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Widget A</TableCell>
            <TableCell>2</TableCell>
            <TableCell className="text-right">$19.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Widget B</TableCell>
            <TableCell>1</TableCell>
            <TableCell className="text-right">$9.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export const BasicControls: Story = {
  render: () => <BasicControlsTemplate />,
};
