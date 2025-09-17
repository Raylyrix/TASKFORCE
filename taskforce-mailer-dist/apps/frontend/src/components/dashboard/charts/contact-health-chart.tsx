'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ContactHealthChartProps {
  data?: Array<{
    id: string;
    email: string;
    name?: string;
    healthScore: number;
  }>;
}

export function ContactHealthChart({ data }: ContactHealthChartProps) {
  // Transform data for pie chart
  const chartData = [
    {
      name: 'Excellent (90-100%)',
      value: data?.filter(contact => contact.healthScore >= 90).length || 0,
      color: '#10B981',
    },
    {
      name: 'Good (70-89%)',
      value: data?.filter(contact => contact.healthScore >= 70 && contact.healthScore < 90).length || 0,
      color: '#3B82F6',
    },
    {
      name: 'Fair (50-69%)',
      value: data?.filter(contact => contact.healthScore >= 50 && contact.healthScore < 70).length || 0,
      color: '#F59E0B',
    },
    {
      name: 'Poor (0-49%)',
      value: data?.filter(contact => contact.healthScore < 50).length || 0,
      color: '#EF4444',
    },
  ].filter(item => item.value > 0);

  const COLORS = chartData.map(item => item.color);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
