import type { ReactNode } from "react";
import type { FieldDef } from "../config";

interface FormFieldProps {
  field: FieldDef;
  error?: string;
  children: ReactNode;
}

export function FormField({ field, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.name} className="text-sm font-semibold">
        {field.label}
        {field.required && <span className="text-red-700"> *</span>}
      </label>
      {children}
      {field.help && !error && <p className="text-xs text-muted">{field.help}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
