interface CampaignsPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function CampaignsPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: CampaignsPaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const hasPrevious = page > 1;
  const hasNext = end < total;

  return (
    <div className="flex items-center justify-between px-6 py-6 border-t border-gwc-border/20">
      <p className="text-base text-gwc-text-body">
        Showing {start}-{end} of {total} campaigns
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevious}
          aria-label="Previous page"
          className="border border-gwc-border/50 rounded-md px-3 py-1 text-base text-gwc-text-body disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gwc-muted-bg cursor-pointer"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
          className="border border-gwc-border/50 rounded-md px-3 py-1 text-base text-gwc-text-body disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gwc-muted-bg cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}
