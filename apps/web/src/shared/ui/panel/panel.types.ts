import type { ReactNode } from "react";

export interface PanelProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}
