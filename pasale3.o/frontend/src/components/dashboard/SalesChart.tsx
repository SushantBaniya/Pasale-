import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTranslation } from '../../utils/i18n';
import { useThemeStore } from '../../store/themeStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type Period = 'weekly' | 'monthly' | 'yearly';

interface SalesChartProps {
  data: { name: string; sales: number; revenue: number }[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [period, setPeriod] = useState<Period>('weekly');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(theme === 'dark');
  }, [theme]);

  // Transform data based on selected period
  const getChartData = () => {
    if (period === 'weekly') {
      return data; // Use provided weekly data
    } else if (period === 'monthly') {
      // Aggregate to monthly (example transformation)
      return [
        { name: 'Jan', sales: 12000, revenue: 24000 },
        { name: 'Feb', sales: 15000, revenue: 30000 },
        { name: 'Mar', sales: 18000, revenue: 36000 },
        { name: 'Apr', sales: 14000, revenue: 28000 },
        { name: 'May', sales: 16000, revenue: 32000 },
        { name: 'Jun', sales: 20000, revenue: 40000 },
      ];
    } else {
      // Yearly data
      return [
        { name: '2022', sales: 120000, revenue: 240000 },
        { name: '2023', sales: 150000, revenue: 300000 },
        { name: '2024', sales: 180000, revenue: 360000 },
      ];
    }
  };

  const chartData = getChartData();

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Sales Analytics
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={period === 'weekly' ? 'primary' : 'ghost'}
            onClick={() => setPeriod('weekly')}
          >
            {t('dashboard.weekly')}
          </Button>
          <Button
            size="sm"
            variant={period === 'monthly' ? 'primary' : 'ghost'}
            onClick={() => setPeriod('monthly')}
          >
            {t('dashboard.monthly')}
          </Button>
          <Button
            size="sm"
            variant={period === 'yearly' ? 'primary' : 'ghost'}
            onClick={() => setPeriod('yearly')}
          >
            {t('dashboard.yearly')}
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis
            dataKey="name"
            stroke={isDark ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
          />
          <YAxis
            stroke={isDark ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
              borderRadius: '8px',
              color: isDark ? '#f3f4f6' : '#111827',
            }}
          />
          <Legend wrapperStyle={{ color: isDark ? '#f3f4f6' : '#111827' }} />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Sales"
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

