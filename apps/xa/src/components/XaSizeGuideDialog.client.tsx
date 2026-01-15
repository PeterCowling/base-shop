"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/components/atoms";

export function XaSizeGuideDialog({ copy }: { copy: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Size guide
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Size guide</DialogTitle>
          <DialogDescription>{copy}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
