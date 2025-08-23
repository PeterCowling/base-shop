interface Props {
    width?: string;
    height?: string;
    /** Trigger mode for the modal */
    trigger?: "load" | "delay" | "exit";
    /** Delay in ms before showing when trigger is "delay" */
    delay?: number;
    /** HTML content rendered inside the modal */
    content?: string;
}
export default function PopupModal({ width, height, trigger, delay, content, }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=PopupModal.d.ts.map