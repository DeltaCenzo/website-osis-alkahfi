import { useEffect } from 'react';

export default function useLegacyRuntime(){
  useEffect(()=>{
    // Legacy DOM runtime disabled.
    // React components now own the DOM lifecycle.
    document.documentElement.dataset.osisRuntime = 'react-ready';
    return undefined;
  },[]);
}
