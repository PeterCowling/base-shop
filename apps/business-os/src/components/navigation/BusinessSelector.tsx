/**
 * BusinessSelector Dropdown Component
 * Allows switching between different businesses in the Business OS
 * BOS-UX-04
 */

"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives/Inline";

import type { Business } from "@/lib/types";

export interface BusinessSelectorProps {
  businesses: Business[];
  currentBusiness: string;
}

export function BusinessSelector({
  businesses,
  currentBusiness,
}: BusinessSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const current = businesses.find((b) => b.id === currentBusiness);
  const currentName = current?.name ?? currentBusiness;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <span>{currentName}</span>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-0">
        <div className="py-1">
          {businesses.map((business) => {
            const isCurrent = business.id === currentBusiness;
            return (
              <Link
                key={business.id}
                href={`/?business=${business.id}`}
                className={`block px-4 py-2 text-sm transition-colors hover:bg-muted ${
                  isCurrent
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Inline
                  asChild
                  alignY="center"
                  wrap={false}
                  className="w-full justify-between"
                >
                  <span>
                    <span>{business.name}</span>
                    {isCurrent && (
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                </Inline>
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
