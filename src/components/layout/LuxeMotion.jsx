import { motion } from 'framer-motion';

export const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

export const Reveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ 
      duration: 0.8, 
      delay, 
      ease: [0.16, 1, 0.3, 1] 
    }}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({ children, staggerDelay = 0.1 }) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once: true }}
    variants={{
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
  >
    {children}
  </motion.div>
);
