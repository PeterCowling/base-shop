export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  type: "text" | "email" | "select";
  name?: string;
  label?: string;
  options?: FormFieldOption[];
}

