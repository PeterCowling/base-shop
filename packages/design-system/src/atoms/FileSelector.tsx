"use client";

import { type ChangeEvent,useId, useRef, useState } from "react";

import { cn } from "../utils/style";

import { FormField } from "./FormField";

export interface FileSelectorProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  onFilesSelected?: (files: File[]) => void;
  multiple?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  inputClassName?: string;
}

export function FileSelector({
  onFilesSelected,
  multiple = false,
  label,
  description,
  error,
  className,
  inputClassName,
  id,
  accept,
  capture,
  ...inputProps
}: FileSelectorProps) {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    onFilesSelected?.(selected);
    // Allow re-selecting the same file by clearing the input value.
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const required = inputProps.required;

  return (
    <FormField
      id={inputId}
      label={label}
      description={description}
      error={error}
      {...(required !== undefined ? { required } : {})}
      className={cn("space-y-2", className)}
      // eslint-disable-next-line react/no-unstable-nested-components -- UI-2610: render prop must stay inline to receive FormField-provided aria wiring
      input={({ id: controlId, describedBy: fieldDescribedBy, ariaInvalid }) => (
        <>
          <input
            id={controlId}
            ref={inputRef}
            type="file"
            multiple={multiple}
            onChange={handleChange}
            accept={accept}
            capture={capture}
            data-cy="file-input"
            data-testid="file-input"
            aria-describedby={fieldDescribedBy ?? describedBy}
            aria-invalid={ariaInvalid}
            className={cn(
              "block w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground shadow-sm file:me-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm", // i18n-exempt -- UI-000 utility classes
              inputClassName,
            )}
            {...inputProps}
          />
          {files.length > 0 && (
            <ul className="text-sm" aria-live="polite">
              {files.map((file) => (
                <li key={file.name}>{file.name}</li>
              ))}
            </ul>
          )}
        </>
      )}
    />
  );
}

export default FileSelector;
