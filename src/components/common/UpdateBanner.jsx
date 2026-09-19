import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VERSION = 'v2';

export default function UpdateBanner(){
  const [open,setOpen] = useState(false);
  useEffect(()=>{
    const dismissed = localStorage.getItem('osis-update-dismissed');
    if(dismissed !== VERSION) setOpen(true);
  },[]);
  const dismiss = ()=>{
    localStorage.setItem('osis-update-dismissed', VERSION);
    setOpen(false);
  };
  const refresh = ()=> window.location.reload();
  return <AnimatePresence>
    {open && <motion.div key="update-banner" initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="fixed bottom-6 left-6 z-[999] w-[340px] rounded-2xl border border-white/10 bg-slate-900/90 p-5 text-white shadow-2xl backdrop-blur-xl">
      <h3 className="font-bold">Versi Baru Tersedia</h3>
      <p className="mt-1 text-sm text-slate-300">Perbarui agar fitur terbaru langsung aktif.</p>
      <div className="mt-4 flex gap-2"><button onClick={refresh} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold">Perbarui</button><button onClick={dismiss} className="rounded-xl bg-white/10 px-4 py-3 font-semibold">Nanti</button></div>
    </motion.div>}
  </AnimatePresence>
}
