"use client";

import { type ChangeEvent,useId, useRef, useState } from "react";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
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
  /** Semantic input shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit input radius token override. */
  radius?: PrimitiveRadius;
  /** Semantic file trigger shape. Ignored when `fileButtonRadius` is provided. */
  fileButtonShape?: PrimitiveShape;
  /** Explicit file trigger radius token override. */
  fileButtonRadius?: PrimitiveRadius;
}

export function FileSelector({
  onFilesSelected,
  multiple = false,
  label,
  description,
  error,
  className,
  inputClassName,
  shape,
  radius,
  fileButtonShape,
  fileButtonRadius,
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
  const inputShapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "md",
  });
  const fileButtonShapeRadiusClass = resolveShapeRadiusClass({
    shape: fileButtonShape,
    radius: fileButtonRadius,
    defaultRadius: "md",
  }).replace(/^rounded-/, "file:rounded-");

  return (
    <FormField
      id={inputId}
      label={label}
      description={description}
      error={error}
      {...(required !== undefined ? { required } : {})}
      className={cn("space-y-2", className)}

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
              "block w-full border border-input bg-input px-3 py-2 text-sm text-foreground shadow-sm file:me-3 file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm", // i18n-exempt -- UI-000 utility classes
              inputShapeRadiusClass,
              fileButtonShapeRadiusClass,
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
