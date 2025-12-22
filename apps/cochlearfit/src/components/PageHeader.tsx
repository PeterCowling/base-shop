import React, { useMemo } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
};

const PageHeader = React.memo(function PageHeader({
  title,
  description,
  eyebrow,
}: PageHeaderProps) {
  const descriptionBlock = useMemo(() => {
    if (!description) return null;
    return <p className="text-sm text-muted-foreground">{description}</p>;
  }, [description]);

  return (
    <div className="space-y-3">
      {eyebrow ? (
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </div>
      ) : null}
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      {descriptionBlock}
    </div>
  );
});

export default PageHeader;
