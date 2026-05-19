"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#2d8a5e", "#4a9e6e", "#6bb389", "#8fc9a8", "#b5dcc4"];

type VolumePoint = { week: string; volume: number };
type MusclePoint = { name: string; value: number };

export function WeeklyVolumeChart({ data }: { data: VolumePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="volume" fill="#2d8a5e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MuscleDonutChart({ data }: { data: MusclePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={(props) => {
            const name = props.name ?? "";
            const value = props.value ?? 0;
            return `${name} ${value}%`;
          }}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
