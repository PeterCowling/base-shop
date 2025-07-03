import { Button } from "@/components/atoms";
import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { Footer, Header, SideNav } from "@/components/organisms";
import { AppShell } from "@/components/templates/AppShell";
import TranslationsProvider from "@/i18n/Translations";
import enMessages from "@i18n/en.json";
import { useState } from "react";

export default function WizardPreview({
  style,
}: {
  style: React.CSSProperties;
}): React.JSX.Element {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );

  const widthMap: Record<"desktop" | "tablet" | "mobile", string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const containerStyle = { ...style, width: widthMap[viewport] };
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
            <HeroBanner />
            <ValueProps />
            <ReviewsCarousel />
          </AppShell>
        </TranslationsProvider>
      </div>
    </div>
  );
}
