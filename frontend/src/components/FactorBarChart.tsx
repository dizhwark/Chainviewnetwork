import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { FactorExposure } from "../api/client";

export default function FactorBarChart({ exposure }: { exposure: FactorExposure }) {
  const data = [
    { factor: "Mkt-RF", beta: exposure.mkt_rf_beta },
    { factor: "SMB", beta: exposure.smb_beta },
    { factor: "HML", beta: exposure.hml_beta },
    { factor: "RMW", beta: exposure.rmw_beta },
    { factor: "CMA", beta: exposure.cma_beta },
    { factor: "Momentum", beta: exposure.mom_beta },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="factor" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number) => value.toFixed(3)} />
        <Bar dataKey="beta" fill="#5b8def" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
