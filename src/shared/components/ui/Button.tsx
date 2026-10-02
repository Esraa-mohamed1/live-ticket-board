import type { ButtonProps } from "@/shared/interfaces";

export function Button({
  variant = "primary",
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
