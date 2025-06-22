import type { Config } from "tailwindcss";

export default <Partial<Config>>{
  content: [
    "./apps/**/*.{ts,tsx,mdx}", // all Next.js apps
    "./packages/ui/components/**/*.{ts,tsx,mdx}", // shared UI kit
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};
