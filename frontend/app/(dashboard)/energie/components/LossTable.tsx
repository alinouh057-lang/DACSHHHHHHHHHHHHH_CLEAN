// app/(dashboard)/energie/components/LossTable.tsx
'use client';

import { C } from '@/lib/colors';
import { LOSS_TABLE } from '../constants/lossTable';

export default function LossTable() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
      <thead>
        <tr>
          {['Niveau', 'Label', 'Perte', 'Restante', 'Action'].map(h => (
            <th
              key={h}
              style={{
                padding: '8px 12px',
                fontSize: 10,
                fontWeight: 700,
                color: C.text3,
                textTransform: 'uppercase',
                letterSpacing: 0.7,
                borderBottom: `1px solid ${C.border}`,
                textAlign: 'left',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {LOSS_TABLE.map((row, i) => {
          const RowIcon = row.icon;
          return (
            <tr key={row.level} style={{ background: i % 2 === 0 ? C.surface2 : C.surface }}>
              <td style={{ padding: '9px 12px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: row.color,
                      display: 'inline-block',
                    }}
                  />
                  {row.level}
                </span>
              </td>
              <td style={{ padding: '9px 12px' }}>{row.label}</td>
              <td style={{ padding: '9px 12px', fontWeight: 700, color: row.color }}>{row.loss}%</td>
              <td style={{ padding: '9px 12px' }}>{row.remaining} W</td>
              <td
                style={{
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 600,
                  color: row.color,
                }}
              >
                <RowIcon size={12} />
                {row.action}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}