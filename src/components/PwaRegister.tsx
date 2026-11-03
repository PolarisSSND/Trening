'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('PWA Service Worker úspešne zaregistrovaný so scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Registrácia Service Workera zlyhala:', error);
          });
      });
    }
  }, []);

  return null;
}
