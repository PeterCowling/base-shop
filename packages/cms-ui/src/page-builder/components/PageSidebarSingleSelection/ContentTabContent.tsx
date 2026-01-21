import type { PageComponent } from "@acme/types";

import ContentPanel from "../../panels/ContentPanel";

import type { HandleFieldInput, UpdateComponent } from "./types";

interface ContentTabContentProps {
  component: PageComponent;
  handleFieldInput: HandleFieldInput;
  onChange: UpdateComponent;
}

const ContentTabContent = ({ component, handleFieldInput, onChange }: ContentTabContentProps) => (
  <ContentPanel component={component} onChange={onChange} handleInput={handleFieldInput} />
);

export default ContentTabContent;
