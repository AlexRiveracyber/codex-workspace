import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, CircleDot } from 'lucide-react';

type DayKind = 'holiday' | 'workday';
type DayMark = { name: string; kind: DayKind };

const official2026: Record<string, DayMark> = {};

const addRange = (month: number, start: number, end: number, name: string) => {
  for (let day = start; day <= end; day += 1) {
    official2026[`2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`] = { name, kind: 'holiday' };
  }
};

addRange(1, 1, 3, '元旦');
addRange(2, 15, 23, '春节');
addRange(4, 4, 6, '清明节');
addRange(5, 1, 5, '劳动节');
addRange(6, 19, 21, '端午节');
addRange(9, 25, 27, '中秋节');
addRange(10, 1, 7, '国庆节');
['2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10'].forEach((date) => {
  official2026[date] = { name: '调休上班', kind: 'workday' };
});

const commonFestivals: Record<string, string> = {
  '01-01': '元旦',
  '03-08': '妇女节',
  '05-01': '劳动节',
  '05-04': '青年节',
  '06-01': '儿童节',
  '09-10': '教师节',
  '10-01': '国庆节',
};

const pad = (value: number) => String(value).padStart(2, '0');
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const sameDay = (a: Date, b: Date) => dateKey(a) === dateKey(b);
const lunarFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { month: 'long', day: 'numeric' });
const getLunar = (date: Date) => lunarFormatter.format(date).replace(/月/g, '月');

export const CalendarTools: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [year, month]);

  const moveMonth = (offset: number) => setCursor(new Date(year, month + offset, 1));
  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(today);
  };
  const selectedMark = official2026[dateKey(selected)];
  const selectedFestival = selectedMark?.name || commonFestivals[dateKey(selected).slice(5)];
  const monthMarks = Object.entries(official2026).filter(([key]) => key.startsWith(`${year}-${pad(month + 1)}`));

  return (
    <div className="calendar-page animate-in fade-in duration-150">
      <section className="calendar-hero">
        <div>
          <div className="calendar-kicker"><CalendarDays size={14} /> 万年历</div>
          <h2>{year} 年 {month + 1} 月</h2>
          <p>公历、农历与中国法定节假日调休安排</p>
        </div>
        <div className="calendar-controls">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="上个月"><ChevronLeft size={18} /></button>
          <select value={year} onChange={(event) => setCursor(new Date(Number(event.target.value), month, 1))} aria-label="选择年份">
            {Array.from({ length: 41 }, (_, index) => today.getFullYear() - 20 + index).map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={month} onChange={(event) => setCursor(new Date(year, Number(event.target.value), 1))} aria-label="选择月份">
            {Array.from({ length: 12 }, (_, index) => <option key={index} value={index}>{index + 1} 月</option>)}
          </select>
          <button type="button" className="calendar-today" onClick={goToday}><CircleDot size={15} /> 今天</button>
          <button type="button" onClick={() => moveMonth(1)} aria-label="下个月"><ChevronRight size={18} /></button>
        </div>
      </section>

      <div className="calendar-layout">
        <section className="calendar-board" aria-label={`${year}年${month + 1}月日历`}>
          <div className="calendar-weekdays">
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => <span key={day} className={index === 0 || index === 6 ? 'is-weekend' : ''}>周{day}</span>)}
          </div>
          <div className="calendar-grid">
            {days.map((date) => {
              const key = dateKey(date);
              const mark = official2026[key];
              const festival = mark?.name || commonFestivals[key.slice(5)];
              const inMonth = date.getMonth() === month;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => { setSelected(date); if (!inMonth) setCursor(new Date(date.getFullYear(), date.getMonth(), 1)); }}
                  className={`calendar-day${inMonth ? '' : ' is-muted'}${sameDay(date, today) ? ' is-today' : ''}${sameDay(date, selected) ? ' is-selected' : ''}`}
                >
                  <span className="calendar-day-number">{date.getDate()}</span>
                  {mark && <span className={`calendar-day-badge is-${mark.kind}`}>{mark.kind === 'holiday' ? '休' : '班'}</span>}
                  <span className="calendar-lunar">{festival || getLunar(date)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="calendar-sidebar">
          <section className="calendar-date-card">
            <span>{selected.getFullYear()} / {pad(selected.getMonth() + 1)}</span>
            <strong>{selected.getDate()}</strong>
            <p>{selected.toLocaleDateString('zh-CN', { weekday: 'long' })} · {getLunar(selected)}</p>
            {selectedFestival && <div className={`calendar-selected-mark${selectedMark?.kind === 'workday' ? ' is-workday' : ''}`}>{selectedFestival}</div>}
          </section>

          <section className="calendar-holiday-card">
            <div className="calendar-section-title"><span>本月安排</span><small>{year === 2026 ? '国务院公布' : '常规节日'}</small></div>
            {year === 2026 && monthMarks.length > 0 ? (
              <div className="calendar-mark-list">
                {monthMarks.map(([key, mark]) => (
                  <button type="button" key={key} onClick={() => setSelected(new Date(`${key}T00:00:00`))}>
                    <span className={`calendar-list-badge is-${mark.kind}`}>{mark.kind === 'holiday' ? '休' : '班'}</span>
                    <span><b>{Number(key.slice(-2))} 日</b><small>{mark.name}</small></span>
                  </button>
                ))}
              </div>
            ) : <p className="calendar-empty">{year === 2026 ? '本月无法定节假日或调休' : '法定调休安排以当年国务院通知为准'}</p>}
          </section>

          <div className="calendar-legend"><span><i className="is-holiday" />法定休假</span><span><i className="is-workday" />调休上班</span><span><i className="is-today" />今天</span></div>
        </aside>
      </div>
    </div>
  );
};
