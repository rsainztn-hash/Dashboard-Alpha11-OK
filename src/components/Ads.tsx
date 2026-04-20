import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ShoppingBag, 
  ShoppingCart, 
  Store, 
  Sparkles,
  Bot
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '@/src/lib/utils';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import FilterControls from './FilterControls';

dayjs.extend(weekOfYear);
dayjs.extend(isSameOrBefore);

const adsPerformanceData = [
  { name: 'Mon', revenue: 4000, spend: 2400 },
  { name: 'Tue', revenue: 3000, spend: 1398 },
  { name: 'Wed', revenue: 2000, spend: 9800 },
  { name: 'Thu', revenue: 2780, spend: 3908 },
  { name: 'Fri', revenue: 1890, spend: 4800 },
  { name: 'Sat', revenue: 2390, spend: 3800 },
  { name: 'Sun', revenue: 3490, spend: 4300 },
];

const channelMix = [
  { name: 'Amazon', icon: ShoppingBag, amount: 62400, percentage: 72 },
  { name: 'Meli', icon: ShoppingCart, amount: 45200, percentage: 55 },
  { name: 'Shopify', icon: Store, amount: 38100, percentage: 45 },
];

export default function Ads({ 
  data, 
  selectedChannel, setSelectedChannel,
  selectedPeriod, setSelectedPeriod,
  selectedWeek, setSelectedWeek,
  selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear
}: { 
  data?: any,
  selectedChannel: string, setSelectedChannel: (c: string) => void,
  selectedPeriod: string, setSelectedPeriod: (p: string) => void,
  selectedWeek: number, setSelectedWeek: (w: number) => void,
  selectedMonth: number, setSelectedMonth: (m: number) => void,
  selectedYear: number, setSelectedYear: (y: number) => void
}) {
  const timeSeries = data?.timeSeries || [];
  const adsTimeSeries = data?.adsTimeSeries || [];

  const filteredTimeSeries = React.useMemo(() => {
    if (timeSeries.length === 0) return [];
    return timeSeries.filter((item: any) => {
      const itemDate = dayjs(item.date);
      switch (selectedPeriod) {
        case 'Weekly': return itemDate.year() === selectedYear && itemDate.week() === selectedWeek;
        case 'Monthly': return itemDate.year() === selectedYear && itemDate.month() === selectedMonth;
        case 'Year to Date': return itemDate.year() === selectedYear;
        case 'Last Year': return itemDate.year() === selectedYear - 1;
        default: return true;
      }
    });
  }, [timeSeries, selectedPeriod, selectedWeek, selectedMonth, selectedYear]);

  const filteredAdsSeries = React.useMemo(() => {
    if (adsTimeSeries.length === 0) return [];
    return adsTimeSeries.filter((item: any) => {
      const itemDate = dayjs(item.date);
      switch (selectedPeriod) {
        case 'Weekly': return itemDate.year() === selectedYear && itemDate.week() === selectedWeek;
        case 'Monthly': return itemDate.year() === selectedYear && itemDate.month() === selectedMonth;
        case 'Year to Date': return itemDate.year() === selectedYear;
        case 'Last Year': return itemDate.year() === selectedYear - 1;
        default: return true;
      }
    });
  }, [adsTimeSeries, selectedPeriod, selectedWeek, selectedMonth, selectedYear]);

  const currentSales = React.useMemo(() => {
    if (!data) return 684000;
    return filteredTimeSeries.reduce((sum, item) => sum + (item[selectedChannel] || 0), 0);
  }, [filteredTimeSeries, selectedChannel, data]);

  const currentSpend = React.useMemo(() => {
    if (!data) return 142000;
    
    if (selectedPeriod === 'Weekly') {
      // Special logic for Meli: MonthTotal / 4
      // We calculate Amazon and Shopify normally from filteredAdsSeries
      const otherSpend = filteredAdsSeries.reduce((sum, item) => {
        if (selectedChannel === 'Total') {
          return sum + (item.Amazon || 0) + (item.Shopify || 0);
        }
        return selectedChannel !== 'Meli' ? sum + (item[selectedChannel] || 0) : sum;
      }, 0);

      // For Meli, we find the monthly total for the month containing this week
      let meliWeeklySpend = 0;
      if (selectedChannel === 'Total' || selectedChannel === 'Meli') {
        const weekStart = dayjs().year(selectedYear).week(selectedWeek).startOf('week');
        const monthStart = weekStart.startOf('month');
        const monthEnd = weekStart.endOf('month');
        
        const monthTotalMeli = adsTimeSeries.reduce((sum: number, item: any) => {
          const d = dayjs(item.date);
          if (d.isSameOrAfter(monthStart, 'day') && d.isSameOrBefore(monthEnd, 'day')) {
            return sum + (item.Meli || 0);
          }
          return sum;
        }, 0);
        meliWeeklySpend = monthTotalMeli / 4;
      }

      return otherSpend + meliWeeklySpend;
    }

    return filteredAdsSeries.reduce((sum, item) => sum + (item[selectedChannel] || 0), 0);
  }, [filteredAdsSeries, adsTimeSeries, selectedChannel, data, selectedPeriod, selectedWeek, selectedYear]);

  const roas = currentSpend > 0 ? (currentSales / currentSpend).toFixed(2) : '0.00';
  const acos = currentSales > 0 ? ((currentSpend / currentSales) * 100).toFixed(1) : '0.0';

  const chartData = React.useMemo(() => {
    if (!data) return adsPerformanceData;
    
    // Combine sales and ads data for the chart
    const combinedMap: Record<string, any> = {};
    
    filteredTimeSeries.forEach(item => {
      const dateKey = item.date;
      if (!combinedMap[dateKey]) combinedMap[dateKey] = { date: dateKey, name: dayjs(dateKey).format('DD MMM'), revenue: 0, spend: 0 };
      combinedMap[dateKey].revenue += item[selectedChannel] || 0;
    });

    filteredAdsSeries.forEach(item => {
      const dateKey = item.date;
      if (!combinedMap[dateKey]) combinedMap[dateKey] = { date: dateKey, name: dayjs(dateKey).format('DD MMM'), revenue: 0, spend: 0 };
      
      let spend = item[selectedChannel] || 0;
      // Apply "divide by 4" logic for Meli in weekly view chart? 
      // If we are in weekly view, the chart shows days. 
      // If we want the week total to be Month/4, then each day should be (Month/4)/7.
      if (selectedPeriod === 'Weekly' && (selectedChannel === 'Total' || selectedChannel === 'Meli')) {
        const weekStart = dayjs().year(selectedYear).week(selectedWeek).startOf('week');
        const monthStart = weekStart.startOf('month');
        const monthEnd = weekStart.endOf('month');
        const monthTotalMeli = adsTimeSeries.reduce((sum: number, it: any) => {
          const d = dayjs(it.date);
          if (d.isSameOrAfter(monthStart, 'day') && d.isSameOrBefore(monthEnd, 'day')) return sum + (it.Meli || 0);
          return sum;
        }, 0);
        
        const meliDaily = (monthTotalMeli / 4) / 7;
        if (selectedChannel === 'Total') {
          spend = (item.Amazon || 0) + (item.Shopify || 0) + meliDaily;
        } else {
          spend = meliDaily;
        }
      }
      
      combinedMap[dateKey].spend = spend;
    });

    return Object.values(combinedMap).sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
  }, [filteredTimeSeries, filteredAdsSeries, adsTimeSeries, selectedChannel, data, selectedPeriod, selectedWeek, selectedYear]);

  const dynamicChannelMix = React.useMemo(() => {
    if (!data) return channelMix;
    const channels = ['Amazon', 'Meli', 'Shopify'];
    
    const totals = channels.map(c => {
      let amount = 0;
      if (selectedPeriod === 'Weekly' && c === 'Meli') {
        const weekStart = dayjs().year(selectedYear).week(selectedWeek).startOf('week');
        const monthStart = weekStart.startOf('month');
        const monthEnd = weekStart.endOf('month');
        const monthTotalMeli = adsTimeSeries.reduce((sum: number, item: any) => {
          const d = dayjs(item.date);
          if (d.isSameOrAfter(monthStart, 'day') && d.isSameOrBefore(monthEnd, 'day')) return sum + (item.Meli || 0);
          return sum;
        }, 0);
        amount = monthTotalMeli / 4;
      } else {
        amount = filteredAdsSeries.reduce((sum, item) => sum + (item[c] || 0), 0);
      }

      return {
        name: c,
        amount,
        icon: c === 'Amazon' ? ShoppingBag : c === 'Meli' ? ShoppingCart : Store
      };
    });

    const grandTotal = totals.reduce((sum, c) => sum + c.amount, 0);
    return totals.map(c => ({
      ...c,
      percentage: grandTotal > 0 ? Math.round((c.amount / grandTotal) * 100) : 0
    })).filter(c => c.amount > 0);
  }, [filteredAdsSeries, adsTimeSeries, data, selectedPeriod, selectedWeek, selectedYear]);

  return (
    <div className="pb-12 px-6 max-w-screen-2xl mx-auto space-y-10 pt-16">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">Publicidad y Rendimiento</h1>
          <p className="text-on-surface-variant mt-1">Inversión publicitaria por Marketplace y Canal</p>
        </div>
        <FilterControls 
          selectedChannel={selectedChannel} setSelectedChannel={setSelectedChannel}
          selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod}
          selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek}
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear} setSelectedYear={setSelectedYear}
        />
      </div>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'ROAS Total', value: roas, suffix: 'x', change: '+12.4%', trend: 'up', target: 'Meta: 4.50x' },
          { label: 'ACOS Total', value: acos, suffix: '%', change: '-2.1%', trend: 'down', target: 'Umbral: 25%' },
          { label: 'Inversión Total', value: `$${(currentSpend).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, suffix: '', change: '', trend: 'up', target: 'Presupuesto Utilizado' },
          { label: 'Ventas Atribuidas', value: `$${(currentSales).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, suffix: '', change: '', trend: 'up', target: 'Ingresos por Ads' },
        ].map((metric) => (
          <div key={metric.label} className="bg-white p-6 rounded-xl border border-outline-variant/15 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider">{metric.label}</span>
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1",
                metric.trend === 'up' ? "bg-primary-container/10 text-primary" : "bg-red-100 text-red-600"
              )}>
                {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {metric.change}
              </span>
            </div>
            <div>
              <h2 className="text-4xl font-extrabold text-on-surface tracking-tighter">
                {metric.value}<span className="text-lg font-medium text-on-surface-variant ml-1">{metric.suffix}</span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-2">{metric.target}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-12 gap-6">
        {/* Ad Spend vs. Revenue Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-xl border border-outline-variant/15">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Ad Spend vs. Revenue</h3>
              <p className="text-sm text-on-surface-variant">Daily growth correlation analysis</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs text-on-surface-variant font-medium">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-xs text-on-surface-variant font-medium">Spend</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#3c4a42' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#94a3b8" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorSpend)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Mix */}
        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-xl border border-outline-variant/15">
          <h3 className="text-xl font-bold text-on-surface mb-1">Channel Mix</h3>
          <p className="text-sm text-on-surface-variant mb-8">Allocation by platform</p>
          <div className="space-y-8">
            {dynamicChannelMix.map((channel: any) => (
              <div key={channel.name}>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <channel.icon className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-sm">{channel.name}</span>
                  </div>
                  <span className="text-sm font-bold">${(channel.amount / 1000).toFixed(1)}k</span>
                </div>
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container" style={{ width: `${channel.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
