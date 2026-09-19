import { cn } from "@/lib/utils";

const CATEGORY_PALETTE = [
  "bg-gwc-navy/5 text-gwc-navy border border-gwc-navy/10",
  "bg-blue-50 text-blue-600 border border-blue-100",
  "bg-gwc-gold/10 text-gwc-gold-text border border-gwc-gold/20",
  "bg-purple-50 text-purple-600 border border-purple-100",
  "bg-rose-50 text-rose-600 border border-rose-100",
  "bg-teal-50 text-teal-600 border border-teal-100",
  "bg-amber-50 text-amber-700 border border-amber-100",
  "bg-indigo-50 text-indigo-600 border border-indigo-100",
];

function hashCategory(category: string): number {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash << 5) - hash + category.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface CategoryTagProps {
  category: string;
}

export function CategoryTag({ category }: CategoryTagProps) {
  const colorClass = CATEGORY_PALETTE[hashCategory(category) % CATEGORY_PALETTE.length];

  return (
    <span className={cn("inline-flex text-xs font-gwc-body rounded-md px-3 py-1 whitespace-nowrap", colorClass)}>
      {category}
    </span>
  );
}