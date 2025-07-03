import PageBuilder from "./PageBuilder";

export type ProductPageBuilderProps = React.ComponentProps<typeof PageBuilder>;

export default function ProductPageBuilder(props: ProductPageBuilderProps) {
  return <PageBuilder {...props} />;
}
