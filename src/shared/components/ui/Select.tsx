import type { SelectProps } from "@/shared/interfaces";

export function Select({ label, options, errors, id, ...props }: SelectProps) {
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`form-select${errors?.length ? " form-input-error" : ""}`}
        aria-describedby={errors?.length ? `${id}-error` : undefined}
        aria-invalid={errors?.length ? true : undefined}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {errors?.map((e) => (
        <p key={e} id={`${id}-error`} className="field-error" role="alert">
          {e}
        </p>
      ))}
    </div>
  );
}
