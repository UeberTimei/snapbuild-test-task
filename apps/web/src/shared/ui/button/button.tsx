import type { ButtonProps } from "./button.types";

export function Button({ variant = "ghost", className = "", ...props }: ButtonProps) {
  return <button className={`btn btn--${variant} ${className}`} {...props} />;
}
