import { ChevronLeft } from "lucide-react";

interface EntryNavigationButtonsProps {
  backLabel: string;
  onBack: () => void;
  onBackToCollection?: () => void;
}

const pillStyle = {
  minHeight: 34,
  padding: "7px 12px 7px 9px",
  borderRadius: 999,
  fontFamily: "var(--ui-font)",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
} as const;

export function EntryNavigationButtons({ backLabel, onBack, onBackToCollection }: EntryNavigationButtonsProps) {
  const soloBackToCollection = !onBackToCollection && backLabel === "Back to Collection";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={onBack}
        style={{
          ...pillStyle,
          border: soloBackToCollection ? "1px solid var(--destructive)" : "1px solid var(--border)",
          background: soloBackToCollection ? "var(--destructive)" : "var(--muted)",
          color: soloBackToCollection ? "var(--destructive-foreground)" : "var(--muted-foreground)",
        }}
      >
        <ChevronLeft size={16} /> {backLabel}
      </button>

      {onBackToCollection && (
        <button
          type="button"
          onClick={onBackToCollection}
          style={{
            ...pillStyle,
            border: "1px solid var(--destructive)",
            background: "var(--destructive)",
            color: "var(--destructive-foreground)",
          }}
        >
          <ChevronLeft size={16} /> Back to Collection
        </button>
      )}
    </div>
  );
}
