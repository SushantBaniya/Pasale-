import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTranslation } from '../../utils/i18n';
import { useThemeStore } from '../../store/themeStore';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type Period = 'weekly' | 'monthly' | 'yearly';

interface ChartPoint { name: string; sales: number; expenses: number; }

interface RevenueChartProps {
  data: { weekly: ChartPoint[]; monthly: ChartPoint[]; yearly: ChartPoint[]; };
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [period, setPeriod] = useState<Period>('monthly');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => { setIsDark(theme === 'dark'); }, [theme]);

  const chartData = useMemo(() => data[period] || [], [data, period]);

  return (
    <Card className="p-3 sm:p-4 lg:p-6 h-full flex flex-col" noPadding>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-0">
        <div>
          <h3 className="text-base sm:text-lg lg:text-xl font-medium text-[#1E293B] dark:text-[#EAE5DF]">
            Revenue Analytics
          </h3>
          <p className="text-xs sm:text-sm text-[#475569] dark:text-[#44454F] hidden sm:block">
            Track your sales and expenses
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2 bg-[#FFFFFF] dark:bg-[#15161C] p-0.5 sm:p-1 rounded-lg">
          <Button size="xs" variant={period === 'weekly' ? 'primary' : 'ghost'} onClick={() => setPeriod('weekly')} className="text-[10px] sm:text-xs">{t('dashboard.weekly')}</Button>
          <Button size="xs" variant={period === 'monthly' ? 'primary' : 'ghost'} onClick={() => setPeriod('monthly')} className="text-[10px] sm:text-xs">{t('dashboard.monthly')}</Button>
          <Button size="xs" variant={period === 'yearly' ? 'primary' : 'ghost'} onClick={() => setPeriod('yearly')} className="text-[10px] sm:text-xs">{t('dashboard.yearly')}</Button>
        </div>
      </div>

      <div className="flex-1 w-full h-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%" debounce={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E2E8F0'} />
            <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#475569'} tick={{ fill: isDark ? '#9ca3af' : '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis stroke={isDark ? '#9ca3af' : '#475569'} tick={{ fill: isDark ? '#9ca3af' : '#475569', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} />
            <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', border: isDark ? '1px solid #374151' : '1px solid #E2E8F0', borderRadius: '8px', color: isDark ? '#f3f4f6' : '#1E293B', fontSize: '12px', padding: '8px 12px' }} />
            <Legend wrapperStyle={{ color: isDark ? '#f3f4f6' : '#1E293B', fontSize: '12px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="expenses" stroke="#F2DD50" strokeWidth={2} name="Expenses" dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={2} name="Sales" dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};