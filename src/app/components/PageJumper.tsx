import { useState } from "react";
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";

interface PageJumperProps {
  currentPage: number;   // 0-indexed
  totalPages:  number;
  onPageChange:(page: number) => void;
}

export function PageJumper({ currentPage, totalPages, onPageChange }: PageJumperProps) {
  const [inputVal, setInputVal] = useState("");

  if (totalPages <= 1) return null;

  const handleJump = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onPageChange(n - 1);
      setInputVal("");
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap mt-8">
      {/* First / Prev */}
      <button
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0}
        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="First page"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page indicator */}
      <span className="px-4 py-2 text-sm text-white/50">
        Page <span className="text-white font-semibold">{currentPage + 1}</span> of{" "}
        <span className="text-white font-semibold">{totalPages.toLocaleString()}</span>
      </span>

      {/* Next / Last */}
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage >= totalPages - 1}
        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <button
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage >= totalPages - 1}
        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Last page"
      >
        <ChevronsRight className="w-4 h-4" />
      </button>

      {/* Jump to page */}
      <div className="flex items-center gap-2 ml-2">
        <span className="text-white/30 text-sm">Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleJump()}
          placeholder="…"
          className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={handleJump}
          className="px-3 py-1.5 bg-white/10 border border-white/15 text-white/70 text-sm rounded-lg hover:bg-white/15 hover:text-white transition-all"
        >
          Go
        </button>
      </div>
    </div>
  );
}