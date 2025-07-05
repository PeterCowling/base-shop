import { LiveShoppingEventTemplate } from "./LiveShoppingEventTemplate";
const products = [
    {
        id: "1",
        title: "Product 1",
        image: "https://placehold.co/300",
        price: 1000,
    },
    {
        id: "2",
        title: "Product 2",
        image: "https://placehold.co/300",
        price: 1500,
    },
];
const chatMessages = [
    { id: "1", user: "Alice", message: "Hello" },
    { id: "2", user: "Bob", message: "Great deal!" },
];
const meta = {
    component: LiveShoppingEventTemplate,
    args: {
        streamUrl: "video.mp4",
        products,
        chatMessages,
    },
};
export default meta;
export const Default = {};
