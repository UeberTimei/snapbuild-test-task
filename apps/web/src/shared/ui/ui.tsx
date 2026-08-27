import type { BadgeProps, ButtonProps, EmptyProps, FieldProps, PanelProps } from "./ui.types";

export function Button({ variant = "ghost", className = "", ...props }: ButtonProps) {
  return <button className={`btn btn--${variant} ${className}`} {...props} />;
}

export function Panel({ title, children, actions }: PanelProps) {
  return (
    <section className="panel">
      <header className="panel__head">
        <h2>{title}</h2>
        {actions}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}

export function Badge({ tone, children }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function Empty({ children }: EmptyProps) {
  return <p className="empty">{children}</p>;
}
