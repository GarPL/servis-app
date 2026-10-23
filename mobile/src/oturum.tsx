import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { API_URL, apiIstegi, Oturum } from './api';
import { tokeniKaydet, tokeniOku, tokeniSil } from './tokenDeposu';

type OturumContextTipi = {
  oturum: Oturum | null;
  hazir: boolean;
  girisYapildi: (yeniOturum: Oturum) => Promise<void>;
  cikisYap: () => Promise<void>;
  sifreDegistirildi: () => void;
};

const OturumContext = createContext<OturumContextTipi | null>(null);

export function OturumProvider({ children }: { children: ReactNode }) {
  const [oturum, setOturum] = useState<Oturum | null>(null);
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    async function kayitliOturumuYukle() {
      const token = await tokeniOku();

      if (token !== null) {
        try {
          const response = await fetch(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const user = await response.json();
            setOturum({ token: token, user: user });
          } else {
            await tokeniSil();
          }
        } catch {
          // Sunucuya ulaşılamadı: giriş ekranı gösterilir
        }
      }

      setHazir(true);
    }
    kayitliOturumuYukle();
  }, []);

  async function girisYapildi(yeniOturum: Oturum) {
    await tokeniKaydet(yeniOturum.token);
    setOturum(yeniOturum);
  }

  async function cikisYap() {
    if (oturum !== null && oturum.user.role === 'driver') {
      await apiIstegi('/my-trip/end', oturum.token, { method: 'POST' });
    }
    await tokeniSil();
    setOturum(null);
  }

  function sifreDegistirildi() {
    if (oturum === null) {
      return;
    }
    setOturum({
      ...oturum,
      user: { ...oturum.user, must_change_password: false },
    });
  }

  return (
    <OturumContext.Provider
      value={{ oturum, hazir, girisYapildi, cikisYap, sifreDegistirildi }}
    >
      {children}
    </OturumContext.Provider>
  );
}

export function useOturum() {
  const deger = useContext(OturumContext);
  if (deger === null) {
    throw new Error('useOturum, OturumProvider içinde kullanılmalı');
  }
  return deger;
}
