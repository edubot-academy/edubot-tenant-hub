import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  acceptTabs?: boolean;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, acceptTabs = false, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (acceptTabs && event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        const { selectionStart, selectionEnd, value } = event.currentTarget;
        const nextValue = `${value.slice(0, selectionStart)}\t${value.slice(selectionEnd)}`;
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

        nativeSetter?.call(event.currentTarget, nextValue);
        event.currentTarget.dispatchEvent(new Event("input", { bubbles: true }));

        requestAnimationFrame(() => {
          event.currentTarget.selectionStart = selectionStart + 1;
          event.currentTarget.selectionEnd = selectionStart + 1;
        });
      }

      onKeyDown?.(event);
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
