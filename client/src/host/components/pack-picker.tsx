interface PackInfo {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

interface Props {
  packs: PackInfo[];
  selected: string | null;
  onChange: (id: string) => void;
}

export function PackPicker({ packs, selected, onChange }: Props) {
  if (packs.length === 0) {
    return <p className="text-red-400 text-sm">No packs loaded — drop a JSON into /packs/</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs uppercase opacity-60">Question Pack</label>
      <select
        className="bg-black border-2 border-cyan-700 text-cyan-100 rounded px-3 py-2 text-base font-bold"
        value={selected ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {packs.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.questionCount} Q)
          </option>
        ))}
      </select>
      {selected && (
        <p className="text-xs opacity-60 mt-1">
          {packs.find((p) => p.id === selected)?.description ?? ""}
        </p>
      )}
    </div>
  );
}
