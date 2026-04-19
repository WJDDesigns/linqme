"use client";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Optional: show the "X of Y items" text */
  showItemCount?: boolean;
  /** Optional label for items (default "items") */
  itemLabel?: string;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  showItemCount = true,
  itemLabel = "items",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize) return null;

  // Build page number range with ellipsis
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {showItemCount && (
        <p className="text-xs text-on-surface-variant/50">
          {startItem}-{endItem} of {totalItems} {itemLabel}
        </p>
      )}

      <div className="flex items-center gap-1 ml-auto">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-xs text-on-surface-variant/60 hover:bg-surface-container-high/60 hover:text-on-surface transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <i className="fa-solid fa-chevron-left text-[10px]" />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-on-surface-variant/30">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                p === currentPage
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant/60 hover:bg-surface-container-high/60 hover:text-on-surface"
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-xs text-on-surface-variant/60 hover:bg-surface-container-high/60 hover:text-on-surface transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <i className="fa-solid fa-chevron-right text-[10px]" />
        </button>
      </div>
    </div>
  );
}
