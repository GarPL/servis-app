import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { apiIstegi } from '../api';
import { bugun } from '../tarih';
import SeferGunSecici, { Sefer, varsayilanSefer } from '../components/SeferGunSecici';
import { ortak, RENKLER } from '../stiller';

type Gelmeyen = {
  id: number;
  full_name: string;
  stop_name: string;
};

type ServisDurumu = {
  id: number;
  name: string;
  plate: string;
  departure: string;
  total: number;
  absent_count: number;
  absentees: Gelmeyen[];
};

type KatilimOzeti = {
  date: string;
  trip_type: Sefer;
  total: number;
  absent_count: number;
  services: ServisDurumu[];
};

type Props = {
  token: string;
};

export default function KatilimEkrani({ token }: Props) {
  const [gun, setGun] = useState(bugun());
  const [sefer, setSefer] = useState<Sefer>(varsayilanSefer());
  const [ozet, setOzet] = useState<KatilimOzeti | null>(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;

      async function ozetiGetir() {
        const sonuc = await apiIstegi<KatilimOzeti>(`/attendance?trip=${sefer}&date=${gun}`, token);

        if (iptal) {
          return;
        }

        if (sonuc.ok) {
          setHata('');
          setOzet(sonuc.veri);
        } else {
          setHata(sonuc.hata);
          setOzet(null);
        }
        setYukleniyor(false);
      }

      ozetiGetir();

      return () => {
        iptal = true;
      };
    }, [token, sefer, gun])
  );

  if (yukleniyor) {
    return (
      <View style={ortak.ortala}>
        <ActivityIndicator size="large" color={RENKLER.ana} />
      </View>
    );
  }

  return (
    <ScrollView style={ortak.ekran} contentContainerStyle={ortak.icerik}>
      <SeferGunSecici
        sefer={sefer}
        gun={gun}
        onSeferDegisti={setSefer}
        onGunDegisti={setGun}
      />

      {ozet === null ? (
        <Text style={styles.hata}>{hata}</Text>
      ) : (
        <>
          <View style={styles.toplamKart}>
            <Text style={styles.toplamSayi}>
              {ozet.total - ozet.absent_count} / {ozet.total}
            </Text>
            <Text style={styles.toplamYazi}>yolcu gelecek</Text>
          </View>

          {ozet.services.map((servis) => (
            <View key={servis.id} style={ortak.kart}>
              <View style={styles.servisBaslik}>
                <View style={styles.servisBilgi}>
                  <Text style={styles.servisAdi}>{servis.name}</Text>
                  <Text style={styles.ikincil}>
                    {servis.plate} · Kalkış {servis.departure.slice(0, 5)}
                  </Text>
                </View>
                <Text style={[styles.sayi, servis.absent_count > 0 && styles.sayiEksik]}>
                  {servis.total - servis.absent_count} / {servis.total}
                </Text>
              </View>

              {servis.total === 0 ? (
                <Text style={styles.bilgi}>Bu serviste yolcu yok</Text>
              ) : servis.absentees.length === 0 ? (
                <Text style={styles.herkes}>Herkes geliyor</Text>
              ) : (
                <>
                  <Text style={styles.gelmeyenBaslik}>Gelmeyenler</Text>
                  {servis.absentees.map((kisi) => (
                    <Text key={kisi.id} style={styles.gelmeyen}>
                      • {kisi.full_name} <Text style={styles.durak}>({kisi.stop_name})</Text>
                    </Text>
                  ))}
                </>
              )}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hata: {
    color: RENKLER.hata,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  toplamKart: {
    backgroundColor: RENKLER.ana,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  toplamSayi: {
    fontSize: 28,
    fontWeight: 'bold',
    color: RENKLER.beyaz,
  },
  toplamYazi: {
    fontSize: 15,
    color: RENKLER.anaAcik,
  },
  servisBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servisBilgi: {
    flex: 1,
  },
  servisAdi: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ikincil: {
    fontSize: 14,
    color: RENKLER.yaziIkincil,
    marginTop: 2,
  },
  sayi: {
    fontSize: 20,
    fontWeight: 'bold',
    color: RENKLER.basari,
  },
  sayiEksik: {
    color: RENKLER.hata,
  },
  bilgi: {
    color: RENKLER.yaziSoluk,
    fontStyle: 'italic',
    marginTop: 12,
  },
  herkes: {
    color: RENKLER.basari,
    marginTop: 12,
  },
  gelmeyenBaslik: {
    fontSize: 13,
    color: RENKLER.yaziSoluk,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 4,
  },
  gelmeyen: {
    fontSize: 16,
    marginTop: 4,
  },
  durak: {
    color: RENKLER.yaziSoluk,
  },
});
