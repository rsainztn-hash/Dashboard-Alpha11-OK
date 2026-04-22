import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  Watch, 
  Smartphone, 
  Tablet, 
  Camera, 
  Headphones,
  ArrowUp,
  ArrowDown
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
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import FilterControls from './FilterControls';

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(weekOfYear);

const salesData = [
  { name: 'Jan', current: 4000, target: 4500 },
  { name: 'Feb', current: 3000, target: 4200 },
  { name: 'Mar', current: 5000, target: 4800 },
  { name: 'Apr', current: 4500, target: 4600 },
  { name: 'May', current: 6000, target: 5500 },
  { name: 'Jun', current: 5500, target: 5800 },
  { name: 'Jul', current: 7000, target: 6500 },
  { name: 'Aug', current: 6500, target: 6800 },
  { name: 'Sep', current: 8000, target: 7500 },
  { name: 'Oct', current: 7500, target: 7800 },
  { name: 'Nov', current: 9000, target: 8500 },
  { name: 'Dec', current: 8500, target: 8800 },
];

const topProducts = [
  { id: 1, name: 'Alpha-7 Smartwatch', category: 'Electronics', icon: Watch, percentage: 35 },
  { id: 2, name: 'Nexus Pro Black', category: 'Mobile', icon: Smartphone, percentage: 25 },
  { id: 3, name: 'Slate Mini 8', category: 'Tablets', icon: Tablet, percentage: 15 },
  { id: 4, name: 'Zenith Camera', category: 'Photography', icon: Camera, percentage: 10 },
  { id: 5, name: 'Acoustic Pro', category: 'Audio', icon: Headphones, percentage: 8 },
];

const unitEconomics = [
  { name: 'Alpha-7 Smartwatch', icon: Watch, cost: 142.50, fees: 45.20, shipping: 12.00, ads: 28.50, pl: 62.30, return: 15.5 },
  { name: 'Nexus Pro Black', icon: Smartphone, cost: 410.00, fees: 112.50, shipping: 15.00, ads: 84.00, pl: 178.50, return: 22.1 },
  { name: 'Slate Mini 8', icon: Tablet, cost: 225.00, fees: 67.50, shipping: 11.50, ads: 42.00, pl: 104.00, return: 18.4 },
  { name: 'Zenith Camera', icon: Camera, cost: 680.00, fees: 185.00, shipping: 22.00, ads: 145.00, pl: -52.00, return: -4.2 },
  { name: 'Acoustic Pro', icon: Headphones, cost: 88.00, fees: 24.50, shipping: 8.50, ads: 31.00, pl: 47.00, return: 12.8 },
];

const stockManagement = [
  { name: 'Alpha-7 Smartwatch', icon: Watch, stock: 1240, status: 'OK', doh: '42 Days' },
  { name: 'Nexus Pro Black', icon: Smartphone, stock: 12, status: 'Send', doh: '2 Days' },
  { name: 'Slate Mini 8', icon: Tablet, stock: 185, status: 'Low', doh: '11 Days' },
  { name: 'Zenith Camera', icon: Camera, stock: 842, status: 'OK', doh: '35 Days' },
  { name: 'Acoustic Pro', icon: Headphones, stock: 510, status: 'OK', doh: '28 Days' },
];

const initialProducts = [
  { name: 'Maleta Gen1', cost: 220, fees: 89.85, shipping: 100, price: 599, pl: 189.15, return: 31.6, icon: Watch },
  { name: 'Journey Gen2', cost: 650, fees: 254.85, shipping: 100, price: 1699, pl: 694.15, return: 40.9, icon: Watch },
  { name: 'Balance Gen2', cost: 641, fees: 239.85, shipping: 100, price: 1599, pl: 618.15, return: 38.7, icon: Watch },
  { name: 'Bandas Resist', cost: 150, fees: 52.35, shipping: 100, price: 349, pl: 46.65, return: 13.4, icon: Watch },
  { name: 'Strap Gen1', cost: 100, fees: 59.85, shipping: 100, price: 399, pl: 139.15, return: 34.9, icon: Watch },
  { name: 'Serenity Gen2', cost: 650, fees: 239.85, shipping: 100, price: 1599, pl: 609.15, return: 38.1, icon: Watch },
  { name: 'Thermo Gen1', cost: 175, fees: 89.85, shipping: 100, price: 599, pl: 234.15, return: 39.1, icon: Watch },
  { name: 'Bloques Gen1', cost: 100, fees: 44.85, shipping: 100, price: 299, pl: 54.15, return: 18.1, icon: Watch },
];

