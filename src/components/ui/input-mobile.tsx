import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputMobileProps extends React.ComponentProps<"input"> {
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
}

const InputMobile = React.forwardRef<HTMLInputElement, InputMobileProps>(
  ({ className, type, inputMode, ...props }, ref) => {
    // Auto-set inputMode based on type
    const autoInputMode = 
      type === "tel" ? "tel" :
      type === "email" ? "email" :
      type === "number" ? "numeric" :
      inputMode;

    return (
      <input
        type={type}
        inputMode={autoInputMode}
        className={cn(
          "flex h-12 w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-target",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
InputMobile.displayName = "InputMobile";

export { InputMobile };
