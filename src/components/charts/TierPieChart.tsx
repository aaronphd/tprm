"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { label } from "@/lib/types";

const COLORS: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#d97706",
  LOW: "#059669",
};

export function TierPieChart({ data }: { data: { tier: string; count: number }[] }) {
  const chartData = data.filter((d) => d.count > 0);
  if (chartData.length === 0) {
    return <p className="text-sm text-slate-400">No vendors yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="tier"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
        >
          {chartData.map((d) => (
            <Cell key={d.tier} fill={COLORS[d.tier]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, _name, entry) => [value, label(String(entry.payload.tier))]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
