import { Loader2 } from "lucide-react";
import { cn } from "@/utils/ui";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
