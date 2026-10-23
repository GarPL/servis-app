import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from './api';

export type CanliKonum = {
  service_id: number;
  lat: number;
  lng: number;
  at: string;
};

export type HaritaNoktasi = {
  id: number;
  lat: number;
  lng: number;
  etiket: string;
};

export type HaritaProps = {
  noktalar: HaritaNoktasi[];
  yukseklik: number;
};

export function useCanliKonumlar(token: string) {
  const [konumlar, setKonumlar] = useState<Record<number, CanliKonum>>({});
  const [bagli, setBagli] = useState(false);

  useEffect(() => {
    const soket = io(API_URL, { auth: { token } });

    soket.on('connect', () => setBagli(true));
    soket.on('disconnect', () => setBagli(false));

    soket.on('konumlar', (liste: CanliKonum[]) => {
      const yeni: Record<number, CanliKonum> = {};
      for (const konum of liste) {
        yeni[konum.service_id] = konum;
      }
      setKonumlar(yeni);
    });

    soket.on('konum', (konum: CanliKonum) => {
      setKonumlar((onceki) => ({ ...onceki, [konum.service_id]: konum }));
    });

    soket.on('sefer-bitti', (veri: { service_id: number }) => {
      setKonumlar((onceki) => {
        const yeni = { ...onceki };
        delete yeni[veri.service_id];
        return yeni;
      });
    });

    return () => {
      soket.disconnect();
    };
  }, [token]);

  return { konumlar: Object.values(konumlar), bagli };
}
