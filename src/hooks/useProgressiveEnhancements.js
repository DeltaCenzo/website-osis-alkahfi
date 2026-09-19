import { useEffect } from 'react';

function optimizeNode(node){
  if (!(node instanceof Element)) return;

  const images = node.matches('img') ? [node] : node.querySelectorAll('img');
  images.forEach(img => {
    if (!img.closest('[data-hero-cinematic]')) {
      if (!img.hasAttribute('loading')) img.loading = 'lazy';
      if (!img.hasAttribute('decoding')) img.decoding = 'async';
    }
  });

  const links = node.matches('a[href]') ? [node] : node.querySelectorAll('a[href]');
  links.forEach(link => {
    try {
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin && link.target === '_blank') {
        const rel = new Set((link.rel || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        link.rel = [...rel].join(' ');
      }
    } catch (_) {}
  });
}

export default function useProgressiveEnhancements(){
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return undefined;

    optimizeNode(root);

    const observer = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(optimizeNode));
    });
    observer.observe(root, { childList: true, subtree: true });

    const onVisibility = () => {
      document.documentElement.classList.toggle('page-not-visible', document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility, { passive: true });
    onVisibility();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      document.documentElement.classList.remove('page-not-visible');
    };
  }, []);
}
