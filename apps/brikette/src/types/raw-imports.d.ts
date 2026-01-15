declare module "*.jsonld?raw" {
  const content: string;
  export default content;
}

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "*.css?url" {
  const href: string;
  export default href;
}
