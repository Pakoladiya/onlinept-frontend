import { useState, useRef } from 'react';
import { 
  SunMedium, Sunset, Moon, Clock, Calendar, ChevronRight, ChevronLeft 
} from 'lucide-react';

// Helper: Get contrast color (White or Dark Slate) based on background hex
const getContrastColor = (hexcolor) => {
  if (!hexcolor || hexcolor.startsWith('rgba')) return '#FFFFFF';
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 170) ? '#0F172A' : '#FFFFFF';
};

export default function SchedulePicker({ clinicConfig = {}, selectedDate, selectedTime, onSelect, T = {} }) {
  // Safety theme fallback
  const theme = {
    primary: T?.primary || '#007AFF',
    border: T?.border || 'rgba(255,255,255,0.1)',
    white: T?.white || 'rgba(30, 41, 59, 1)',
    ink: T?.ink || '#F8FAFC',
    primaryLight: T?.primaryLight || 'rgba(255, 255, 255, 0.05)',
    ...T
  };

  const contrastText = getContrastColor(theme.primary);
  const [selectedPref, setSelectedPref] = useState('all');
  const scrollRef = useRef(null);

  const scroll = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const timePreferences = [
    { id: 'morning', label: 'Morning', icon: SunMedium, range: [9, 12] },
    { id: 'afternoon', label: 'Afternoon', icon: Sunset, range: [12, 17] },
    { id: 'evening', label: 'Evening', icon: Moon, range: [17, 21] },
  ];

  // Helper: Generate time slots for a specific day
  const getAvailableSlots = (date, config, rangeFilter = null) => {
    if (!date || !config) return [];
    
    // 1. Check if date is blocked
    const dateStr = date.toISOString().split('T')[0];
    if (config.blockedDates?.includes(dateStr)) return [];

    let shifts = [];
    const dayConfig = config.workingHours?.schedule?.[date.getDay()];
    
    if (dayConfig && dayConfig.isOpen && dayConfig.shifts) {
      shifts = dayConfig.shifts;
    } else if (config.workingHours?.start && config.workingHours?.end) {
      // Legacy Fallback
      shifts = [{ start: config.workingHours.start, end: config.workingHours.end }];
    } else {
      return []; // No schedule found
    }

    const slots = [];
    const intervalMinutes = config.slotDurationMinutes || 30;
    
    // Timezone safe "now" check
    const now = new Date();
    // Add 30 min buffer for same-day bookings
    const bookingThreshold = new Date(now.getTime() + (30 * 60 * 1000));
    const isToday = dateStr === now.toISOString().split('T')[0];

    shifts.forEach(shift => {
      if (!shift?.start || !shift?.end) return;
      const [startH, startM] = shift.start.split(':').map(Number);
      const [endH, endM] = shift.end.split(':').map(Number);

      let current = new Date(date);
      current.setHours(startH, startM, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(endH, endM, 0, 0);

      while (current < endTime) {
        const h = current.getHours();
        const m = current.getMinutes();
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const label = current.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        // Apply range filter
        let inRange = true;
        if (rangeFilter) {
          inRange = h >= rangeFilter[0] && h < rangeFilter[1];
        }

        // 2. Check if slot is blocked
        const isBlocked = config.blockedSlots?.[dateStr]?.includes(timeStr);
        
        // 3. Check if slot is in the past (for today)
        const isPast = isToday && current < bookingThreshold;

        if (inRange && !isBlocked && !isPast) {
          slots.push({ id: timeStr, label, date: dateStr });
        }

        current.setMinutes(current.getMinutes() + intervalMinutes);
      }
    });

    return slots;
  };

  // Generate next 30 *working* days
  const upcomingDays = [];
  const startDay = new Date();
  startDay.setHours(0, 0, 0, 0);
  let iterDate = new Date(startDay);
  let safetyCounter = 0;
  
  const schedule = clinicConfig?.workingHours?.schedule;

  while (upcomingDays.length < 30 && safetyCounter < 365) {
    // If no schedule defined, assume every day is a working day for visibility
    const isWorkingDay = schedule ? schedule[iterDate.getDay()]?.isOpen : true;
    if (isWorkingDay) {
      upcomingDays.push(new Date(iterDate));
    }
    iterDate.setDate(iterDate.getDate() + 1);
    safetyCounter++;
  }

  const defaultDate = upcomingDays.length > 0 ? upcomingDays[0] : new Date();
  const activeDate = selectedDate instanceof Date ? selectedDate : new Date(selectedDate || defaultDate);
  
  const availableSlots = getAvailableSlots(
    activeDate,
    clinicConfig,
    selectedPref === 'all' ? null : timePreferences.find(p => p.id === selectedPref).range
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: '100%', overflow: 'hidden' }} className="schedule-picker">
      {/* Interactive Date Selector with Arrow Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, position: 'relative', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        
        {/* Left Scroll Arrow */}
        <button 
          type="button" 
          onClick={() => scroll(-200)}
          style={{ 
            padding: 8, background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${theme.border}`, borderRadius: '50%',
            cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s', color: theme.ink
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Scrollable Container */}
        <div 
          ref={scrollRef}
          style={{ 
            display: 'flex', gap: 12, overflowX: 'auto', scrollBehavior: 'smooth', 
            padding: '12px 4px', flex: 1, maxWidth: '100%', minHeight: 80,
            msOverflowStyle: 'none', scrollbarWidth: 'none', alignItems: 'center'
          }}
          className="no-scrollbar"
        >
          <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          {upcomingDays.map((d, i) => {
            const isSelected = activeDate.toDateString() === d.toDateString();
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = d.getDate();
            
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(d, null)}
                style={{
                  minWidth: 64, height: 72, padding: '12px 8px', borderRadius: 18,
                  border: isSelected ? `2px solid ${theme.primary}` : `1.5px solid ${theme.border}`,
                  background: isSelected ? theme.primary : 'rgba(255,255,255,0.03)',
                  color: isSelected ? contrastText : theme.ink,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                  boxShadow: isSelected ? `0 8px 20px ${theme.primary}30` : 'none'
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 800, opacity: isSelected ? 0.9 : 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>{dayName}</span>
                <span style={{ fontSize: 20, fontWeight: 900 }}>{dayNum}</span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        <button 
          type="button" 
          onClick={() => scroll(200)}
          style={{ 
            padding: 8, background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${theme.border}`, borderRadius: '50%',
            cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s', color: theme.ink
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Time Preference Tabs */}
      <div style={{ display: 'flex', gap: 10, padding: '4px' }}>
        <button
          type="button"
          onClick={() => setSelectedPref('all')}
          style={{
            flex: 1, padding: '12px', borderRadius: 14, border: 'none', fontSize: 13, fontWeight: 800,
            background: selectedPref === 'all' ? theme.primary : theme.primaryLight,
            color: selectedPref === 'all' ? contrastText : theme.ink,
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >All</button>
        {timePreferences.map(pref => (
          <button
            key={pref.id}
            type="button"
            onClick={() => setSelectedPref(pref.id)}
            style={{
              flex: 1, padding: '12px', borderRadius: 14, border: 'none', fontSize: 13, fontWeight: 800,
              background: selectedPref === pref.id ? theme.primary : theme.primaryLight,
              color: selectedPref === pref.id ? contrastText : theme.ink,
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            <pref.icon size={15} /> {pref.label}
          </button>
        ))}
      </div>

      {/* Slots Grid */}
      <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column' }}>
        <div 
          className="slots-grid"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
            gap: 12,
            width: '100%'
          }}
        >
           {availableSlots.length > 0 ? (
            availableSlots.map(slot => (
              <button
                key={slot.id}
                type="button"
                onClick={() => onSelect(activeDate, slot)}
                style={{
                  padding: '16px 10px',
                  borderRadius: 14,
                  border: `2px solid ${selectedTime?.id === slot.id ? theme.primary : 'rgba(255,255,255,0.05)'}`,
                  background: selectedTime?.id === slot.id ? theme.primary : 'rgba(255,255,255,0.02)',
                  color: selectedTime?.id === slot.id ? contrastText : theme.ink,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {slot.label}
              </button>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '60px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
               <Clock size={32} style={{ color: '#475569', opacity: 0.5 }} />
               <p style={{ color: '#64748B', fontSize: 14, fontWeight: 600 }}>No slots available for this period.</p>
               <p style={{ color: '#475569', fontSize: 12 }}>Try selecting another date or preference.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
