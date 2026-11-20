import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

/** The design system's button: `.button` in design/base.css, filled with the accent when primary. */
export function Button({ variant = "secondary", className, type = "button", ...props }: ButtonProps) {
  const classes = ["button", variant === "primary" ? "button--primary" : "", className ?? ""].filter(Boolean).join(" ");
  return <button type={type} className={classes} {...props} />;
}
