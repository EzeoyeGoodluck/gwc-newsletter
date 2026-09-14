interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center gap-3">
      <h1 className="text-2xl font-gwc-heading font-semibold text-gwc-text">
        {title}
      </h1>
      <p className="text-gwc-text-muted max-w-md">{description}</p>
    </div>
  );
}
