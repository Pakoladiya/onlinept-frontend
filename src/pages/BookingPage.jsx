import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig from '@/config/clinicConfig';
import { Calendar, Clock, ChevronLeft, ChevronRight, SunMedium, Sunset, Moon, Loader } from 'lucide-react';

/**
 * BookingPage — Slot selection with calendar + morning/afternoon/evening grouping.
 * Purpose: Patient picks a service, date, and time slot.
 */
export default function BookingPage() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(clinicConfig.services[0]?.id || 'initial');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  const availableDates = [];
  let cursor = new Date(today);
  while (availableDates.length < 30) {
    const day = cursor.getDay();
    if (clinicConfig.workingHours.days.includes(day === 0 ? 7 : day)) {
      availableDates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const generateSlots = () => {
    const slots = [];
    const [startH, startM] = clinicConfig.workingHours.start.split(':').map(Number);
    const [endH, endM] = clinicConfig.workingHours.end.split(':').map(Number);
    let h = startH, m = startM;
    while (h < endH || (h === endH && m < endM)) {
      slots.push({
        id: `${h}:${m}`,
        label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        hour: h,
        booked: Math.random() < 0.25,
      });
      m += clinicConfig.slotDurationMinutes;
      if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
    }
    return slots;
  };

  const allSlots = useMemo(() => generateSlots(), []);

  const groupedSlots = useMemo(() => {
    const morning = allSlots.filter((s) => s.hour < 12);
    const afternoon = allSlots.filter((s) => s.hour >= 12 && s.hour < 17);
    const evening = allSlots.filter((s) => s.hour >= 17);
    return { morning, afternoon, evening };
  }, [allSlots]);

  const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthDays = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    return { firstDay: firstDay === 0 ? 6 : firstDay - 1, daysInMonth };
  };
  const { firstDay, daysInMonth } = monthDays();

  const isAvailable = (date) => availableDates.some((d) => d.toDateString() === date.toDateString());
  const isPast = (date) => date < new Date(today.toDateString());

  const service = clinicConfig.services.find((s) => s.id === selectedService) || clinicConfig.services[0];

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) return;
    setLoading(true);
    // TODO: Call POST /api/appointments or create booking in Firestore
    await new Promise((r) => setTimeout(r, 800));
    const mockBookingId = `booking_${Date.now()}`;
    navigate(`/intake/${mockBookingId}`, {
      state: {
        date: selectedDate,
        slot: selectedSlot,
        serviceId: selectedService,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
      },
    });
  };

  const SlotGroup = ({ label, icon: Icon, slots }) => {
    const available = slots.filter((s) => !s.booked);
    if (available.length === 0) return null;
    return (
      <div className="mb-4 last:mb-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon size={14} style={{ color: clinicConfig.primaryColor }} />
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</span>
          <span className="text-xs text-text-secondary">({available.length} available)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <button
              key={slot.id}
              disabled={slot.booked}
              onClick={() => setSelectedSlot(slot)}
              className={[
                'py-2 px-4 rounded-button text-sm font-medium border transition-all',
                slot.booked
                  ? 'bg-surface text-text-secondary border-border/50 cursor-not-allowed opacity-50'
                  : selectedSlot?.id === slot.id
                  ? 'text-white border-transparent'
                  : 'border-border text-text-primary hover:border-primary hover:text-primary',
              ].join(' ')}
              style={selectedSlot?.id === slot.id ? { backgroundColor: clinicConfig.primaryColor } : {}}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <PageWrapper>
      <div className="mb-6">
        <Badge variant="primary" size="sm" className="mb-2">Step 1 of 3</Badge>
        <h1 className="text-2xl font-bold text-text-primary">Book a Consultation</h1>
        <p className="text-sm text-text-secondary mt-1">Select a service, date, and time</p>
      </div>

      {/* Service selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {clinicConfig.services.map((svc) => (
          <button
            key={svc.id}
            onClick={() => { setSelectedService(svc.id); setSelectedSlot(null); }}
            className={[
              'shrink-0 px-4 py-3 rounded-card border text-left transition-all min-w-[140px]',
              selectedService === svc.id
                ? 'border-primary bg-primary-light'
                : 'border-border bg-white hover:border-primary/50',
            ].join(' ')}
          >
            <p className="text-sm font-semibold text-text-primary">{svc.name}</p>
            <p className="text-xs text-text-secondary">{svc.duration} min</p>
            <p className="text-sm font-bold mt-1" style={{ color: clinicConfig.primaryColor }}>₹{svc.price}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-surface transition-colors">
              <ChevronLeft size={20} className="text-text-secondary" />
            </button>
            <span className="font-semibold text-text-primary">{monthLabel}</span>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-surface transition-colors">
              <ChevronRight size={20} className="text-text-secondary" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-text-secondary py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {[...Array(firstDay)].map((_, i) => <div key={`e${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const available = isAvailable(dateObj) && !isPast(dateObj);
              const selected = selectedDate?.toDateString() === dateObj.toDateString();
              return (
                <button
                  key={day}
                  disabled={!available}
                  onClick={() => { setSelectedDate(dateObj); setSelectedSlot(null); }}
                  className={[
                    'h-9 w-9 rounded-full text-sm transition-all mx-auto',
                    !available ? 'text-border cursor-not-allowed' : 'hover:bg-primary-light cursor-pointer',
                    selected ? 'text-white font-semibold' : 'text-text-primary',
                    available && !selected && 'bg-surface',
                  ].join(' ')}
                  style={selected ? { backgroundColor: clinicConfig.primaryColor } : {}}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <div className="w-3 h-3 rounded-full bg-surface border border-border" /> Available
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: clinicConfig.primaryColor }} /> Selected
            </div>
          </div>
        </Card>

        {/* Time Slots */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} style={{ color: clinicConfig.primaryColor }} />
            <h2 className="font-semibold text-text-primary">
              {selectedDate
                ? selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Select a date first'}
            </h2>
          </div>

          {selectedDate ? (
            <div>
              <SlotGroup label="Morning" icon={SunMedium} slots={groupedSlots.morning} />
              <SlotGroup label="Afternoon" icon={Sunset} slots={groupedSlots.afternoon} />
              <SlotGroup label="Evening" icon={Moon} slots={groupedSlots.evening} />
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Pick a date to see available times</p>
            </div>
          )}

          {selectedDate && selectedSlot && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="text-center mb-3">
                <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Selected</p>
                <p className="text-sm font-semibold text-text-primary">
                  {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {selectedSlot.label}
                </p>
                <p className="text-xs text-text-secondary">{service.name} · {service.duration} min</p>
              </div>
              <Button fullWidth onClick={handleBooking} loading={loading}>
                {loading ? 'Booking...' : 'Continue to Details'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
