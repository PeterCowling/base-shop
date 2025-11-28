import type { Meta, StoryObj } from "@storybook/nextjs";
import BlogListing from "./BlogListing";

const meta: Meta<typeof BlogListing> = {
  component: BlogListing,
  args: {
    posts: [
      { title: "Post One", excerpt: "Summary of first post", url: "/posts/1" },
      { title: "Post Two", excerpt: "Summary of second post", url: "/posts/2" },
      { title: "Post Three", excerpt: "Summary of third post" },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof BlogListing> = {};
