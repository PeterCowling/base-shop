import { Grid } from "@/components/primitives/Grid";

const SERVICE_KEYS = [
  "services.list.design",
  "services.list.distribution",
  "services.list.platform",
];

type ServicesSectionProps = {
  translator: (key: string) => string;
  isZh: boolean;
};

const joinClasses = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function ServicesSection({ translator, isZh }: ServicesSectionProps) {
  const cardBase = ["rounded-2xl", "p-5", "transition", "hover:shadow-lg"];
  const cardPanelZh = ["border-accent/50", "bg-zinc-900/50", "text-zinc-100"];
  const cardPanelEn = ["border-slate-200", "bg-white/80", "text-slate-900"];
  const introColor = isZh ? "text-zinc-200" : "text-slate-700";

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-display text-4xl uppercase skylar-heading-tracking">
          {translator("services.heading")}
        </p>
        <p className={`font-body text-base leading-6 ${introColor}`}>
          {translator("services.intro")}
        </p>
      </div>
      <Grid cols={1} gap={4} className="md:grid-cols-3">
        {SERVICE_KEYS.map((key) => (
          <div
            key={key}
            className={joinClasses(...cardBase, ...(isZh ? cardPanelZh : cardPanelEn))}
          >
            <p className="font-body text-sm uppercase skylar-subheading-tracking">
              {translator(key)}
            </p>
          </div>
        ))}
      </Grid>
    </section>
  );
}
