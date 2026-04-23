import { motion } from 'framer-motion';

const T = {
  shimmer: 'rgba(255, 255, 255, 0.05)',
  highlight: 'rgba(255, 255, 255, 0.1)',
};

export const Skeleton = ({ width, height, radius = 16, className = "" }) => (
  <motion.div
    animate={{ 
      backgroundColor: [T.shimmer, T.highlight, T.shimmer],
    }}
    transition={{ 
      duration: 1.5, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }}
    style={{ 
      width: width || '100%', 
      height: height || '20px', 
      borderRadius: radius,
      marginBottom: 12
    }}
    className={className}
  />
);

export const ServiceCardSkeleton = () => (
  <div style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
    <Skeleton width="60%" height="24px" />
    <Skeleton width="40%" height="16px" radius={100} />
  </div>
);

export const BookingFormSkeleton = () => (
    <div style={{ display: 'grid', gap: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Skeleton height="64px" radius={18} />
            <Skeleton height="64px" radius={18} />
        </div>
        <Skeleton height="64px" radius={18} />
        <div style={{ marginTop: 20 }}>
            <Skeleton width="120px" height="14px" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <ServiceCardSkeleton />
                <ServiceCardSkeleton />
            </div>
        </div>
        <Skeleton height="72px" radius={20} />
    </div>
);
