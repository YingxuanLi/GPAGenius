import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { TriangleAlertIcon } from "lucide-react";

export function HurdleWarning() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <TriangleAlertIcon className="h-4 w-4 text-yellow-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p>You must pass this item to pass the course!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
