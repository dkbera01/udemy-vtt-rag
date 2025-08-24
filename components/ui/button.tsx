import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import React from "react";

const button = cva(
  "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium shadow-soft hover:opacity-90 transition disabled:opacity-50 bg-white/10",
  {
    variants: {
      variant: {
        default: "",
        outline: "border border-white/10 bg-transparent",
      }
    },
    defaultVariants: { variant: "default" }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button ref={ref} className={clsx(button({ variant }), className)} {...props} />
  )
);
Button.displayName = "Button";
