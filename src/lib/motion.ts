export const motionPresets = {
  fadeUp: {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.35, ease: "easeOut" },
  },
  stagger: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
  },
};
