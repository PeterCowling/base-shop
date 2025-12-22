import type { LinksFunction, LinkDescriptor } from "react-router";

// Static assets: critical font preloads
const links: LinksFunction = () => {
  const fonts: Array<Partial<LinkDescriptor> & Record<string, unknown>> = [
    {
      rel: "preload",
      as: "font",
      href: "/fonts/poppins-var.woff2",
      type: "font/woff2",
      crossOrigin: "anonymous",
      fetchPriority: "low",
    },
    {
      rel: "preload",
      as: "font",
      href: "/fonts/libre-franklin-400.woff2",
      type: "font/woff2",
      crossOrigin: "anonymous",
      fetchPriority: "low",
    },
  ];

  return [
    // Cast to tolerate additional attributes not declared on LinkDescriptor
    ...(fonts as unknown as LinkDescriptor[]),
  ];
};

export { links };
