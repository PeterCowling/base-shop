"use client";

import React from "react";

/**
 * Injects small animation keyframes for placeholders, respecting reduced motion.
 */
const PlaceholderAnimations = () => (
  <style>{`
    @media (prefers-reduced-motion: no-preference) {
      @keyframes pb-fade-scale-in { from { transform: scale(0.96); opacity: .65 } to { transform: scale(1); opacity: 1 } }
      [data-placeholder] { transform-origin: center; animation: pb-fade-scale-in 140ms cubic-bezier(0.16,1,0.3,1); }
    }
  `}</style>
);

export default PlaceholderAnimations;

