import React from 'react';
import {
  BarChart3,
  CreditCard,
  DollarSign,
  Eye,
  MousePointerClick,
  PackageCheck,
  ShoppingCart,
  Users,
} from 'lucide-react';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import FilterControls from './FilterControls';
import { cn } from '@/src/lib/utils';

dayjs.extend(weekOfYear);

const fallbackCurrency = (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fallbackNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

const stageIcons = {
  sessions: Users,
  productViews: Eye,
  addToCart: ShoppingCart,
  checkoutStarted: CreditCard,
  orders: PackageCheck,
  sales: DollarSign,
};

export default function Funnel({
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
  const inSelectedPeriod = React.useCallback((dateValue: string) => {
    const itemDate = dayjs(dateValue);
    if (!itemDate.isValid()) return false;

    switch (selectedPeriod) {
      case 'Weekly':
        return itemDate.year() === selectedYear && itemDate.week() === selectedWeek;
      case 'Monthly':
        return itemDate.year() === selectedYear && itemDate.month() === selectedMonth;
      case 'Year to Date':
        return itemDate.year() === selectedYear;
      case 'Last Year':
        return itemDate.year() === selectedYear - 1;
      default:
        return true;
    }
  }, [selectedPeriod, selectedWeek, selectedMonth, selectedYear]);

  const filteredTransactions = React.useMemo(() => {
    const transactions = data?.transactions || [];
    return transactions.filter((tx: any) => {
      if (!inSelectedPeriod(tx.date)) return false;
      return selectedChannel === 'Total' || tx.channel === selectedChannel;
    });
  }, [data?.transactions, inSelectedPeriod, selectedChannel]);

  const filteredTimeSeries = React.useMemo(() => {
    const timeSeries = data?.timeSeries || [];
    return timeSeries.filter((item: any) => inSelectedPeriod(item.date));
  }, [data?.timeSeries, inSelectedPeriod]);

  const filteredAdsSeries = React.useMemo(() => {
    const adsSeries = data?.adsTimeSeries || [];
    return adsSeries.filter((item: any) => inSelectedPeriod(item.date));
  }, [data?.adsTimeSeries, inSelectedPeriod]);

  const funnel = React.useMemo(() => {
    const sourceRows = data?.funnel || [];
    const filteredFunnel = sourceRows.filter((row: any) => {
      if (!inSelectedPeriod(row.date)) return false;
      return selectedChannel === 'Total' || row.channel === selectedChannel || row.channel === 'Total';
    });

    const actualSalesFromTransactions = filteredTransactions.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
    const actualSalesFromSeries = filteredTimeSeries.reduce((sum: number, item: any) => sum + (item[selectedChannel] || 0), 0);
    const actualSales = actualSalesFromTransactions || actualSalesFromSeries;
    const orderKeys = new Set(filteredTransactions.map((tx: any, index: number) => tx.id || `${tx.date}-${tx.product}-${index}`));
    const actualOrders = orderKeys.size || Math.max(0, Math.round(actualSales / 1200));
    const actualUnits = filteredTransactions.reduce((sum: number, tx: any) => sum + (tx.quantity || 1), 0) || actualOrders;

    const sumRows = (rows: any[]) => rows.reduce((acc, row) => ({
      sessions: acc.sessions + (row.sessions || 0),
      productViews: acc.productViews + (row.productViews || 0),
      addToCart: acc.addToCart + (row.addToCart || 0),
      checkoutStarted: acc.checkoutStarted + (row.checkoutStarted || 0),
      orders: acc.orders + (row.orders || 0),
      units: acc.units + (row.units || 0),
      sales: acc.sales + (row.sales || 0),
    }), { sessions: 0, productViews: 0, addToCart: 0, checkoutStarted: 0, orders: 0, units: 0, sales: 0 });

    if (filteredFunnel.length > 0) {
      const source = sumRows(filteredFunnel);
      const orders = source.orders || actualOrders;
      const units = source.units || actualUnits;
      const sales = source.sales || actualSales;

      return {
        ...source,
        addToCart: source.addToCart || Math.round(orders * 2.2),
        checkoutStarted: source.checkoutStarted || Math.round(orders * 1.35),
        orders,
        units,
        sales,
        isEstimated: false,
      };
    }

    return {
      sessions: Math.round(actualOrders * 12),
      productViews: Math.round(actualOrders * 8),
      addToCart: Math.round(actualOrders * 2.2),
      checkoutStarted: Math.round(actualOrders * 1.35),
      orders: actualOrders,
      units: actualUnits,
      sales: actualSales,
      isEstimated: true,
    };
  }, [data?.funnel, filteredTransactions, filteredTimeSeries, inSelectedPeriod, selectedChannel]);

  const adSpend = React.useMemo(() => {
    return filteredAdsSeries.reduce((sum: number, item: any) => {
      if (selectedChannel === 'Total') return sum + (item.Total || item.Amazon || 0) + (item.Total ? 0 : (item.Meli || 0) + (item.Shopify || 0));
      return sum + (item[selectedChannel] || 0);
    }, 0);
  }, [filteredAdsSeries, selectedChannel]);

  const stages = [
    { key: 'sessions', label: 'Sessions', value: funnel.sessions, format: fallbackNumber },
    { key: 'productViews', label: 'Product Views', value: funnel.productViews, format: fallbackNumber },
    { key: 'addToCart', label: 'Add to Cart', value: funnel.addToCart, format: fallbackNumber },
    { key: 'checkoutStarted', label: 'Checkout', value: funnel.checkoutStarted, format: fallbackNumber },
    { key: 'orders', label: 'Orders', value: funnel.orders, format: fallbackNumber },
    { key: 'sales', label: 'Sales', value: funnel.sales, format: fallbackCurrency },
  ];

  const firstValue = Math.max(stages[0].value || 1, 1);
  const conversionRate = funnel.sessions > 0 ? (funnel.orders / funnel.sessions) * 100 : 0;
  const averageOrderValue = funnel.orders > 0 ? funnel.sales / funnel.orders : 0;
  const cartToOrder = funnel.addToCart > 0 ? (funnel.orders / funnel.addToCart) * 100 : 0;
  const roas = adSpend > 0 ? funnel.sales / adSpend : 0;

  return (
    <div className="pb-12 px-6 max-w-screen-2xl mx-auto space-y-10 pt-16">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div>
          <p className="text-on-surface-variant font-medium text-sm">Conversion Overview</p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">Sales Funnel</h1>
        </div>
        <FilterControls
          selectedChannel={selectedChannel} setSelectedChannel={setSelectedChannel}
          selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod}
          selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek}
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear} setSelectedYear={setSelectedYear}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, icon: BarChart3 },
          { label: 'Cart to Order', value: `${cartToOrder.toFixed(1)}%`, icon: MousePointerClick },
          { label: 'Average Order', value: fallbackCurrency(averageOrderValue), icon: CreditCard },
          { label: 'ROAS', value: `${roas.toFixed(2)}x`, icon: DollarSign },
        ].map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{card.label}</p>
              <card.icon className="w-5 h-5 text-primary-container" />
            </div>
            <p className="text-2xl font-extrabold text-on-surface">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-outline-variant/10">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Funnel Stages</h2>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mt-1">
              {funnel.isEstimated ? 'Estimated baseline' : 'Google Sheets data'}
            </p>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
            funnel.isEstimated ? "bg-yellow-100 text-yellow-700" : "bg-primary-container/10 text-primary-container"
          )}>
            {selectedChannel}
          </div>
        </div>

        <div className="space-y-5">
          {stages.map((stage, index) => {
            const Icon = stageIcons[stage.key as keyof typeof stageIcons];
            const previous = index === 0 ? stage.value : stages[index - 1].value;
            const stepRate = index === 0 || previous === 0 ? 100 : (stage.value / previous) * 100;
            const width = Math.max(8, Math.min(100, (stage.value / firstValue) * 100));

            return (
              <div key={stage.key} className="grid grid-cols-1 lg:grid-cols-[180px_1fr_120px] gap-3 lg:gap-6 items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{stage.label}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {index === 0 ? 'Entry' : `${stepRate.toFixed(1)}% step`}
                    </p>
                  </div>
                </div>

                <div className="h-11 bg-surface-container-low rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-primary-container transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>

                <p className="text-right text-sm font-extrabold text-on-surface">{stage.format(stage.value)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Orders</p>
          <p className="text-3xl font-extrabold">{fallbackNumber(funnel.orders)}</p>
          <p className="text-sm text-on-surface-variant mt-4">{fallbackNumber(funnel.units)} units sold</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Revenue</p>
          <p className="text-3xl font-extrabold">{fallbackCurrency(funnel.sales)}</p>
          <p className="text-sm text-on-surface-variant mt-4">{fallbackCurrency(adSpend)} ad spend</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">Leakage</p>
          <p className="text-3xl font-extrabold">{Math.max(0, funnel.sessions - funnel.orders).toLocaleString()}</p>
          <p className="text-sm text-on-surface-variant mt-4">sessions not converted</p>
        </div>
      </div>
    </div>
  );
}
