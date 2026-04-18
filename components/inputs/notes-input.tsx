'use client';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function NotesInput({ value, onChange }: Props) {
  return (
    <div>
      <label className="text-[10px] text-text-muted mb-1 block">
        Free-text notes about this deal. Saved with the analysis.
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Neighborhood observations, inspection concerns, seller motivation, offer strategy..."
        className="w-full h-24 bg-bg-base border border-border-default rounded-md text-xs text-text-foreground px-2.5 py-2 outline-none focus:border-accent-blue resize-none"
      />
    </div>
  );
}
