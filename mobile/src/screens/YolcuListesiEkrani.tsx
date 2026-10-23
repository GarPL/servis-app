import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { apiIstegi } from '../api';
import { bugun } from '../tarih';
import SeferGunSecici, { Sefer, varsayilanSefer } from '../components/SeferGunSecici';
import SeferKarti from '../components/SeferKarti';
import { ortak, RENKLER } from '../stiller';

type Yolcu = {
  id: number;
  full_name: string;
  phone: string | null;
  absent: boolean;
};

type Durak = {
  id: number;
  name: string;
  address: string;
  passengers: Yolcu[];
};

type YolcuListesi = {
  service: { name: string; plate: string; departure: string };
  date: string;
  trip_type: Sefer;
  total: number;
  absent_count: number;
  stops: Durak[];
};

type Props = {
  token: string;
};

export default function YolcuListesiEkrani({ token }: Props) {
  const [gun, setGun] = useState(bugun());
  const [sefer, setSefer] = useState<Sefer>(varsayilanSefer());
  const [liste, setListe] = useState<YolcuListesi | null>(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;

      async function listeyiGetir() {
        const sonuc = await apiIstegi<YolcuListesi>(`/my-passengers?trip=${sefer}&date=${gun}`, token);

        if (iptal) {
          return;
        }

        if (sonuc.ok) {
          setHata('');
          setListe(sonuc.veri);
        } else {
          setHata(sonuc.hata);
          setListe(null);
        }
        setYukleniyor(false);
      }

      listeyiGetir();

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
      <SeferKarti token={token} sefer={sefer} />
      <SeferGunSecici
        sefer={sefer}
        gun={gun}
        onSeferDegisti={setSefer}
        onGunDegisti={setGun}
      />
      {liste === null ? (
        <Text style={styles.hata}>{hata}</Text>
      ) : (
        <>
          <View style={ortak.kart}>
            <Text style={styles.servisAdi}>{liste.service.name}</Text>
            <Text style={styles.plaka}>
              {liste.service.plate} · Kalkış {liste.service.departure.slice(0, 5)}
            </Text>
            <Text style={styles.ozet}>
              {liste.total - liste.absent_count} / {liste.total} yolcu gelecek
            </Text>
            {liste.absent_count > 0 && (
              <Text style={styles.gelmeyenOzet}>{liste.absent_count} kişi gelmiyor</Text>
            )}
          </View>

          {liste.stops.map((durak, sira) => (
            <View key={durak.id} style={ortak.kart}>
              <View style={styles.durakBaslik}>
                <Text style={styles.siraNo}>{sira + 1}</Text>
                <View style={styles.durakBilgi}>
                  <Text style={styles.durakAdi}>{durak.name}</Text>
                  <Text style={styles.adres}>{durak.address}</Text>
                </View>
              </View>

              {durak.passengers.length === 0 ? (
                <Text style={styles.bos}>Bu durakta yolcu yok</Text>
              ) : (
                durak.passengers.map((yolcu) => (
                  <View key={yolcu.id} style={styles.yolcuSatir}>
                    <Text style={[styles.yolcuAdi, yolcu.absent && styles.yolcuAdiGelmiyor]}>
                      {yolcu.full_name}
                    </Text>
                    {yolcu.absent ? (
                      <Text style={styles.gelmiyorEtiket}>Gelmiyor</Text>
                    ) : (
                      yolcu.phone !== null && (
                        <Pressable onPress={() => Linking.openURL(`tel:${yolcu.phone}`)}>
                          <Ionicons name="call" size={20} color={RENKLER.ana} />
                        </Pressable>
                      )
                    )}
                  </View>
                ))
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
  servisAdi: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  plaka: {
    fontSize: 15,
    color: RENKLER.ana,
    fontWeight: '600',
    marginTop: 4,
  },
  ozet: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  gelmeyenOzet: {
    fontSize: 14,
    color: RENKLER.hata,
    marginTop: 2,
  },
  durakBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  siraNo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RENKLER.ana,
    color: RENKLER.beyaz,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
    marginRight: 12,
  },
  durakBilgi: {
    flex: 1,
  },
  durakAdi: {
    fontSize: 17,
    fontWeight: '600',
  },
  adres: {
    fontSize: 13,
    color: '#666',
  },
  bos: {
    color: RENKLER.yaziSoluk,
    fontStyle: 'italic',
    marginLeft: 40,
  },
  yolcuSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginLeft: 40,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  yolcuAdi: {
    fontSize: 16,
  },
  yolcuAdiGelmiyor: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  gelmiyorEtiket: {
    fontSize: 12,
    fontWeight: 'bold',
    color: RENKLER.hata,
    backgroundColor: RENKLER.hataAcik,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
});