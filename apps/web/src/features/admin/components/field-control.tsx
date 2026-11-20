import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type FieldDef, todayIso } from "../config";
import type { FormValue, TrekOption } from "../lib/form-values";

interface FieldControlProps {
  field: FieldDef;
  value: FormValue;
  invalid: boolean;
  locked: boolean;
  trails: string[];
  treks: TrekOption[];
  onChange: (value: FormValue) => void;
}

interface Option {
  value: string;
  label: string;
}

function OptionSelect({
  options,
  emptyLabel,
  value,
  onChange,
  ...attributes
}: {
  options: Option[];
  emptyLabel: string;
  value: string;
  onChange: (value: string) => void;
  id: string;
  name: string;
  "aria-invalid"?: boolean;
}) {
  return (
    <Select {...attributes} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

function TrekCheckboxes({
  id,
  treks,
  selected,
  onChange,
}: {
  id: string;
  treks: TrekOption[];
  selected: string[];
  onChange: (slugs: string[]) => void;
}) {
  const toggle = (slug: string) =>
    onChange(
      selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug],
    );

  return (
    <div id={id} className="flex flex-col gap-2 border border-border-soft bg-surface p-3">
      {treks.length === 0 && (
        <p className="text-sm text-muted">Add a trek first, then come back to link it.</p>
      )}
      {treks.map((trek) => (
        <label key={trek.slug} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(trek.slug)}
            onChange={() => toggle(trek.slug)}
          />
          {trek.name}
        </label>
      ))}
    </div>
  );
}

export function FieldControl({
  field,
  value,
  invalid,
  locked,
  trails,
  treks,
  onChange,
}: FieldControlProps) {
  const attributes = { id: field.name, name: field.name, "aria-invalid": invalid || undefined };
  const text = value as string;

  switch (field.type) {
    case "textarea":
      return <Textarea {...attributes} value={text} onChange={(e) => onChange(e.target.value)} />;

    case "select":
      return (
        <OptionSelect
          {...attributes}
          options={field.options ?? []}
          emptyLabel="Choose…"
          value={text}
          onChange={onChange}
        />
      );

    case "trail":
      return (
        <OptionSelect
          {...attributes}
          options={trails.map((name) => ({ value: name, label: name }))}
          emptyLabel="Not linked to a map trail"
          value={text}
          onChange={onChange}
        />
      );

    case "trek":
      return (
        <OptionSelect
          {...attributes}
          options={treks.map((trek) => ({ value: trek.slug, label: trek.name }))}
          emptyLabel="All treks (general rate)"
          value={text}
          onChange={onChange}
        />
      );

    case "treks":
      return (
        <TrekCheckboxes
          id={field.name}
          treks={treks}
          selected={value as string[]}
          onChange={onChange}
        />
      );

    case "date":
      return (
        <div className="flex gap-2">
          <Input
            {...attributes}
            type="date"
            value={text}
            onChange={(e) => onChange(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => onChange(todayIso())}
          >
            Today
          </Button>
        </div>
      );

    case "number":
      return (
        <Input
          {...attributes}
          type="number"
          inputMode="numeric"
          min={0}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return (
        <Input
          {...attributes}
          type={field.type === "url" ? "url" : "text"}
          placeholder={field.placeholder}
          disabled={locked}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
