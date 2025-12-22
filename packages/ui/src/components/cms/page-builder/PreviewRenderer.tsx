import type { ScaffoldSpec } from "@acme/types/page/ScaffoldSpec";

export interface PreviewRendererProps {
  spec: ScaffoldSpec;
  deviceId?: string;
}

const PreviewRenderer = ({ spec }: PreviewRendererProps) => {
  return (
    <div className="p-4" data-device={spec.layout}>
      {spec.hero && <h1>{spec.hero}</h1>}
      {spec.sections.map((section) => (
        <section key={section}>{section}</section>
      ))}
      {spec.cta && <button>{spec.cta}</button>}
    </div>
  );
};

export default PreviewRenderer;
