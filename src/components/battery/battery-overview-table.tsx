import Link from "next/link";
import type { BatteryOverviewRow } from "@/lib/battery/overview";
import { VEHICLE_TYPE_LABELS, type VehicleType } from "@/types/domain";
import { cn } from "@/lib/utils";

function formatDay(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${day}/${month}`;
}

export function BatteryOverviewTable({
  rows,
  dateKeys,
  vehicleHrefById,
  vehicleTypeById,
}: {
  rows: BatteryOverviewRow[];
  dateKeys: string[];
  vehicleHrefById: Map<string, string>;
  vehicleTypeById: Map<string, VehicleType>;
}) {
  if (rows.length === 0) {
    return <p className="p-8 text-center text-sm text-muted-foreground">Nenhum veículo cadastrado ainda.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-muted-foreground">
          <tr>
            <th className="sticky left-0 z-10 whitespace-nowrap bg-card px-4 py-3 font-medium">Veículo</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Tipo</th>
            {dateKeys.map((date) => (
              <th key={date} className="whitespace-nowrap px-4 py-3 text-center font-medium">
                {formatDay(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.vehicleId} className="border-b border-border last:border-0 hover:bg-muted/50">
              <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-4 py-3">
                <Link href={vehicleHrefById.get(row.vehicleId) ?? "#"} className="font-medium hover:underline">
                  {row.nickname}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {VEHICLE_TYPE_LABELS[vehicleTypeById.get(row.vehicleId) ?? "outro"]}
              </td>
              {row.cells.map((cell) => (
                <td key={cell.date} className="px-4 py-3 text-center">
                  {cell.voltage === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex min-w-14 justify-center rounded-md px-2 py-1 font-medium tabular-nums",
                        cell.low && "bg-warning/25 text-warning"
                      )}
                    >
                      {cell.voltage.toFixed(2)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
