import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center gap-4">
      <h1 className="text-4xl font-gwc-heading font-semibold text-gwc-text">
        404
      </h1>
      <p className="text-gwc-text-muted max-w-md">
        We couldn&apos;t find the page you&apos;re looking for. It may have been
        moved or doesn&apos;t exist.
      </p>
      <Link
        href="/dashboard"
        className="bg-gwc-gold text-gwc-gold-text font-gwc-heading font-semibold rounded-gwc-input px-4 py-2 text-sm cursor-pointer hover:brightness-95"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
