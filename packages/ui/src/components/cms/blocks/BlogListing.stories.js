import BlogListing from "./BlogListing";
const meta = {
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
export const Default = {};
