import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTranslation } from '../../utils/i18n';
import { useThemeStore } from '../../store/themeStore';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
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

  useEffect(() => { setIsDark(theme === 'dark'); }, [theme]);

  const getChartData = () => {
    if (period === 'weekly') return data;
    else if (period === 'monthly') {
      return [
        { name: 'Jan', sales: 12000, revenue: 24000 },
        { name: 'Feb', sales: 15000, revenue: 30000 },
        { name: 'Mar', sales: 18000, revenue: 36000 },
        { name: 'Apr', sales: 14000, revenue: 28000 },
        { name: 'May', sales: 16000, revenue: 32000 },
        { name: 'Jun', sales: 20000, revenue: 40000 },
      ];
    } else {
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
        <h3 className="text-xl font-medium text-[#1E293B] dark:text-[#EAE5DF]">Sales Analytics</h3>
        <div className="flex gap-2">
          <Button size="sm" variant={period === 'weekly' ? 'primary' : 'ghost'} onClick={() => setPeriod('weekly')}>{t('dashboard.weekly')}</Button>
          <Button size="sm" variant={period === 'monthly' ? 'primary' : 'ghost'} onClick={() => setPeriod('monthly')}>{t('dashboard.monthly')}</Button>
          <Button size="sm" variant={period === 'yearly' ? 'primary' : 'ghost'} onClick={() => setPeriod('yearly')}>{t('dashboard.yearly')}</Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E2E8F0'} />
          <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#475569'} tick={{ fill: isDark ? '#9ca3af' : '#475569' }} />
          <YAxis stroke={isDark ? '#9ca3af' : '#475569'} tick={{ fill: isDark ? '#9ca3af' : '#475569' }} />
          <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', border: isDark ? '1px solid #374151' : '1px solid #E2E8F0', borderRadius: '8px', color: isDark ? '#f3f4f6' : '#1E293B' }} />
          <Legend wrapperStyle={{ color: isDark ? '#f3f4f6' : '#1E293B' }} />
          <Line type="monotone" dataKey="sales" stroke="#F2DD50" strokeWidth={2} name="Sales" />
          <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
