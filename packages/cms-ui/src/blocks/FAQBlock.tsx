// packages/ui/components/cms/blocks/FAQBlock.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/design-system/shadcn";

interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  items?: FAQItem[];
  minItems?: number;
  maxItems?: number;
}

export default function FAQBlock({
  items = [],
  minItems,
  maxItems,
}: Props) {
  const filtered = items.filter(({ question, answer }) => question && answer);
  const list = filtered.slice(0, maxItems ?? filtered.length);
  if (!list.length || list.length < (minItems ?? 0)) return null;
  return (
    <Accordion
      type="multiple"
      defaultValue={list.map((_, index) => `faq-${index}`)}
      className="space-y-2"
    >
      {list.map(({ question, answer }, index) => {
        const value = `faq-${index}`;
        return (
          <AccordionItem key={value} value={value} className="border-none">
            <AccordionTrigger className="rounded-md border border-border/60 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
              {question}
            </AccordionTrigger>
            <AccordionContent className="pt-2 text-sm text-muted-foreground">
              {answer}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
