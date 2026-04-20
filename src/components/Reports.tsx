import React from 'react';
import { Download, ChevronLeft, ChevronRight, Bolt, Filter, ArrowUp, ArrowDown, Search, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import FilterControls from './FilterControls';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(weekOfYear);

const transactions = [
  { id: 1, canal: 'Amazon', fecha: '12 Jun, 2024', hora: '14:22', producto: 'UltraFocus Wireless Headphones', monto: 299.00, unidades: 1, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 2, canal: 'Meli', fecha: '12 Jun, 2024', hora: '13:45', producto: 'SmartHome Central Hub v2', monto: 154.50, unidades: 2, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 3, canal: 'Shopify', fecha: '11 Jun, 2024', hora: '09:12', producto: 'CloudSync Annual Subscription', monto: 1200.00, unidades: 1, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 4, canal: 'Directo', fecha: '11 Jun, 2024', hora: '08:30', producto: 'Custom Enterprise Integration', monto: 4500.00, unidades: 1, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 5, canal: 'Amazon', fecha: '10 Jun, 2024', hora: '21:05', producto: 'ErgoDesk Standing Pro', monto: 849.00, unidades: 3, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 6, canal: 'Meli', fecha: '10 Jun, 2024', hora: '18:15', producto: 'Quantum Link Dongle', monto: 45.99, unidades: 12, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 7, canal: 'Directo', fecha: '09 Jun, 2024', hora: '11:00', producto: 'Support Package Bronze', monto: 250.00, unidades: 5, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

function FilterMenu({ 
  title, 
  columnKey, 
  values, 
  selectedValues, 
  onToggleValue, 
  onSelectAll, 
  onClear, 
  onSort, 
  currentSort,
  onClose
}: { 
  title: string, 
  columnKey: string, 
  values: string[], 
  selectedValues: string[], 
  onToggleValue: (val: string) => void,
  onSelectAll: () => void,
  onClear: () => void,
  onSort: (dir: 'asc' | 'desc') => void,
  currentSort: { key: string, direction: 'asc' | 'desc' | null },
  onClose: () => void
}) {
  const [search, setSearch] = React.useState('');
  const filteredValues = values.filter(v => v.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-outline-variant/20 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
      {/* Sort Options */}
      <div className="p-2 border-b border-outline-variant/10">
        <button 
          onClick={() => { onSort('asc'); onClose(); }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            currentSort.key === columnKey && currentSort.direction === 'asc' ? "bg-primary/10 text-primary" : "hover:bg-surface-container-low text-on-surface"
          )}
        >
          <ArrowUp className="w-4 h-4" />
          Ordenar de A a Z
        </button>
        <button 
          onClick={() => { onSort('desc'); onClose(); }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            currentSort.key === columnKey && currentSort.direction === 'desc' ? "bg-primary/10 text-primary" : "hover:bg-surface-container-low text-on-surface"
          )}
        >
          <ArrowDown className="w-4 h-4" />
          Ordenar de Z a A
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-outline-variant/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
          <input 
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Values List */}
      <div className="max-h-48 overflow-y-auto p-2 space-y-1">
        <label className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors group">
          <div 
            onClick={(e) => { e.preventDefault(); onSelectAll(); }}
            className={cn(
              "w-4 h-4 rounded border flex items-center justify-center transition-all",
              selectedValues.length === values.length ? "bg-primary border-primary" : "border-outline-variant group-hover:border-primary"
            )}
          >
            {selectedValues.length === values.length && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="text-xs font-medium text-on-surface">(Seleccionar todo)</span>
        </label>
        {filteredValues.map(val => (
          <label key={val} className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors group">
            <div 
              onClick={(e) => { e.preventDefault(); onToggleValue(val); }}
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition-all",
                selectedValues.includes(val) ? "bg-primary border-primary" : "border-outline-variant group-hover:border-primary"
              )}
            >
              {selectedValues.includes(val) && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-xs font-medium text-on-surface truncate">{val}</span>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="p-2 border-t border-outline-variant/10 flex gap-2">
        <button 
          onClick={onClear}
          className="flex-1 px-3 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
        >
          Borrar filtro
        </button>
        <button 
          onClick={onClose}
          className="flex-1 px-3 py-2 text-xs font-bold bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

export default function Reports({ 
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
  const rawTransactions = data?.transactions || [];
  const [sortConfig, setSortConfig] = React.useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'date', direction: 'desc' });
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [selectedColumnValues, setSelectedColumnValues] = React.useState<Record<string, string[]>>({
    channel: [],
    date: [],
    product: [],
    amount: [],
    status: []
  });

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => setOpenMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
  };

  const getUniqueValues = (key: string): string[] => {
    const vals = rawTransactions.map((tx: any) => {
      const v = tx[key] || tx[key === 'channel' ? 'canal' : key === 'date' ? 'fecha' : key === 'amount' ? 'monto' : 'producto'];
      return String(v || '');
    });
    return Array.from(new Set(vals)).filter(v => v !== '').sort() as string[];
  };

  const toggleColumnValue = (key: string, val: string) => {
    setSelectedColumnValues(prev => {
      const current = prev[key] || [];
      const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
      return { ...prev, [key]: next };
    });
  };

  const selectAllColumnValues = (key: string) => {
    const allVals = getUniqueValues(key);
    setSelectedColumnValues(prev => ({ ...prev, [key]: allVals }));
  };

  const clearColumnFilter = (key: string) => {
    setSelectedColumnValues(prev => ({ ...prev, [key]: [] }));
  };

  const filteredTransactions = React.useMemo(() => {
    let result = !data && rawTransactions.length === 0 ? transactions : rawTransactions;

    // Apply Global Filters (Channel & Date Range)
    result = result.filter((tx: any) => {
      const txDate = dayjs(tx.date || tx.fecha);
      const txChannel = String(tx.channel || tx.canal || '').trim();
      
      // Strict channel matching (case-insensitive)
      const channelMatch = !selectedChannel || selectedChannel === 'Total' || txChannel.toLowerCase() === selectedChannel.toLowerCase();
      
      let dateMatch = false;
      switch (selectedPeriod) {
        case 'Weekly':
          dateMatch = txDate.year() === selectedYear && txDate.week() === selectedWeek;
          break;
        case 'Monthly':
          dateMatch = txDate.year() === selectedYear && txDate.month() === selectedMonth;
          break;
        case 'Year to Date':
          dateMatch = txDate.year() === selectedYear && txDate.isSameOrBefore(dayjs(), 'day');
          break;
        case 'Last Year':
          dateMatch = txDate.year() === selectedYear - 1;
          break;
        default:
          dateMatch = true;
      }
      return channelMatch && dateMatch;
    });

    // Apply Column Filters (Excel style)
    result = result.filter((tx: any) => {
      const check = (key: string) => {
        const selected = selectedColumnValues[key];
        if (!selected || selected.length === 0) return true;
        const val = String(tx[key] || tx[key === 'channel' ? 'canal' : key === 'date' ? 'fecha' : key === 'amount' ? 'monto' : 'producto'] || '');
        return selected.includes(val);
      };
      
      return check('channel') && check('date') && check('product') && check('amount') && check('status');
    });

    // Apply Sorting
    if (sortConfig.key && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let valA = a[sortConfig.key] || a[sortConfig.key === 'channel' ? 'canal' : sortConfig.key === 'date' ? 'fecha' : sortConfig.key === 'amount' ? 'monto' : 'producto'];
        let valB = b[sortConfig.key] || b[sortConfig.key === 'channel' ? 'canal' : sortConfig.key === 'date' ? 'fecha' : sortConfig.key === 'amount' ? 'monto' : 'producto'];

        if (sortConfig.key === 'date') {
          valA = dayjs(valA).unix();
          valB = dayjs(valB).unix();
        } else if (sortConfig.key === 'amount') {
          valA = parseFloat(valA) || 0;
          valB = parseFloat(valB) || 0;
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [rawTransactions, selectedChannel, selectedPeriod, selectedWeek, selectedMonth, selectedYear, data, selectedColumnValues, sortConfig]);

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'Amazon': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Meli': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Shopify': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Direct': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="pb-12 px-6 max-w-screen-2xl mx-auto space-y-10 pt-16">
      {/* Header & Filter Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div>
          <p className="text-on-surface-variant font-medium text-sm">Performance Overview</p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">Transaction Reports</h1>
        </div>
        <div className="flex flex-col items-end gap-4 w-full lg:w-auto">
          <FilterControls 
            selectedChannel={selectedChannel} setSelectedChannel={setSelectedChannel}
            selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod}
            selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek}
            selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear} setSelectedYear={setSelectedYear}
          />
          
          <div className="flex flex-wrap items-center gap-3 justify-end w-full lg:w-auto">
            <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-primary-container to-primary text-white font-bold rounded-lg shadow-md hover:scale-[1.02] active:scale-95 transition-all">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                <th className="px-8 py-5 relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'channel' ? null : 'channel'); }}
                    className={cn(
                      "flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors",
                      selectedColumnValues.channel.length > 0 ? "text-primary" : "text-on-surface-variant hover:text-primary"
                    )}
                  >
                    Canal
                    <Filter className={cn("w-3 h-3", selectedColumnValues.channel.length > 0 && "fill-primary")} />
                  </button>
                  {openMenu === 'channel' && (
                    <FilterMenu 
                      title="Canal"
                      columnKey="channel"
                      values={getUniqueValues('channel')}
                      selectedValues={selectedColumnValues.channel}
                      onToggleValue={(val) => toggleColumnValue('channel', val)}
                      onSelectAll={() => selectAllColumnValues('channel')}
                      onClear={() => clearColumnFilter('channel')}
                      onSort={(dir) => handleSort('channel', dir)}
                      currentSort={sortConfig}
                      onClose={() => setOpenMenu(null)}
                    />
                  )}
                </th>
                <th className="px-6 py-5 relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'date' ? null : 'date'); }}
                    className={cn(
                      "flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors",
                      selectedColumnValues.date.length > 0 ? "text-primary" : "text-on-surface-variant hover:text-primary"
                    )}
                  >
                    Fecha
                    <Filter className={cn("w-3 h-3", selectedColumnValues.date.length > 0 && "fill-primary")} />
                  </button>
                  {openMenu === 'date' && (
                    <FilterMenu 
                      title="Fecha"
                      columnKey="date"
                      values={getUniqueValues('date')}
                      selectedValues={selectedColumnValues.date}
                      onToggleValue={(val) => toggleColumnValue('date', val)}
                      onSelectAll={() => selectAllColumnValues('date')}
                      onClear={() => clearColumnFilter('date')}
                      onSort={(dir) => handleSort('date', dir)}
                      currentSort={sortConfig}
                      onClose={() => setOpenMenu(null)}
                    />
                  )}
                </th>
                <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">ID / Orden</th>
                <th className="px-6 py-5 relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'product' ? null : 'product'); }}
                    className={cn(
                      "flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors",
                      selectedColumnValues.product.length > 0 ? "text-primary" : "text-on-surface-variant hover:text-primary"
                    )}
                  >
                    Producto
                    <Filter className={cn("w-3 h-3", selectedColumnValues.product.length > 0 && "fill-primary")} />
                  </button>
                  {openMenu === 'product' && (
                    <FilterMenu 
                      title="Producto"
                      columnKey="product"
                      values={getUniqueValues('product')}
                      selectedValues={selectedColumnValues.product}
                      onToggleValue={(val) => toggleColumnValue('product', val)}
                      onSelectAll={() => selectAllColumnValues('product')}
                      onClear={() => clearColumnFilter('product')}
                      onSort={(dir) => handleSort('product', dir)}
                      currentSort={sortConfig}
                      onClose={() => setOpenMenu(null)}
                    />
                  )}
                </th>
                <th className="px-6 py-5 relative">
                  <div className="flex justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'amount' ? null : 'amount'); }}
                      className={cn(
                        "flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors",
                        selectedColumnValues.amount.length > 0 ? "text-primary" : "text-on-surface-variant hover:text-primary"
                      )}
                    >
                      Monto
                      <Filter className={cn("w-3 h-3", selectedColumnValues.amount.length > 0 && "fill-primary")} />
                    </button>
                  </div>
                  {openMenu === 'amount' && (
                    <div className="absolute right-0">
                      <FilterMenu 
                        title="Monto"
                        columnKey="amount"
                        values={getUniqueValues('amount')}
                        selectedValues={selectedColumnValues.amount}
                        onToggleValue={(val) => toggleColumnValue('amount', val)}
                        onSelectAll={() => selectAllColumnValues('amount')}
                        onClear={() => clearColumnFilter('amount')}
                        onSort={(dir) => handleSort('amount', dir)}
                        currentSort={sortConfig}
                        onClose={() => setOpenMenu(null)}
                      />
                    </div>
                  )}
                </th>
                <th className="px-6 py-5 relative">
                  <div className="flex justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'status' ? null : 'status'); }}
                      className={cn(
                        "flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors",
                        selectedColumnValues.status.length > 0 ? "text-primary" : "text-on-surface-variant hover:text-primary"
                      )}
                    >
                      Status
                      <Filter className={cn("w-3 h-3", selectedColumnValues.status.length > 0 && "fill-primary")} />
                    </button>
                  </div>
                  {openMenu === 'status' && (
                    <div className="absolute right-0">
                      <FilterMenu 
                        title="Status"
                        columnKey="status"
                        values={getUniqueValues('status')}
                        selectedValues={selectedColumnValues.status}
                        onToggleValue={(val) => toggleColumnValue('status', val)}
                        onSelectAll={() => selectAllColumnValues('status')}
                        onClear={() => clearColumnFilter('status')}
                        onSort={(dir) => handleSort('status', dir)}
                        currentSort={sortConfig}
                        onClose={() => setOpenMenu(null)}
                      />
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60">
              {filteredTransactions.map((tx: any, index: number) => (
                <tr key={`${tx.id || 'tx'}-${index}`} className="hover:bg-surface-container-low/20 transition-colors">
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase border",
                      getChannelColor(tx.channel || tx.canal)
                    )}>
                      {tx.channel || tx.canal || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-on-surface">{tx.date || tx.fecha || '-'}</td>
                  <td className="px-6 py-5 text-sm text-on-surface-variant">{tx.id || '-'}</td>
                  <td className="px-6 py-5 text-sm font-semibold text-on-surface truncate max-w-[250px]">{tx.product || tx.producto || '-'}</td>
                  <td className="px-6 py-5 text-sm font-bold text-on-surface text-right">
                    ${(tx.amount || tx.monto || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-on-surface text-right">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      (tx.status || '').toLowerCase() === 'approved' || (tx.status || '').toLowerCase() === 'shipped' || (tx.status || '').toLowerCase() === 'paid'
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {tx.status || 'Approved'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-8 py-6 bg-white border-t border-outline-variant/15 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-on-surface-variant font-medium">
            Showing <span className="text-on-surface font-bold">{filteredTransactions.length}</span> transactions
          </p>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center px-4 h-10 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low text-on-surface-variant transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <button className="flex items-center justify-center px-4 h-10 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low text-on-surface-variant transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
