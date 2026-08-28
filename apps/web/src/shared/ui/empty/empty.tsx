import type { EmptyProps } from "./empty.types";

export function Empty({ children }: EmptyProps) {
  return <p className="empty">{children}</p>;
}
