import type { Config } from 'tailwindcss';
import basePreset from '@acme/tailwind-config';

const config: Config = {
  presets: [basePreset as Config],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
