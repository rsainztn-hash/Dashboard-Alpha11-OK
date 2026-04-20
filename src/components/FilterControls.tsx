import React from 'react';
import { cn } from '@/src/lib/utils';
import { ChevronLeft, ChevronRight, Calendar, Check } from 'lucide-react';
import dayjs from 'dayjs';

interface FilterControlsProps {
  selectedChannel: string;
  setSelectedChannel: (channel: string) => void;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

export default function FilterControls({
  selectedChannel, setSelectedChannel,
  selectedPeriod, setSelectedPeriod,
  selectedWeek, setSelectedWeek,
  selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear
}: FilterControlsProps) {
  
  const [isWeekPickerOpen, setIsWeekPickerOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(dayjs().year(selectedYear).week(selectedWeek).startOf('month'));
  const weekPickerRef = React.useRef<HTMLDivElement>(null);

  // Close week picker on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (weekPickerRef.current && !weekPickerRef.current.contains(event.target as Node)) {
        setIsWeekPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const years = [2024, 2025, 2026];
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-end gap-4 w-full lg:w-auto">
      {/* Channel Filters */}
      <div className="flex flex-wrap gap-2 justify-end">
        <button 
          onClick={() => setSelectedChannel('Total')}
          className={cn(
            "px-5 py-1.5 rounded-full text-sm font-bold transition-all",
            selectedChannel === 'Total' ? "bg-primary text-white shadow-sm" : "bg-white text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-low"
          )}
        >
          Totales
        </button>
        {['Amazon', 'Meli', 'Shopify', 'Direct'].map((channel) => (
          <button 
            key={channel} 
            onClick={() => setSelectedChannel(channel)}
            className={cn(
              "px-5 py-1.5 rounded-full text-sm font-bold transition-all",
              selectedChannel === channel ? "bg-primary text-white shadow-sm" : "bg-white text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-low"
            )}
          >
            {channel}
          </button>
        ))}
      </div>

      {/* Date Range Buttons */}
      <div className="flex flex-wrap gap-2 justify-end">
        {['Weekly', 'Monthly', 'Year to Date', 'Last Year'].map((range) => (
          <button 
            key={range} 
            onClick={() => {
              setSelectedPeriod(range);
              const today = dayjs();
              if (range === 'Weekly') {
                setSelectedWeek(today.week());
                setSelectedYear(today.year());
                setViewDate(today.startOf('month'));
              } else if (range === 'Monthly') {
                setSelectedMonth(today.month());
                setSelectedYear(today.year());
              } else if (range === 'Year to Date') {
                setSelectedYear(today.year());
              } else if (range === 'Last Year') {
                setSelectedYear(today.year() - 1);
              }
            }}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              selectedPeriod === range ? "bg-primary text-white shadow-sm" : "bg-white text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-low"
            )}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Dynamic Selectors */}
      <div className="flex flex-wrap items-center gap-3 justify-end w-full lg:w-auto">
        {selectedPeriod === 'Weekly' && (
          <div className="relative" ref={weekPickerRef}>
            <button 
              onClick={() => setIsWeekPickerOpen(!isWeekPickerOpen)}
              className="flex items-center gap-3 bg-white border border-outline-variant/20 rounded-lg px-4 py-2 hover:bg-surface-container-low transition-all shadow-sm group"
            >
              <Calendar className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase leading-none mb-1">Periodo:</span>
                <span className="text-sm font-bold text-on-surface">Semana {selectedWeek}, {selectedYear}</span>
              </div>
              <ChevronRight className={cn("w-4 h-4 text-on-surface-variant transition-transform", isWeekPickerOpen ? "rotate-90" : "")} />
            </button>

            {isWeekPickerOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 z-50 p-5 animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={() => setViewDate(viewDate.subtract(1, 'month'))} 
                    className="p-2 hover:bg-surface-container-low rounded-xl transition-colors text-on-surface-variant"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-extrabold capitalize text-on-surface">{viewDate.format('MMMM')}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant">{viewDate.format('YYYY')}</span>
                  </div>
                  <button 
                    onClick={() => setViewDate(viewDate.add(1, 'month'))} 
                    className="p-2 hover:bg-surface-container-low rounded-xl transition-colors text-on-surface-variant"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-8 gap-1 text-center mb-3">
                  <div className="text-[9px] font-black text-primary/40 uppercase tracking-tighter">W</div>
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-[9px] font-black text-on-surface-variant/50 uppercase">{d}</div>
                  ))}
                </div>

                <div className="space-y-1">
                  {(() => {
                    const startOfMonth = viewDate.startOf('month');
                    const endOfMonth = viewDate.endOf('month');
                    const startOfGrid = startOfMonth.startOf('week');
                    const endOfGrid = endOfMonth.endOf('week');
                    
                    const rows = [];
                    let currentDay = startOfGrid;
                    
                    while (currentDay.isBefore(endOfGrid) || currentDay.isSame(endOfGrid, 'day')) {
                      const row = [];
                      for (let i = 0; i < 7; i++) {
                        row.push(currentDay);
                        currentDay = currentDay.add(1, 'day');
                      }
                      rows.push(row);
                    }

                    return rows.map((row, i) => {
                      const weekNum = row[0].week();
                      const isSelected = weekNum === selectedWeek && row[0].year() === selectedYear;
                      
                      return (
                        <div key={i} className={cn(
                          "grid grid-cols-8 gap-1 items-center rounded-xl transition-all p-0.5",
                          isSelected ? "bg-primary/5 ring-1 ring-primary/10" : "hover:bg-surface-container-low/40"
                        )}>
                          <button 
                            onClick={() => {
                              setSelectedWeek(weekNum);
                              setSelectedYear(row[0].year());
                              setIsWeekPickerOpen(false);
                            }}
                            className={cn(
                              "text-[10px] font-black py-2.5 rounded-lg border-r border-outline-variant/5 transition-all relative overflow-hidden group/btn",
                              isSelected ? "bg-primary text-white shadow-md" : "text-primary hover:bg-primary/10"
                            )}
                          >
                            {weekNum}
                            {isSelected && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
                          </button>
                          {row.map((day, j) => (
                            <div 
                              key={j} 
                              className={cn(
                                "text-[10px] py-2.5 text-center transition-colors",
                                day.month() !== viewDate.month() ? "text-on-surface-variant/20" : "text-on-surface font-bold",
                                day.isSame(dayjs(), 'day') && !isSelected && "text-primary underline decoration-2 underline-offset-4"
                              )}
                            >
                              {day.date()}
                            </div>
                          ))}
                        </div>
                      );
                    });
                  })()}
                </div>
                
                <div className="mt-6 pt-4 border-t border-outline-variant/10 flex justify-between items-center">
                  <button 
                    onClick={() => {
                      const today = dayjs();
                      setSelectedWeek(today.week());
                      setSelectedYear(today.year());
                      setViewDate(today.startOf('month'));
                      setIsWeekPickerOpen(false);
                    }}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Ir a hoy
                  </button>
                  <span className="text-[9px] font-medium text-on-surface-variant italic">Selecciona el número de semana</span>
                </div>
              </div>
            )}
          </div>
        )}

        {(selectedPeriod === 'Monthly' || selectedPeriod === 'Year to Date') && (
          <div className="flex items-center gap-3">
            {selectedPeriod === 'Monthly' && (
              <div className="flex items-center gap-2 bg-white border border-outline-variant/20 rounded-lg px-3 py-1.5">
                <span className="text-xs font-bold text-on-surface-variant uppercase">Mes:</span>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
                >
                  {months.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white border border-outline-variant/20 rounded-lg px-3 py-1.5">
              <span className="text-xs font-bold text-on-surface-variant uppercase">Año:</span>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
