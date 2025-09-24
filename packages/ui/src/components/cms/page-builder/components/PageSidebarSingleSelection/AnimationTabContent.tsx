import type { PageComponent } from "@acme/types";

import InteractionsPanel from "../../panels/InteractionsPanel";
import TimelinePanel from "../../panels/TimelinePanel";
import LottieControls from "../../panels/LottieControls";
import type { HandleFieldInput } from "./types";

interface AnimationTabContentProps {
  component: PageComponent;
  handleFieldInput: HandleFieldInput;
}

const AnimationTabContent = ({ component, handleFieldInput }: AnimationTabContentProps) => (
  <div className="space-y-3">
    <InteractionsPanel component={component} handleInput={handleFieldInput} />
    <TimelinePanel component={component} handleInput={handleFieldInput} />
    <LottieControls component={component} handleInput={handleFieldInput} />
  </div>
);

export default AnimationTabContent;
