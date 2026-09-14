export default function AdminLoading() {
  return (
    <div className="p-8 space-y-4">
      <div className="h-8 w-48 bg-gwc-border/30 rounded-md animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-gwc-border/20 rounded-lg animate-pulse"
          />
        ))}
      </div>
      <div className="h-64 bg-gwc-border/20 rounded-lg animate-pulse" />
    </div>
  );
}
