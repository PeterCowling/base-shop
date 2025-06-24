export default function sveltePlugin() {
  return {
    name: "svelte-plugin",
    setup() {
      console.log("Svelte plugin loaded");
    },
  };
}
