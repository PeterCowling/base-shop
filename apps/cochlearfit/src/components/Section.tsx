import React, { useMemo } from "react";

import Container from "@/components/layout/Container";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
};

const Section = React.memo(function Section({
  children,
  className,
  containerClassName,
}: SectionProps) {
  const outerClasses = useMemo(() => {
    return className ? `py-10 ${className}` : "py-10";
  }, [className]);

  return (
    <section className={outerClasses}>
      {containerClassName ? (
        <Container className={containerClassName}>{children}</Container>
      ) : (
        <Container>{children}</Container>
      )}
    </section>
  );
});

export default Section;
