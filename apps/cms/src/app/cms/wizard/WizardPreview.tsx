import { Button } from "@/components/atoms";
import { blockRegistry } from "@/components/cms/blocks";
import { Footer, Header, SideNav } from "@/components/organisms";
import { AppShell } from "@/components/templates/AppShell";
import TranslationsProvider from "@/i18n/Translations";
import enMessages from "@i18n/en.json";
import type { PageComponent } from "@types";
import { useEffect, useState } from "react";
import { STORAGE_KEY } from "./utils";

export default function WizardPreview({
  style,
}: {
  style: React.CSSProperties;
}): React.JSX.Element {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [components, setComponents] = useState<PageComponent[]>([]);

  useEffect(() => {
    const load = () => {
      try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return;
        const data = JSON.parse(json);
        if (Array.isArray(data.components)) {
          setComponents(data.components as PageComponent[]);
        }
      } catch {}
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const widthMap: Record<"desktop" | "tablet" | "mobile", string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const containerStyle = { ...style, width: widthMap[viewport] };

  function Block({ component }: { component: PageComponent }) {
    if (component.type === "Text") {
      const text = (component as any).text;
      const value = typeof text === "string" ? text : (text?.en ?? "");
      return <div dangerouslySetInnerHTML={{ __html: value }} />;
    }
    const Comp = (blockRegistry as any)[component.type];
    if (!Comp) return null;
    const { id, type, ...props } = component as any;
    return <Comp {...props} locale="en" />;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2">
        <Button
          variant={viewport === "desktop" ? "default" : "outline"}
          onClick={() => setViewport("desktop")}
        >
          Desktop
        </Button>
        <Button
          variant={viewport === "tablet" ? "default" : "outline"}
          onClick={() => setViewport("tablet")}
        >
          Tablet
        </Button>
        <Button
          variant={viewport === "mobile" ? "default" : "outline"}
          onClick={() => setViewport("mobile")}
        >
          Mobile
        </Button>
      </div>
      <div style={containerStyle} className="mx-auto rounded border">
        <TranslationsProvider messages={enMessages}>
          <AppShell
            header={<Header locale="en" />}
            sideNav={<SideNav />}
            footer={<Footer />}
          >
            {components.map((c) => (
              <Block key={c.id} component={c} />
            ))}
          </AppShell>
        </TranslationsProvider>
      </div>
    </div>
  );
}
