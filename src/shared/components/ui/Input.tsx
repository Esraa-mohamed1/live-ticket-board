import type { InputProps } from "@/shared/interfaces";

export function Input({ label, errors, id, ...props }: InputProps) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        className={`form-input${errors?.length ? " form-input-error" : ""}`}
        aria-describedby={errors?.length ? `${id}-error` : undefined}
        aria-invalid={errors?.length ? true : undefined}
        {...props}
      />
      {errors?.map((e) => (
        <p key={e} id={`${id}-error`} className="field-error" role="alert">
          {e}
        </p>
      ))}
    </div>
  );
}
