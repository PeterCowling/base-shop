const sendListeners = [];
const openListeners = [];
const clickListeners = [];
export function onSend(listener) {
    sendListeners.push(listener);
}
export function onOpen(listener) {
    openListeners.push(listener);
}
export function onClick(listener) {
    clickListeners.push(listener);
}
export async function emitSend(shop, payload) {
    await Promise.all(sendListeners.map((fn) => fn(shop, payload)));
}
export async function emitOpen(shop, payload) {
    await Promise.all(openListeners.map((fn) => fn(shop, payload)));
}
export async function emitClick(shop, payload) {
    await Promise.all(clickListeners.map((fn) => fn(shop, payload)));
}
async function track(shop, data) {
    const { trackEvent } = await import("@acme/platform-core/analytics");
    await trackEvent(shop, data);
}
// default analytics listeners
onSend((shop, { campaign }) => track(shop, { type: "email_sent", campaign }));
onOpen((shop, { campaign }) => track(shop, { type: "email_open", campaign }));
onClick((shop, { campaign }) => track(shop, { type: "email_click", campaign }));
