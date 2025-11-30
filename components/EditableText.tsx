import type { ReactNode } from "react";

type EditableTextProps = {
  value: string;
  isEditMode: boolean;
  onSave: (formData: FormData) => Promise<any>;
  multiline?: boolean;
  className?: string;
  label?: string;
  displayValue?: string;
  renderDisplay?: (value: string) => ReactNode;
};

export default function EditableText({
  value,
  isEditMode,
  onSave,
  multiline = false,
  className = "",
  label,
  displayValue,
  renderDisplay,
}: EditableTextProps) {
  if (!isEditMode) {
    return (
      <div className={className}>
        {renderDisplay ? renderDisplay(displayValue ?? value) : <p>{displayValue ?? value}</p>}
      </div>
    );
  }

  return (
    <form
      action={onSave}
      className={`rounded-3xl border-2 border-mist/60 bg-white/60 p-4 shadow-soft ${className}`}
    >
      {label && (
        <p className="text-xs uppercase tracking-[0.3em] text-ink/60">
          {label} · Edit mode
        </p>
      )}
      {multiline ? (
        <textarea
          name="value"
          defaultValue={value}
          rows={multiline ? 4 : 1}
          className="mt-2 w-full resize-none bg-transparent font-body text-base leading-relaxed text-ink outline-none"
        />
      ) : (
        <input
          name="value"
          defaultValue={value}
          className="mt-2 w-full bg-transparent font-body text-base text-ink outline-none"
        />
      )}

      <div className="mt-3 flex items-center gap-3 text-xs uppercase tracking-[0.25em]">
        <button
          type="submit"
          className="rounded-full bg-ink px-4 py-2 font-semibold text-sand transition hover:bg-ink/90 disabled:opacity-60"
        >
          Save
        </button>
      </div>
    </form>
  );
}
