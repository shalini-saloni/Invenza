import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const barData = [
  { name: 'Aug', predicted: 1600, actual: 1700 },
  { name: 'Sep', predicted: 1800, actual: 1750 },
  { name: 'Oct', predicted: 1700, actual: 1800 },
  { name: 'Nov', predicted: 1900, actual: 1850 },
  { name: 'Dec', predicted: 1600, actual: 1500 },
  { name: 'Jan', predicted: 1500, actual: 1400 },
  { name: 'Feb', predicted: 1600, actual: 0 }, // Assuming future months don't have actuals yet
];

const areaData = [
  { name: 'May', incidents: 19 },
  { name: 'Jun', incidents: 17 },
  { name: 'Jul', incidents: 15 },
  { name: 'Aug', incidents: 13 },
  { name: 'Sep', incidents: 11 },
  { name: 'Oct', incidents: 9 },
  { name: 'Nov', incidents: 7 },
];

interface ChartProps {
  highlightTooltip?: string;
}

export const BarChartComponent: React.FC<ChartProps> = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barData}
          margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6b7280', fontSize: 10 }}
            ticks={[0, 550, 1100, 1650, 2200]}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ backgroundColor: '#202022', border: 'none', borderRadius: '8px', color: '#fff' }}
          />
          <Bar dataKey="predicted" fill="#bef264" radius={[4, 4, 4, 4]} barSize={8} />
          <Bar dataKey="actual" fill="#fb923c" radius={[4, 4, 4, 4]} barSize={8} />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Custom Legend to match screenshot exactly */}
      <div className="flex-center" style={{ gap: '24px', marginTop: '12px' }}>
        <div className="flex-center" style={{ gap: '6px', fontSize: '12px', color: '#9ca3af' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#bef264' }}></div>
          Predicted
        </div>
        <div className="flex-center" style={{ gap: '6px', fontSize: '12px', color: '#9ca3af' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fb923c' }}></div>
          Actual
        </div>
      </div>
    </div>
  );
};

export const AreaChartComponent: React.FC<ChartProps> = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={areaData}
          margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6b7280', fontSize: 10 }}
            ticks={[0, 5, 10, 15, 20]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#202022', border: 'none', borderRadius: '8px', color: '#fff' }}
          />
          <Area 
            type="monotone" 
            dataKey="incidents" 
            stroke="#fb923c" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorIncidents)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
