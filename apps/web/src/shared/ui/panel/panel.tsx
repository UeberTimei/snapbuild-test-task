import type { PanelProps } from "./panel.types";

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
