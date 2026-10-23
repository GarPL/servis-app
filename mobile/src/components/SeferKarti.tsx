import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import { API_URL, apiIstegi } from '../api';
import { okunurZaman } from '../tarih';
import { Sefer } from './SeferGunSecici';
import { ortak, RENKLER } from '../stiller';

type AktifSefer = {
  id: number;
  trip_type: Sefer;
  started_at: string;
};

type Nokta = {
  lat: number;
  lng: number;
};

const GONDERIM_ARALIGI = 5000;

const SEFER_ADLARI: Record<Sefer, string> = {
  morning: 'Sabah',
  evening: 'Akşam',
};

type Props = {
  token: string;
  sefer: Sefer;
};

export default function SeferKarti({ token, sefer }: Props) {
  const [aktifSefer, setAktifSefer] = useState<AktifSefer | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState('');
  const [gonderilen, setGonderilen] = useState(0);
  const sonKonum = useRef<Nokta | null>(null);

  useEffect(() => {
    async function seferiGetir() {
      const sonuc = await apiIstegi<{ trip: AktifSefer | null }>('/my-trip', token);

      if (sonuc.ok) {
        setAktifSefer(sonuc.veri.trip);
      } else {
        setHata(sonuc.hata);
      }
      setYukleniyor(false);
    }
    seferiGetir();
  }, [token]);

  useEffect(() => {
    if (aktifSefer === null) {
      return;
    }

    const soket = io(API_URL, { auth: { token } });
    let izleyici: Location.LocationSubscription | null = null;
    let iptal = false;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: GONDERIM_ARALIGI, distanceInterval: 10 },
      (konum) => {
        sonKonum.current = { lat: konum.coords.latitude, lng: konum.coords.longitude };
      }
    )
      .then((abonelik) => {
        if (iptal) {
          abonelik.remove();
        } else {
          izleyici = abonelik;
        }
      })
      .catch(() => setHata('Konum alınamadı'));

    const zamanlayici = setInterval(() => {
      if (sonKonum.current !== null && soket.connected) {
        soket.emit('konum', sonKonum.current);
        setGonderilen((onceki) => onceki + 1);
      }
    }, GONDERIM_ARALIGI);

    return () => {
      iptal = true;
      izleyici?.remove();
      clearInterval(zamanlayici);
      soket.disconnect();
      sonKonum.current = null;
    };
  }, [aktifSefer, token]);

  async function baslat() {
    setHata('');
    setIslemde(true);

    const izin = await Location.requestForegroundPermissionsAsync();

    if (izin.status !== 'granted') {
      setHata('Konum izni verilmedi. Sefer sırasında konum paylaşmak için izin gerekiyor.');
      setIslemde(false);
      return;
    }

    const sonuc = await apiIstegi<{ trip: AktifSefer }>('/my-trip/start', token, {
      method: 'POST',
      govde: { trip_type: sefer },
    });
    setIslemde(false);

    if (!sonuc.ok) {
      setHata(sonuc.hata);
      return;
    }

    setGonderilen(0);
    setAktifSefer(sonuc.veri.trip);
  }

  async function bitir() {
    setHata('');
    setIslemde(true);
    const sonuc = await apiIstegi('/my-trip/end', token, { method: 'POST' });
    setIslemde(false);

    if (!sonuc.ok) {
      setHata(sonuc.hata);
      return;
    }
    setAktifSefer(null);
  }

  if (yukleniyor) {
    return (
      <View style={ortak.kart}>
        <ActivityIndicator color={RENKLER.ana} />
      </View>
    );
  }

  return (
    <View style={[ortak.kart, aktifSefer !== null && styles.kartAktif]}>
      {aktifSefer === null ? (
        <Pressable
          style={[styles.buton, styles.mavi, islemde && styles.pasif]}
          onPress={baslat}
          disabled={islemde}
        >
          <Text style={styles.butonYazi}>{SEFER_ADLARI[sefer]} seferini başlat</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.durumSatiri}>
            <View style={styles.canliNokta} />
            <Text style={styles.durum}>{SEFER_ADLARI[aktifSefer.trip_type]} seferi devam ediyor</Text>
          </View>
          <Text style={styles.bilgi}>Başlama: {okunurZaman(aktifSefer.started_at)}</Text>
          <Text style={styles.bilgi}>Gönderilen konum: {gonderilen}</Text>
          <Pressable
            style={[styles.buton, styles.kirmizi, islemde && styles.pasif]}
            onPress={bitir}
            disabled={islemde}
          >
            <Text style={styles.butonYazi}>Seferi bitir</Text>
          </Pressable>
        </>
      )}

      {hata !== '' && <Text style={styles.hata}>{hata}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  kartAktif: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: RENKLER.basari,
  },
  durumSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  canliNokta: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: RENKLER.basari,
    marginRight: 8,
  },
  durum: {
    fontSize: 17,
    fontWeight: 'bold',
    color: RENKLER.basari,
  },
  bilgi: {
    fontSize: 14,
    color: RENKLER.yaziIkincil,
    marginTop: 2,
  },
  buton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  mavi: {
    backgroundColor: RENKLER.ana,
  },
  kirmizi: {
    backgroundColor: RENKLER.hata,
  },
  pasif: {
    opacity: 0.5,
  },
  butonYazi: {
    color: RENKLER.beyaz,
    fontWeight: 'bold',
    fontSize: 16,
  },
  hata: {
    color: RENKLER.hata,
    marginTop: 8,
  },
});