import type { Car } from "../types";
import CarCard from "./CarCard";

export default function CarGrid({ cars }: { cars: Car[] }) {
  if (cars.length === 0) {
    return (
      <div className="py-20 text-center text-neutral-500">
        <p className="text-lg">No matches.</p>
        <p className="mt-1 text-sm">Try a different name or clear the filters.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cars.map((car, i) => (
        <CarCard key={`${car.toyNum ?? "x"}-${car.col ?? i}-${i}`} car={car} />
      ))}
    </div>
  );
}