export default function Home({ 
  data, 
  isLoading,
  selectedChannel, setSelectedChannel,
  selectedPeriod, setSelectedPeriod,
  selectedWeek, setSelectedWeek,
  selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear
}: { 
  data?: any,
  isLoading?: boolean,
  selectedChannel: string, setSelectedChannel: (c: string) => void,
  selectedPeriod: string, setSelectedPeriod: (p: string) => void,
  selectedWeek: number, setSelectedWeek: (w: number) => void,
  selectedMonth: number, setSelectedMonth: (m: number) => void,
  selectedYear: number, setSelectedYear: (y: number) => void
}) {
  const timeSeries = data?.timeSeries || [];
  const adsTimeSeries = data?.adsTimeSeries || [];

  // Filter timeSeries based on selectedPeriod
  const filteredTimeSeries = React.useMemo(() => {
    if (timeSeries.length === 0) return [];

    return timeSeries.filter((item: any) => {
      const itemDate = dayjs(item.date);
      
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

  const filteredTransactions = React.useMemo(() => {
    const transactions = (data as any)?.transactions || [];
    if (transactions.length === 0) return [];

    return transactions.filter((item: any) => {
      const itemDate = dayjs(item.date);
      let inPeriod = false;
      
      switch (selectedPeriod) {
        case 'Weekly':
          inPeriod = itemDate.year() === selectedYear && itemDate.week() === selectedWeek;
          break;
        case 'Monthly':
          inPeriod = itemDate.year() === selectedYear && itemDate.month() === selectedMonth;
          break;
        case 'Year to Date':
          inPeriod = itemDate.year() === selectedYear;
          break;
        case 'Last Year':
          inPeriod = itemDate.year() === selectedYear - 1;
          break;
        default:
          inPeriod = true;
      }

      if (!inPeriod) return false;
      if (selectedChannel !== 'Total' && item.channel !== selectedChannel) return false;
      
      return true;
    });
  }, [data, selectedPeriod, selectedWeek, selectedMonth, selectedYear, selectedChannel]);

  const filteredAdsTransactions = React.useMemo(() => {
    const ads = (data as any)?.adsTransactions || [];
    if (ads.length === 0) return [];
    return ads.filter((item: any) => {
      const itemDate = dayjs(item.date);
      let inPeriod = false;
      switch (selectedPeriod) {
        case 'Weekly': inPeriod = itemDate.year() === selectedYear && itemDate.week() === selectedWeek; break;
        case 'Monthly': inPeriod = itemDate.year() === selectedYear && itemDate.month() === selectedMonth; break;
        case 'Year to Date': inPeriod = itemDate.year() === selectedYear; break;
        case 'Last Year': inPeriod = itemDate.year() === selectedYear - 1; break;
        default: inPeriod = true;
      }
      return inPeriod;
    });
  }, [data, selectedPeriod, selectedWeek, selectedMonth, selectedYear]);

  const displayProducts = React.useMemo(() => {
    const baseProducts = data?.products || initialProducts;
    if (!data) return baseProducts;

    const getMode = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const counts: Record<number, number> = {};
      let maxCount = 0;
      let mode = arr[0];
      arr.forEach(val => {
        const v = Math.round(Math.abs(val) * 100) / 100;
        if (v === 0) return;
        counts[v] = (counts[v] || 0) + 1;
        if (counts[v] > maxCount) {
          maxCount = counts[v];
          mode = v;
        }
      });
      return mode;
    };

    return baseProducts.map((p: any) => {
      const pTxs = filteredTransactions.filter((tx: any) => tx.product === p.name);
      
      // If no transactions in this filter, skip it
      if (pTxs.length === 0) {
        return null;
      }

      const price = getMode(pTxs.map((tx: any) => tx.unitPrice)) || p.price;
      const fees = getMode(pTxs.map((tx: any) => tx.marketplaceFee / (tx.quantity || 1)));
      const shipping = getMode(pTxs.map((tx: any) => tx.shippingCost / (tx.quantity || 1)));
      
      // Ads calculation per channel
      const channels = ['Amazon', 'Meli', 'Shopify'];
      let totalAdsForProduct = 0;

      channels.forEach(channel => {
        // If we are filtering by a specific channel, only consider that one
        if (selectedChannel !== 'Total' && selectedChannel !== channel) return;

        if (channel === 'Amazon') {
          // Exact matching for Amazon if SKU is available
          if (p.skuAmazon) {
            const exactAds = filteredAdsTransactions
              .filter((ad: any) => ad.channel === 'Amazon' && ad.sku === p.skuAmazon)
              .reduce((sum: number, ad: any) => sum + ad.amount, 0);
            totalAdsForProduct += exactAds;
          } else {
            // Proportional fallback for Amazon if no SKU
            const channelAds = filteredAdsSeries.reduce((acc: number, item: any) => acc + (item.Amazon || 0), 0);
            const channelTxs = (data as any).transactions.filter((tx: any) => {
              const itemDate = dayjs(tx.date);
              let inPeriod = false;
              switch (selectedPeriod) {
                case 'Weekly': inPeriod = itemDate.year() === selectedYear && itemDate.week() === selectedWeek; break;
                case 'Monthly': inPeriod = itemDate.year() === selectedYear && itemDate.month() === selectedMonth; break;
                case 'Year to Date': inPeriod = itemDate.year() === selectedYear; break;
                case 'Last Year': inPeriod = itemDate.year() === selectedYear - 1; break;
                default: inPeriod = true;
              }
              return inPeriod && tx.channel === 'Amazon';
            });
            const channelSalesTotal = channelTxs.reduce((acc: number, tx: any) => acc + tx.amount, 0);
            const productChannelSales = pTxs.filter((tx: any) => tx.channel === 'Amazon').reduce((acc: number, tx: any) => acc + tx.amount, 0);
            if (channelSalesTotal > 0) {
              totalAdsForProduct += channelAds * (productChannelSales / channelSalesTotal);
            }
          }
        } else {
          // Proportional for Meli and Shopify
          const channelAds = filteredAdsSeries.reduce((acc: number, item: any) => acc + (item[channel] || 0), 0);
          const channelTxs = (data as any).transactions.filter((tx: any) => {
            const itemDate = dayjs(tx.date);
            let inPeriod = false;
            switch (selectedPeriod) {
              case 'Weekly': inPeriod = itemDate.year() === selectedYear && itemDate.week() === selectedWeek; break;
              case 'Monthly': inPeriod = itemDate.year() === selectedYear && itemDate.month() === selectedMonth; break;
              case 'Year to Date': inPeriod = itemDate.year() === selectedYear; break;
              case 'Last Year': inPeriod = itemDate.year() === selectedYear - 1; break;
              default: inPeriod = true;
            }
            return inPeriod && tx.channel === channel;
          });
          const channelSalesTotal = channelTxs.reduce((acc: number, tx: any) => acc + tx.amount, 0);
          const productChannelSales = pTxs.filter((tx: any) => tx.channel === channel).reduce((acc: number, tx: any) => acc + tx.amount, 0);
          
          if (channelSalesTotal > 0) {
            totalAdsForProduct += channelAds * (productChannelSales / channelSalesTotal);
          }
        }
      });

      const productUnitsTotal = pTxs.reduce((acc: number, tx: any) => acc + (tx.quantity || 1), 0);
      const unitAds = productUnitsTotal > 0 ? totalAdsForProduct / productUnitsTotal : 0;

      const pl = price - p.cost - fees - shipping - unitAds;
      const ret = price > 0 ? (pl / price) * 100 : 0;

      return {
        ...p,
        price,
        fees,
        shipping,
        ads: unitAds,
        pl,
        return: ret.toFixed(1)
      };
    }).filter((p: any) => p !== null)
    .sort((a: any, b: any) => b.price - a.price);
  }, [data, filteredTransactions, filteredAdsSeries, filteredAdsTransactions, selectedChannel, initialProducts, selectedPeriod, selectedWeek, selectedMonth, selectedYear]);

  // Calculate metrics based on filtered data
  const currentSales = React.useMemo(() => {
    if (!data) {
      const rawMetrics = {
        totalSales: 842590,
        Amazon: 450000,
        Meli: 250000,
        Shopify: 100000,
        Direct: 42590,
      };
      return selectedChannel === 'Total' ? rawMetrics.totalSales : ((rawMetrics as any)[selectedChannel] || 0);
    }
    return filteredTimeSeries.reduce((sum, item) => sum + (item[selectedChannel] || 0), 0);
  }, [filteredTimeSeries, selectedChannel, data]);

  const previousSales = React.useMemo(() => {
    if (!data) return 750000;
    
    const timeSeries = (data as any).timeSeries || [];
    return timeSeries.filter((item: any) => {
      const itemDate = dayjs(item.date);
      switch (selectedPeriod) {
        case 'Weekly': {
          const prevWeek = selectedWeek === 1 ? 52 : selectedWeek - 1;
          const prevYear = selectedWeek === 1 ? selectedYear - 1 : selectedYear;
          return itemDate.year() === prevYear && itemDate.week() === prevWeek;
        }
        case 'Monthly': {
          const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
          const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
          return itemDate.year() === prevYear && itemDate.month() === prevMonth;
        }
        case 'Year to Date': return itemDate.year() === selectedYear - 1;
        case 'Last Year': return itemDate.year() === selectedYear - 2;
        default: return false;
      }
    }).reduce((sum: number, item: any) => sum + (item[selectedChannel] || 0), 0);
  }, [data, selectedPeriod, selectedWeek, selectedMonth, selectedYear, selectedChannel]);

  const salesGrowth = React.useMemo(() => {
    if (previousSales === 0) return currentSales > 0 ? 100 : 0;
    return ((currentSales - previousSales) / previousSales) * 100;
  }, [currentSales, previousSales]);

  const currentSpend = React.useMemo(() => {
    if (!data) return 45200;
    
    if (selectedPeriod === 'Weekly') {
      const otherSpend = filteredAdsSeries.reduce((sum, item) => {
        if (selectedChannel === 'Total') {
          return sum + (item.Amazon || 0) + (item.Shopify || 0);
        }
        return selectedChannel !== 'Meli' ? sum + (item[selectedChannel] || 0) : sum;
      }, 0);

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

  const roas = currentSpend > 0 ? (currentSales / currentSpend).toFixed(1) : '0.0';
  const acos = currentSales > 0 ? ((currentSpend / currentSales) * 100).toFixed(1) : '0.0';

  const previousSpend = React.useMemo(() => {
    if (!data) return 40000;
    
    const adsTimeSeries = (data as any).adsTimeSeries || [];
    return adsTimeSeries.filter((item: any) => {
      const itemDate = dayjs(item.date);
      switch (selectedPeriod) {
        case 'Weekly': {
          const prevWeek = selectedWeek === 1 ? 52 : selectedWeek - 1;
          const prevYear = selectedWeek === 1 ? selectedYear - 1 : selectedYear;
          return itemDate.year() === prevYear && itemDate.week() === prevWeek;
        }
        case 'Monthly': {
          const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
          const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
          return itemDate.year() === prevYear && itemDate.month() === prevMonth;
        }
        case 'Year to Date': return itemDate.year() === selectedYear - 1;
        case 'Last Year': return itemDate.year() === selectedYear - 2;
        default: return false;
      }
    }).reduce((sum: number, item: any) => sum + (item[selectedChannel] || 0), 0);
  }, [data, selectedPeriod, selectedWeek, selectedMonth, selectedYear, selectedChannel]);

  const spendGrowth = React.useMemo(() => {
    if (previousSpend === 0) return currentSpend > 0 ? 100 : 0;
    return ((currentSpend - previousSpend) / previousSpend) * 100;
  }, [currentSpend, previousSpend]);

  const previousCosts = React.useMemo(() => {
    if (!data) {
      const salesRatio = selectedChannel === 'Total' ? 1 : (selectedChannel === 'Amazon' ? 0.53 : (selectedChannel === 'Meli' ? 0.3 : (selectedChannel === 'Shopify' ? 0.12 : 0.05)));
      return { 
        productCost: 250000 * salesRatio, 
        marketplaceFee: 110000 * salesRatio, 
        shippingCost: 65000 * salesRatio 
      };
    }
    
    const timeSeries = (data as any).timeSeries || [];
    return timeSeries.filter((item: any) => {
      const itemDate = dayjs(item.date);
      switch (selectedPeriod) {
        case 'Weekly': {
          const prevWeek = selectedWeek === 1 ? 52 : selectedWeek - 1;
          const prevYear = selectedWeek === 1 ? selectedYear - 1 : selectedYear;
          return itemDate.year() === prevYear && itemDate.week() === prevWeek;
        }
        case 'Monthly': {
          const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
          const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
          return itemDate.year() === prevYear && itemDate.month() === prevMonth;
        }
        case 'Year to Date': return itemDate.year() === selectedYear - 1;
        case 'Last Year': return itemDate.year() === selectedYear - 2;
        default: return false;
      }
    }).reduce((acc: any, item: any) => {
      if (selectedChannel === 'Total') {
        acc.productCost += (item.productCost || 0);
        acc.marketplaceFee += (item.marketplaceFee || 0);
        acc.shippingCost += (item.shippingCost || 0);
      } else {
        acc.productCost += (item[`${selectedChannel}_productCost`] || 0);
        acc.marketplaceFee += (item[`${selectedChannel}_marketplaceFee`] || 0);
        acc.shippingCost += (item[`${selectedChannel}_shippingCost`] || 0);
      }
      return acc;
    }, { productCost: 0, marketplaceFee: 0, shippingCost: 0 });
  }, [data, selectedPeriod, selectedWeek, selectedMonth, selectedYear, selectedChannel]);

  const currentCosts = React.useMemo(() => {
    if (!data) {
      const salesRatio = selectedChannel === 'Total' ? 1 : (selectedChannel === 'Amazon' ? 0.53 : (selectedChannel === 'Meli' ? 0.3 : (selectedChannel === 'Shopify' ? 0.12 : 0.05)));
      return {
        productCost: 284400 * salesRatio,
        marketplaceFee: 126380 * salesRatio,
        shippingCost: 73760 * salesRatio
      };
    }
    
    return filteredTimeSeries.reduce((acc, item) => {
      if (selectedChannel === 'Total') {
        acc.productCost += (item.productCost || 0);
        acc.marketplaceFee += (item.marketplaceFee || 0);
        acc.shippingCost += (item.shippingCost || 0);
      } else {
        acc.productCost += (item[`${selectedChannel}_productCost`] || 0);
        acc.marketplaceFee += (item[`${selectedChannel}_marketplaceFee`] || 0);
        acc.shippingCost += (item[`${selectedChannel}_shippingCost`] || 0);
      }
      return acc;
    }, { productCost: 0, marketplaceFee: 0, shippingCost: 0 });
  }, [filteredTimeSeries, selectedChannel, data]);

  const financialResult = currentSales - currentCosts.productCost - currentCosts.marketplaceFee - currentCosts.shippingCost - currentSpend;
  const totalCosts = currentCosts.productCost + currentCosts.marketplaceFee + currentCosts.shippingCost + currentSpend;
  const netMargin = currentSales > 0 ? ((financialResult / currentSales) * 100).toFixed(1) : '0.0';

  const previousFinancialResult = previousSales - previousCosts.productCost - previousCosts.marketplaceFee - previousCosts.shippingCost - previousSpend;
  const financialGrowth = React.useMemo(() => {
    if (Math.abs(previousFinancialResult) < 0.01) return financialResult > 0 ? 100 : 0;
    return ((financialResult - previousFinancialResult) / Math.abs(previousFinancialResult)) * 100;
  }, [financialResult, previousFinancialResult]);

  // Chart Data
  const chartData = React.useMemo(() => {
    if (!data) return salesData;

    const intervals = [];
    if (selectedPeriod === 'Weekly') {
      // Last 12 weeks ending at selectedWeek/selectedYear
      let current = dayjs().year(selectedYear).week(selectedWeek).endOf('week');
      for (let i = 0; i < 12; i++) {
        const start = current.startOf('week');
        const end = current.endOf('week');
        const label = `Sem ${current.week()}`;
        
        const sum = timeSeries.reduce((acc: number, item: any) => {
          const d = dayjs(item.date);
          if (d.isSameOrAfter(start, 'day') && d.isSameOrBefore(end, 'day')) {
            return acc + (item[selectedChannel] || 0);
          }
          return acc;
        }, 0);

        intervals.unshift({ 
          name: label, 
          current: sum, 
          target: sum * 1.1,
          fullDate: current.format('DD/MM/YYYY')
        });
        current = current.subtract(1, 'week');
      }
    } else {
      // Monthly, YTD, Last Year -> Last 12 months
      let endMonth;
      if (selectedPeriod === 'Monthly') {
        endMonth = dayjs().year(selectedYear).month(selectedMonth).endOf('month');
      } else if (selectedPeriod === 'Last Year') {
        endMonth = dayjs().year(selectedYear - 1).month(11).endOf('month');
      } else {
        // YTD or default
        endMonth = dayjs().endOf('month');
      }

      let current = endMonth;
      for (let i = 0; i < 12; i++) {
        const start = current.startOf('month');
        const end = current.endOf('month');
        const label = current.format('MMM YY');

        const sum = timeSeries.reduce((acc: number, item: any) => {
          const d = dayjs(item.date);
          if (d.isSameOrAfter(start, 'day') && d.isSameOrBefore(end, 'day')) {
            return acc + (item[selectedChannel] || 0);
          }
          return acc;
        }, 0);

        intervals.unshift({ 
          name: label, 
          current: sum, 
          target: sum * 1.1,
          fullDate: current.format('MMMM YYYY')
        });
        current = current.subtract(1, 'month');
      }
    }

    return intervals;
  }, [timeSeries, selectedPeriod, selectedWeek, selectedMonth, selectedYear, selectedChannel, data]);

  const [showAllProducts, setShowAllProducts] = React.useState(false);

  // Filter Top Products based on channel and period
  const allProductsSorted = React.useMemo(() => {
    if (!data) return topProducts.map(p => ({ ...p, amount: (p.percentage / 100) * currentSales }));

    const productMap: Record<string, { name: string, amount: number }> = {};
    
    filteredTransactions.forEach((tx: any) => {
      const name = tx.product || "Producto Desconocido";
      if (!productMap[name]) {
        productMap[name] = { name, amount: 0 };
      }
      productMap[name].amount += tx.amount;
    });

    return Object.values(productMap)
      .sort((a, b) => b.amount - a.amount)
      .map((p: any) => ({
        id: p.name,
        name: p.name,
        category: 'Product',
        amount: p.amount,
        percentage: currentSales > 0 ? Math.round((p.amount / currentSales) * 100) : 0,
        icon: Watch
      }));
  }, [data, filteredTransactions, currentSales]);

  const finalTopProducts = allProductsSorted.slice(0, 5);

  const displayInsights = React.useMemo(() => {
    const topProduct = finalTopProducts[0];
    const growthDirection = salesGrowth >= 0 ? 'por encima' : 'por debajo';
    const growthColor = salesGrowth >= 0 ? 'border-primary-container' : 'border-red-500';
    const efficiencyColor = Number(roas) >= 3 && Number(acos) <= 20 ? 'border-primary-container' : 'border-amber-500';
    const marginColor = Number(netMargin) >= 15 ? 'border-primary-container' : 'border-red-500';

    return [
      {
        title: 'Sales Growth',
        color: growthColor,
        text: `Las ventas de ${selectedChannel} están ${Math.abs(salesGrowth).toFixed(1)}% ${growthDirection} del periodo anterior.`
      },
      {
        title: 'Ad Efficiency',
        color: efficiencyColor,
        text: currentSpend > 0
          ? `El ROAS está en ${roas}x y el ACOS en ${acos}%, ${Number(roas) >= 3 ? 'con eficiencia saludable' : 'con oportunidad de optimizar inversión publicitaria'}.`
          : 'No hay inversión publicitaria registrada para este periodo.'
      },
      {
        title: 'Inventory Alert',
        color: marginColor,
        text: topProduct
          ? `Prioriza disponibilidad de ${topProduct.name}, que concentra ${topProduct.percentage}% de las ventas del periodo. Margen neto actual: ${netMargin}%.`
          : `Revisa disponibilidad de los productos de mayor rotación. Margen neto actual: ${netMargin}%.`
      },
    ];
  }, [finalTopProducts, salesGrowth, selectedChannel, currentSpend, roas, acos, netMargin]);

  const displayStockManagement = React.useMemo(() => {
    const stockChannel = ['Amazon', 'Meli', 'Shopify'].includes(selectedChannel) ? selectedChannel : 'Total';
    const baseStock = data?.stock || stockManagement;

    return baseStock.map((item: any) => {
      const stock = item.stockByChannel?.[stockChannel] ?? item.stock ?? 0;
      const recentSales = item.recentSalesByChannel?.[stockChannel] ?? item.recentSales ?? 0;
      const dailyVelocity = recentSales / 30;
      const dohValue = dailyVelocity > 0 ? stock / dailyVelocity : (stock > 0 ? 999 : 0);

      return {
        ...item,
        stock,
        recentSales,
        status: dohValue < 20 ? 'Risk' : (dohValue <= 60 ? 'Low' : 'OK'),
        doh: dohValue === 999 ? '99+ Days' : `${Math.round(dohValue)} Days`,
      };
    });
  }, [data?.stock, selectedChannel]);

  return (
    <div className="pb-12 px-6 max-w-screen-2xl mx-auto space-y-10 pt-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div>
          <p className="text-on-surface-variant font-medium text-sm">Performance Overview</p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">Financial Snapshot</h1>
        </div>
        <FilterControls 
          selectedChannel={selectedChannel} setSelectedChannel={setSelectedChannel}
          selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod}
          selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek}
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear} setSelectedYear={setSelectedYear}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Total Sales */}
        <div className="bg-white p-10 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant text-sm font-medium">{selectedChannel} Sales</span>
              <span className={cn(
                "px-3 py-1 rounded text-[10px] font-bold",
                salesGrowth >= 0 ? "bg-primary-container/10 text-primary-container" : "bg-red-100 text-red-600"
              )}>
                {salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}%
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-3xl font-bold tracking-tight">${currentSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>
          <div className="mt-auto">
            <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden">
              <div className="bg-primary-container h-full w-[78%]"></div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-4 font-medium uppercase tracking-wider">78% OF {selectedPeriod.toUpperCase()} TARGET</p>
          </div>
        </div>

        {/* Ads Investment */}
        <div className="bg-white p-10 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border-2 border-primary/5 min-h-[340px]">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant text-sm font-medium">Ads Investment</span>
              <span className={cn(
                "px-3 py-1 rounded text-[10px] font-bold",
                spendGrowth <= 0 ? "bg-primary-container/10 text-primary-container" : "bg-red-100 text-red-600"
              )}>
                {spendGrowth >= 0 ? '+' : ''}{spendGrowth.toFixed(1)}%
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-3xl font-bold tracking-tight">${currentSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex justify-between items-end mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">ROAS</span>
                <span className="text-lg font-extrabold text-primary">{roas}x</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">ACOS</span>
                <span className="text-lg font-extrabold text-on-surface">{acos}%</span>
              </div>
            </div>
            <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden">
              <div className="bg-primary-container h-full w-[45%]"></div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-4 font-medium uppercase tracking-wider">45% BUDGET UTILIZED</p>
          </div>
        </div>

        {/* Financial Result */}
        <div className="bg-white p-10 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant text-sm font-medium">Financial Result</span>
              <span className={cn(
                "px-3 py-1 rounded text-[10px] font-bold",
                financialGrowth >= 0 ? "bg-primary-container/10 text-primary-container" : "bg-red-100 text-red-600"
              )}>
                {financialGrowth >= 0 ? '+' : ''}{financialGrowth.toFixed(1)}%
              </span>
            </div>
            <div className="mt-6">
              <h3 className="text-3xl font-bold tracking-tight">${financialResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>
          <div className="mt-auto pt-12">
            <div className="space-y-4 mb-6">
              <div className="space-y-3">
                {[
                  { label: 'Product Costs', amount: currentCosts.productCost },
                  { label: 'Marketplace Fees', amount: currentCosts.marketplaceFee },
                  { label: 'Shipping & Log.', amount: currentCosts.shippingCost },
                  { label: 'Ads Investment', amount: currentSpend },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-on-surface">
                        ${item.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/70 font-bold bg-surface-container-low px-1.5 py-0.5 rounded">
                        {currentSales > 0 ? ((item.amount / currentSales) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface">Total Cost</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-on-surface">
                      ${totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] text-on-surface font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                      {currentSales > 0 ? ((totalCosts / currentSales) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-dashed border-outline-variant/30">
              <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">{netMargin}% NET MARGIN</p>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary-container fill-primary-container" />
            </div>
            <h2 className="text-xl font-bold">Smart Insights</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayInsights.map((insight) => (
            <div key={insight.title} className={cn("flex gap-4 p-4 rounded-lg bg-surface-container-low/50 border-l-4", insight.color)}>
              <div className="flex-1">
                <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", insight.title.toLowerCase().includes('alert') ? 'text-red-600' : 'text-primary-container')}>{insight.title}</p>
                <p className="text-sm text-on-surface-variant">{insight.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-bold">
              {selectedPeriod === 'Weekly' ? 'Historial Últimas 12 Semanas' : 'Historial Últimos 12 Meses'}
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-container"></span>
                <span className="text-xs font-medium text-on-surface-variant">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500/30"></span>
                <span className="text-xs font-medium text-on-surface-variant">Meta</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
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
                  labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                  formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Ventas']}
                />
                <Area 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#f97316" 
                  strokeWidth={2} 
                  strokeOpacity={0.4}
                  fillOpacity={1} 
                  fill="url(#colorTarget)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorCurrent)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Top 5 Products</h2>
            <button 
              onClick={() => setShowAllProducts(true)}
              className="text-primary font-bold text-xs hover:underline transition-all"
            >
              View All
            </button>
          </div>
          <div className="space-y-6">
            {finalTopProducts.map((product: any) => (
              <div key={product.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-bold text-on-surface truncate">{product.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">{product.category}</p>
                  </div>
                  <span className="text-sm font-extrabold text-on-surface">{product.percentage}%</span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full" style={{ width: `${product.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Products Modal */}
      {showAllProducts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Detalle de Productos</h2>
                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mt-1">Orden descendente por ventas ({selectedChannel})</p>
              </div>
              <button 
                onClick={() => setShowAllProducts(false)}
                className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <TrendingDown className="w-6 h-6 rotate-45 text-on-surface-variant" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {allProductsSorted.map((product: any, index: number) => (
                <div key={product.id} className="flex items-center gap-4 group">
                  <div className="text-xs font-bold text-on-surface-variant w-6">{index + 1}.</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-sm font-bold text-on-surface truncate pr-4">{product.name}</p>
                      <span className="text-sm font-extrabold text-primary shrink-0">${product.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary-container h-full transition-all duration-500" style={{ width: `${product.percentage}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant w-8 text-right">{product.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-end">
              <button 
                onClick={() => setShowAllProducts(false)}
                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Economics Table */}
      <div className="bg-white p-10 rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-xl font-bold mb-8">Unit Economics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/15 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                <th className="pb-6 pr-4">Product</th>
                <th className="pb-6 px-4 text-center">Price</th>
                <th className="pb-6 px-4 text-center">Cost</th>
                <th className="pb-6 px-4 text-center">Marketplace Fees</th>
                <th className="pb-6 px-4 text-center">Shipping</th>
                <th className="pb-6 px-4 text-center">Ads</th>
                <th className="pb-6 px-4 text-center">P&L</th>
                <th className="pb-6 pl-4 text-right">Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {displayProducts.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="py-6 pr-4">
                    <span className="font-bold text-sm text-on-surface">{item.name}</span>
                  </td>
                  <td className="py-6 px-4 text-center text-sm text-on-surface-variant font-bold text-primary">${Number(item.price).toFixed(2)}</td>
                  <td className="py-6 px-4 text-center text-sm text-on-surface-variant">${Number(item.cost).toFixed(2)}</td>
                  <td className="py-6 px-4 text-center text-sm text-on-surface-variant">${Number(item.fees).toFixed(2)}</td>
                  <td className="py-6 px-4 text-center text-sm text-on-surface-variant">${Number(item.shipping).toFixed(2)}</td>
                  <td className="py-6 px-4 text-center text-sm text-on-surface-variant">${Number(item.ads).toFixed(2)}</td>
                  <td className="py-6 px-4 text-center">
                    <span className={cn(
                      "inline-block px-3 py-1 rounded text-xs font-bold",
                      item.pl > 0 ? "bg-primary-container/10 text-primary-container" : "bg-red-100 text-red-600"
                    )}>
                      {item.pl > 0 ? '+' : ''}${Number(item.pl).toFixed(2)}
                    </span>
                  </td>
                  <td className={cn("py-6 pl-4 text-right text-sm font-bold", item.return > 0 ? "text-primary-container" : "text-red-600")}>
                    {item.return}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Management Table */}
      <div className="bg-white p-10 rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-xl font-bold mb-8">Stock Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/15 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                <th className="pb-6 pr-4">Product</th>
                <th className="pb-6 px-4 text-center">Stock</th>
                <th className="pb-6 px-4 text-center">Units Sold (30d)</th>
                <th className="pb-6 px-4 text-center">Status</th>
                <th className="pb-6 pl-4 text-center">DOH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {displayStockManagement.map((item: any) => (
                <tr key={item.name} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="py-6 pr-4">
                    <span className="font-bold text-sm text-on-surface">{item.name}</span>
                  </td>
                  <td className="py-6 px-4 text-center text-sm text-on-surface-variant font-semibold">{item.stock.toLocaleString()}</td>
                  <td className="py-6 px-4 text-center text-sm text-on-surface-variant font-semibold">{(item.recentSales || 0).toLocaleString()}</td>
                  <td className="py-6 px-4 text-center">
                    <span className={cn(
                      "inline-block px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      item.status === 'OK' ? "bg-primary-container/10 text-primary-container" :
                      item.status === 'Risk' ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-6 pl-4 text-center text-sm text-on-surface-variant font-semibold">{item.doh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
