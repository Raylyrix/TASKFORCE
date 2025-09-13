'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ResponseTimeChartProps {
  data?: Array<{
    range: string;
    count: number;
  }>;
}

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  // Transform data for the chart
  const chartData = data?.map(item => ({
    range: item.range,
    count: item.count,
    color: getColorForRange(item.range),
  })) || [];

  function getColorForRange(range: string): string {
    switch (range) {
      case '0-1h':
        return '#10B981'; // Green
      case '1-4h':
        return '#3B82F6'; // Blue
      case '4-8h':
        return '#F59E0B'; // Yellow
      case '8-24h':
        return '#EF4444'; // Red
      case '>24h':
        return '#8B5CF6'; // Purple
      default:
        return '#6B7280'; // Gray
    }
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="range" 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          <Bar 
            dataKey="count" 
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            name="Messages"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
