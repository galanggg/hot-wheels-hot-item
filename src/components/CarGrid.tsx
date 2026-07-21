import type { Car } from "../types";
import CarCard from "./CarCard";

export default function CarGrid({ cars }: { cars: Car[] }) {
  if (cars.length === 0) {
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
      {cars.map((car, i) => (
        <CarCard key={`${car.toyNum ?? "x"}-${car.col ?? i}-${i}`} car={car} index={i} />
      ))}
    </div>
  );
}
