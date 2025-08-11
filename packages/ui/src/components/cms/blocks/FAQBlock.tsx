// packages/ui/components/cms/blocks/FAQBlock.tsx
import { Accordion, type AccordionItem } from "../../molecules/Accordion";

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
  const list = items.slice(0, maxItems ?? items.length);
  if (!list.length || list.length < (minItems ?? 0)) return null;
  const accItems: AccordionItem[] = list.map(({ question, answer }) => ({
    title: question,
    content: answer,
  }));
  return <Accordion items={accItems} />;
}
