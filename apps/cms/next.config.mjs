/** @type {import('next').NextConfig} */
export default {
  env: {
    NEXT_PUBLIC_PHASE: process.env.NEXT_PUBLIC_PHASE || "demo",
  },
};
