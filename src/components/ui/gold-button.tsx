import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GoldButtonProps {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

export function GoldButton({
  label,
  icon: Icon,
  onClick,
  className,
}: GoldButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "bg-gwc-gold text-gwc-gold-text font-gwc-heading font-semibold !rounded-gwc-input",
        "hover:bg-gwc-gold hover:brightness-95",
        "justify-start cursor-pointer  h-11 px-4 text-sm gap-2",
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}
