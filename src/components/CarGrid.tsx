import type { CarGroup } from "../types";
import CarCard from "./CarCard";

export default function CarGrid({ groups }: { groups: CarGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="border border-line bg-asphalt-2 px-4 py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-flame">
          &gt; empty peg
        </p>
        <p className="mt-2 text-[13px] text-muted">
          0 cars matched. Retype the model or clear a flag.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {groups.map((group, i) => (
        <CarCard key={group.key} group={group} index={i} />
      ))}
    </div>
  );
}
