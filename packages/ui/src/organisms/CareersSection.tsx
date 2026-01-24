import { memo, type ReactNode,useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle } from "lucide-react";

import { CfImage } from "../atoms/CfImage";
import { Section as LayoutSection } from "../atoms/Section";
import { Button } from "../components/atoms/shadcn";
import { useModal } from "../context/ModalContext";

interface ImageTextSectionProps {
  src: string;
  alt: string;
  children: ReactNode;
  reverse?: boolean;
}
interface ListWithIconProps {
  items: readonly string[];
  Icon: typeof CheckCircle;
}

const getStringArray = (tFn: ReturnType<typeof useTranslation>["t"], key: string): string[] => {
  const raw = tFn(key, { returnObjects: true });
  return Array.isArray(raw) ? raw.filter(Boolean) : [];
};

const Container = memo(({ children }: { children: ReactNode }) => (
  <LayoutSection as="div" padding="none" className="mx-auto w-full px-4 sm:px-6 lg:px-8">
    {children}
  </LayoutSection>
));
Container.displayName = "Container";

const SectionHeadline = memo(({ title }: { title: string }) => (
  <h3 className="font-heading text-xl font-semibold tracking-tight text-brand-heading">{title}</h3>
));
SectionHeadline.displayName = "SectionHeadline";

const ListWithIcon = memo(({ items, Icon }: ListWithIconProps) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 text-brand-terracotta" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
));
ListWithIcon.displayName = "ListWithIcon";

const ImageTextSection = memo(({ src, alt, children, reverse = false }: ImageTextSectionProps) => (
  <div
    className={`flex flex-col-reverse items-center gap-6 lg:flex-row ${
      reverse ? "lg:flex-row-reverse" : ""
    }`}
  >
    <div className="space-y-4 lg:w-1/2">{children}</div>

    <CfImage
      src={src}
      alt={alt}
      preset="hero"
      className="h-auto w-full rounded-lg object-cover shadow-md lg:w-1/2"
    />
  </div>
));
ImageTextSection.displayName = "ImageTextSection";

function CareersSection({ lang }: { lang?: string }): JSX.Element {
  const { t, ready } = useTranslation("careersPage", { lng: lang });
  const { openModal } = useModal();

  const requirementsList = useMemo(
    () => (ready ? getStringArray(t, "careersSection.requirementsList") : []),
    [t, ready],
  );
  const notGoodFitList = useMemo(
    () => (ready ? getStringArray(t, "careersSection.notGoodFitList") : []),
    [t, ready],
  );

  const handleApplyClick = (): void => openModal("contact");

  const IMAGES = {
    amenities: "/img/c1.avif",
    professional: "/img/c2.avif",
    panorama: "/img/positano-panorama.avif",
    vintage: "/img/positano-vintage.avif",
  } as const;

  return (
    <section
      id="careers"
      className="
        animate-fade-up scroll-mt-24 bg-brand-bg py-16
        pt-34 text-brand-text sm:pt-16 dark:bg-brand-text dark:text-brand-surface
      "
    >
      <Container>
        <h2 className="mb-12 text-center font-heading text-3xl font-bold sm:text-4xl">
          {t("careersSection.title")}
        </h2>

        <div className="rounded-lg border-l-4 border-brand-primary bg-brand-bg p-6 shadow-lg dark:bg-brand-text">
          <SectionHeadline title={t("careersSection.section1Title")} />
          <p className="mt-2 leading-relaxed">{t("careersSection.section1Paragraph1")}</p>
          <p className="mt-2 leading-relaxed">{t("careersSection.section1Paragraph2")}</p>
        </div>

        <ImageTextSection src={IMAGES.amenities} alt={t("careersSection.altAmenities")}>
          <p className="leading-relaxed">{t("careersSection.section2Paragraph1")}</p>
          <p className="leading-relaxed">{t("careersSection.section2Paragraph2")}</p>
        </ImageTextSection>

        <ImageTextSection
          src={IMAGES.professional}
          alt={t("careersSection.altProfessional")}
          reverse
        >
          <p className="leading-relaxed">{t("careersSection.section3Paragraph1")}</p>
        </ImageTextSection>

        <div className="space-y-6">
          <SectionHeadline title={t("careersSection.requirementsHeading")} />
          <ListWithIcon items={requirementsList} Icon={CheckCircle} />

          <SectionHeadline title={t("careersSection.notGoodFitHeading")} />
          <ListWithIcon items={notGoodFitList} Icon={XCircle} />

          <SectionHeadline title={t("careersSection.forCustomerFacingHeading")} />
          <p className="leading-relaxed">{t("careersSection.forCustomerFacingParagraph1")}</p>
          <p className="leading-relaxed">{t("careersSection.rolesParagraph")}</p>
          <p className="leading-relaxed">{t("careersSection.closingParagraph")}</p>
        </div>

        <ImageTextSection src={IMAGES.vintage} alt={t("careersSection.altVintage")}
        >
          <p className="leading-relaxed">{t("careersSection.section4Paragraph1")}</p>
        </ImageTextSection>

        <ImageTextSection src={IMAGES.panorama} alt={t("careersSection.altPanorama")} reverse>
          <p className="leading-relaxed">{t("careersSection.section5Paragraph1")}</p>
        </ImageTextSection>

        <div className="mt-12 flex justify-center">
          <Button onClick={handleApplyClick}>{t("careersSection.apply")}</Button>
        </div>
      </Container>
    </section>
  );
}

export default memo(CareersSection);
export { CareersSection };
