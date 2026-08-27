import Link from "next/link";
import { PAYMENT_METHOD_LABELS, type Refuel, type Vehicle } from "@/types/domain";

export function RefuelList({
  refuels,
  vehicleById,
  attachmentIdByRefuel,
}: {
  refuels: Refuel[];
  vehicleById?: Map<string, Vehicle>;
  attachmentIdByRefuel: Map<string, string>;
}) {
  if (refuels.length === 0) {
    return <p className="px-6 py-6 text-sm text-muted-foreground">Nenhum abastecimento lançado ainda.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="border-y border-border text-left text-muted-foreground">
        <tr>
          <th className="px-6 py-2 font-medium">Data</th>
          {vehicleById && <th className="px-6 py-2 font-medium">Veículo</th>}
          <th className="px-6 py-2 font-medium">Litros</th>
          <th className="px-6 py-2 font-medium">Valor</th>
          <th className="px-6 py-2 font-medium">Posto</th>
          <th className="px-6 py-2 font-medium">Pagamento</th>
          <th className="px-6 py-2 font-medium">Anexo</th>
        </tr>
      </thead>
      <tbody>
        {refuels.map((r) => {
          const attachmentId = attachmentIdByRefuel.get(r.id);
          return (
            <tr key={r.id} className="border-b border-border last:border-0">
              <td className="px-6 py-2">{new Date(r.refuel_date + "T00:00:00").toLocaleDateString("pt-BR")}</td>
              {vehicleById && (
                <td className="px-6 py-2">
                  {vehicleById.get(r.vehicle_id) ? (
                    <Link href={`/vehicles/${r.vehicle_id}`} className="font-medium hover:underline">
                      {vehicleById.get(r.vehicle_id)!.nickname}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              )}
              <td className="px-6 py-2">{r.liters}L</td>
              <td className="px-6 py-2 font-medium">
                R$ {r.total_value.toFixed(2)}
              </td>
              <td className="px-6 py-2 text-muted-foreground">{r.gas_station ?? "—"}</td>
              <td className="px-6 py-2 text-muted-foreground">
                {r.payment_method ? PAYMENT_METHOD_LABELS[r.payment_method] : "—"}
              </td>
              <td className="px-6 py-2">
                {attachmentId ? (
                  <a
                    href={`/api/attachments/${attachmentId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Ver
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
