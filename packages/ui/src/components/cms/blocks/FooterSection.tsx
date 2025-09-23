"use client";

import React from "react";
import NewsletterSignup from "./NewsletterSignup";
import SocialLinks from "./SocialLinks";

export interface FooterSectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "simple" | "multiColumn" | "legalHeavy" | "newsletter" | "social";
}

export default function FooterSection({ variant = "simple", className, ...rest }: FooterSectionProps) {
  return (
    <footer className={[className, "w-full border-t bg-neutral-50"].filter(Boolean).join(" ") || undefined} {...rest}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {variant === "simple" && (
          <div className="flex items-center justify-between text-sm text-neutral-700">
            <p>© {new Date().getFullYear()} ACME</p>
            <a href="/legal" className="hover:underline">Legal</a>
          </div>
        )}
        {variant === "multiColumn" && (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-sm">
            <div>
              <h3 className="mb-2 font-medium">Shop</h3>
              <ul className="space-y-1 text-neutral-700">
                <li><a href="/collections/new" className="hover:underline">New</a></li>
                <li><a href="/collections/best" className="hover:underline">Best Sellers</a></li>
                <li><a href="/collections/sale" className="hover:underline">Sale</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">Support</h3>
              <ul className="space-y-1 text-neutral-700">
                <li><a href="/help/shipping" className="hover:underline">Shipping</a></li>
                <li><a href="/help/returns" className="hover:underline">Returns</a></li>
                <li><a href="/contact" className="hover:underline">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">Company</h3>
              <ul className="space-y-1 text-neutral-700">
                <li><a href="/about" className="hover:underline">About</a></li>
                <li><a href="/careers" className="hover:underline">Careers</a></li>
                <li><a href="/press" className="hover:underline">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">Follow</h3>
              <SocialLinks />
            </div>
          </div>
        )}
        {variant === "newsletter" && (
          <div className="max-w-xl">
            <h3 className="mb-2 text-lg font-medium">Subscribe</h3>
            <p className="mb-4 text-sm text-neutral-700">News and updates, no spam.</p>
            <NewsletterSignup />
          </div>
        )}
        {variant === "social" && (
          <div className="flex justify-center"><SocialLinks /></div>
        )}
        {variant === "legalHeavy" && (
          <div className="text-sm text-neutral-700">
            <p className="mb-2">© {new Date().getFullYear()} ACME. All rights reserved.</p>
            <p className="text-xs">This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.</p>
          </div>
        )}
      </div>
    </footer>
  );
}

