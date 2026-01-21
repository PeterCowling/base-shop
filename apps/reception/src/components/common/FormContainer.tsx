import type { FC, ReactNode } from "react";

export interface FormContainerProps {
  title: string;
  borderColor: string;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

const FormContainer: FC<FormContainerProps> = ({
  title,
  borderColor,
  onClose,
  children,
  className,
}) => {
  return (
    <div
      className={`relative mb-6 border ${borderColor} rounded p-4 pr-8 pt-8 dark:bg-darkSurface dark:text-darkAccentGreen ${
        className ?? ""
      }`.trim()}
    >
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-error-main text-white dark:bg-darkAccentOrange dark:text-darkSurface"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      )}
      <h2 className="text-xl font-semibold mb-2 dark:text-darkAccentGreen">{title}</h2>
      {children}
    </div>
  );
};

export default FormContainer;
