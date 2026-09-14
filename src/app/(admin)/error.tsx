"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center gap-4">
      <h1 className="text-2xl font-gwc-heading font-semibold text-gwc-text">
        Something went wrong
      </h1>
      <p className="text-gwc-text-muted max-w-md">
        We hit an unexpected error loading this section. Try again, or head back
        to the dashboard.
      </p>
      <button
        onClick={reset}
        className="bg-gwc-gold text-gwc-gold-text font-gwc-heading font-semibold rounded-gwc-input px-4 py-2 text-sm cursor-pointer hover:brightness-95"
      >
        Try again
      </button>
    </div>
  );
}
