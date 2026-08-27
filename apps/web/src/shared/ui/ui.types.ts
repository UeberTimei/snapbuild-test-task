import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "ghost" | "danger";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export interface PanelProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export interface FieldProps {
  label: string;
  children: ReactNode;
}

export interface BadgeProps {
  tone: string;
  children: ReactNode;
}

export interface EmptyProps {
  children: ReactNode;
}
