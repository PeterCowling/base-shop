export interface Step {
  target: string;
  content: string;
}
export declare const STATUS: {
  readonly FINISHED: "finished";
  readonly SKIPPED: "skipped";
};
export interface CallBackProps {
  status: (typeof STATUS)[keyof typeof STATUS];
}
interface PageBuilderTourProps {
  steps: Step[];
  run: boolean;
  callback: (data: CallBackProps) => void;
}
export default function PageBuilderTour({ steps, run, callback }: PageBuilderTourProps): import("react").JSX.Element;
