import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig from '@/config/clinicConfig';
import { 
    Calendar, 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    SunMedium, 
    Sunset, 
    Moon, 
    Loader2, 
    Sparkles, 
    ShieldCheck, 
    CheckCircle2, 
    ArrowRight 
} from 'lucide-react';

/**
 * Luxe BookingPage — Re-designed for high-conversion and "Dashing" aesthetic.
 * Optimized for Mobile-First experience with premium glassmorphism.
 */
export default function BookingPage() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(clinicConfig.services[0]?.id || 'initial');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  
  // SEO Meta Update
  useEffect(() => {
    document.title = `Book Session | ${clinicConfig.clinicName}`;
  }, []);

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
        booked: Math.random() < 0.2, // Simulated availability
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

  const { firstDay, daysInMonth } = useMemo(() => {
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    return { 
        firstDay: first === 0 ? 6 : first - 1, 
        daysInMonth: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() 
    };
  }, [currentMonth]);

  const isAvailable = (date) => availableDates.some((d) => d.toDateString() === date.toDateString());
  const isPast = (date) => date < new Date(today.toDateString());
  const service = clinicConfig.services.find((s) => s.id === selectedService) || clinicConfig.services[0];

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const mockBookingId = `BK-${Date.now().toString().slice(-6)}`;
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

  return (
    <PageWrapper className="bg-gray-50/50 min-h-screen">
      <div className="max-w-5xl mx-auto py-12 px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-4">
                  <Sparkles size={12} /> Personalized Care
               </div>
               <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-2">Secure Your Session</h1>
               <p className="text-gray-500 font-bold max-w-md">Join over 1,500+ patients who have recovered with our expert-led physiotherapy plans.</p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500"><ShieldCheck /></div>
                <div>
                   <p className="text-[10px] font-black uppercase text-gray-400">Step 01 / 03</p>
                   <p className="text-sm font-bold text-gray-900">Choose Appointment</p>
                </div>
            </div>
        </div>

        {/* Service Selector — Premium Chips */}
        <div className="mb-12">
           <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 pl-1">Select Specialization</p>
           <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
             {clinicConfig.services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc.id); setSelectedSlot(null); }}
                  className={`snap-center shrink-0 w-64 p-6 rounded-[2.5rem] border-2 transition-all duration-300 text-left relative overflow-hidden group
                    ${selectedService === svc.id ? 'border-primary bg-white shadow-2xl shadow-primary/10' : 'border-gray-100 bg-white/50 hover:border-primary/30'}`}
                >
                   {selectedService === svc.id && (
                       <div className="absolute top-0 right-0 p-4"><CheckCircle2 className="text-primary" size={20} /></div>
                   )}
                   <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{svc.duration} Minutes</p>
                   <p className="text-xl font-black text-gray-900 mb-4">{svc.name}</p>
                   <div className="flex items-center justify-between">
                      <p className="text-2xl font-black" style={{ color: clinicConfig.primaryColor }}>₹{svc.price}</p>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-transform group-hover:translate-x-1">
                         <ArrowRight size={14} className="text-gray-400" />
                      </div>
                   </div>
                </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Glass-Calendar */}
          <div className="lg:col-span-7">
            <Card className="p-8 rounded-[3rem] bg-white border-none shadow-2xl shadow-gray-200/50">
              <div className="flex items-center justify-between mb-10 px-2">
                <button onClick={prevMonth} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest">{monthLabel}</p>
                </div>
                <button onClick={nextMonth} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-6">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3">
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
                      className={`h-12 w-12 rounded-2xl text-sm font-bold transition-all mx-auto flex items-center justify-center relative
                        ${!available ? 'text-gray-200 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}
                        ${selected ? 'text-white shadow-xl shadow-primary/30' : available ? 'bg-gray-50 text-gray-600' : ''}`}
                      style={selected ? { backgroundColor: clinicConfig.primaryColor } : {}}
                    >
                      {day}
                      {available && !selected && <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary/30" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-6 mt-10 pt-8 border-t border-gray-50">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-gray-50 border border-gray-100" /> Available
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clinicConfig.primaryColor }} /> Selected
                </div>
              </div>
            </Card>
          </div>

          {/* Time Slots Section */}
          <div className="lg:col-span-5">
            <Card className={`p-8 rounded-[3rem] bg-white border-2 transition-all duration-500 overflow-hidden
                ${selectedDate ? 'border-primary shadow-2xl shadow-primary/5' : 'border-dashed border-gray-200 opacity-60'}`}>
              
              <div className="flex items-center gap-3 mb-10">
                <div className="w-12 h-12 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-primary"><Clock size={20} /></div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Available Slots</h2>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                        {selectedDate ? selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Pick a date first'}
                    </p>
                </div>
              </div>

              {selectedDate ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
                  <SlotGrid label="Early Morning" icon={SunMedium} slots={groupedSlots.morning} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
                  <SlotGrid label="Afternoon" icon={Sunset} slots={groupedSlots.afternoon} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
                  <SlotGrid label="Evening" icon={Moon} slots={groupedSlots.evening} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Calendar size={32} />
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-loose">Choose a date on the<br />calendar to see slots</p>
                </div>
              )}

              {selectedDate && selectedSlot && (
                <div className="mt-12 pt-10 border-t border-gray-100 animate-in zoom-in-95 duration-300 text-left">
                  <div className="p-6 bg-gray-50 rounded-[2rem] mb-6 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary"><CheckCircle2 size={18} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Ready to Book</p>
                        <p className="text-sm font-black text-gray-900">{selectedSlot.label} · {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                  </div>
                  <Button fullWidth onClick={handleBooking} loading={loading} className="h-16 rounded-[1.8rem] shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-xs">
                    {loading ? <Loader2 className="animate-spin" /> : 'Confirm & Continue'}
                  </Button>
                </div>
              )}
            </Card>
          </div>

        </div>
      </div>
    </PageWrapper>
  );
}

// Internal Styled Component for Slot Grids
function SlotGrid({ label, icon: Icon, slots, selectedSlot, onSelect }) {
    const available = slots.filter((s) => !s.booked);
    if (available.length === 0) return null;
    return (
      <div className="text-left">
        <div className="flex items-center gap-2 mb-4">
          <Icon size={14} className="text-primary" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
          <div className="h-px flex-1 bg-gray-50" />
        </div>
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <button
              key={slot.id}
              disabled={slot.booked}
              onClick={() => onSelect(slot)}
              className={`py-3 px-5 rounded-[1.2rem] text-xs font-black transition-all border-2
                ${slot.booked
                  ? 'bg-gray-50/50 text-gray-200 border-gray-50 cursor-not-allowed'
                  : selectedSlot?.id === slot.id
                  ? 'text-white border-primary shadow-lg shadow-primary/20 scale-105'
                  : 'bg-white border-gray-100 text-gray-500 hover:border-primary/30 hover:text-primary'}
              `}
              style={selectedSlot?.id === slot.id ? { backgroundColor: clinicConfig.primaryColor } : {}}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>
    );
}
