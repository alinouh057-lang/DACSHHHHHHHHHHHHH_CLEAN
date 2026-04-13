// components/StatCard.tsx
'use client';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}

export default function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${color}`,
      borderRadius: 10,
      padding: '12px',
      textAlign: 'center',
    }}>
      <Icon size={24} color={color} style={{ marginBottom: 4 }} />
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color }}>{label}</div>
    </div>
  );
}