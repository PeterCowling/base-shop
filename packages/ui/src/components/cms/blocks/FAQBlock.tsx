import Accordion from "../../molecules/Accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  faqs?: FAQItem[];
  minItems?: number;
  maxItems?: number;
}

export default function FAQBlock({ faqs = [], minItems, maxItems }: Props) {
  const list = faqs.slice(0, maxItems ?? faqs.length);
  if (!list.length || list.length < (minItems ?? 0)) return null;

  return (
    <Accordion
      items={list.map((f) => ({ title: f.question, content: f.answer }))}
    />
  );
}
