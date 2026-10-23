import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiIstegi } from '../api';
import Harita from '../components/Harita';
import { useCanliKonumlar } from '../canliKonum';
import { okunurZaman } from '../tarih';
import { ortak, RENKLER } from '../stiller';

type ServisBilgisi = {
  service_name: string;
  plate: string;
  make_model: string | null;
  morning_departure: string;
  evening_departure: string;
  stop_name: string;
  stop_address: string;
  driver_name: string | null;
  driver_phone: string | null;
};

type Props = {
  token: string;
};

export default function ServisimEkrani({ token }: Props) {
  const [servis, setServis] = useState<ServisBilgisi | null>(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const { konumlar } = useCanliKonumlar(token);
  const servisKonumu = konumlar[0];

  useEffect(() => {
    async function servisiGetir() {
      const sonuc = await apiIstegi<ServisBilgisi>('/my-service', token);

      if (sonuc.ok) {
        setServis(sonuc.veri);
      } else {
        setHata(sonuc.hata);
      }
      setYukleniyor(false);
    }
    servisiGetir();
  }, [token]);

  if (yukleniyor) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={RENKLER.ana} />
      </View>
    );
  }

  if (servis === null) {
    return (
      <View style={styles.ortala}>
        <Text style={styles.hata}>{hata}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={ortak.ekran} contentContainerStyle={ortak.icerik}>
      <View style={ortak.kart}>
        <Text style={styles.servisAdi}>{servis.service_name}</Text>
        <Text style={styles.plaka}>{servis.plate}</Text>
        {servis.make_model !== null && (
          <Text style={styles.ikincil}>{servis.make_model}</Text>
        )}
      </View>
      
      <View style={ortak.kart}>
        <Text style={styles.kartBaslik}>Canlı konum</Text>
        {servisKonumu === undefined ? (
          <Text style={styles.ikincil}>Servisin şu an yolda değil.</Text>
        ) : (
          <>
            <Harita
              noktalar={[
                {
                  id: servisKonumu.service_id,
                  lat: servisKonumu.lat,
                  lng: servisKonumu.lng,
                  etiket: servis.plate,
                },
              ]}
              yukseklik={250}
            />
            <Text style={styles.ikincil}>Son güncelleme: {okunurZaman(servisKonumu.at)}</Text>
          </>
        )}
      </View>


      <View style={ortak.kart}>
        <Text style={styles.kartBaslik}>Kalkış saatleri</Text>
        <View style={styles.satir}>
          <Text style={styles.etiket}>Sabah</Text>
          <Text style={styles.deger}>{servis.morning_departure.slice(0, 5)}</Text>
        </View>
        <View style={styles.satir}>
          <Text style={styles.etiket}>Akşam</Text>
          <Text style={styles.deger}>{servis.evening_departure.slice(0, 5)}</Text>
        </View>
      </View>

      <View style={ortak.kart}>
        <Text style={styles.kartBaslik}>Durağın</Text>
        <Text style={styles.deger}>{servis.stop_name}</Text>
        <Text style={styles.ikincil}>{servis.stop_address}</Text>
      </View>

      <View style={ortak.kart}>
        <Text style={styles.kartBaslik}>Şoför</Text>
        {servis.driver_name === null ? (
          <Text style={styles.ikincil}>Bu servise henüz şoför atanmadı.</Text>
        ) : (
          <>
            <Text style={styles.deger}>{servis.driver_name}</Text>
            {servis.driver_phone !== null && (
              <Pressable
                style={styles.aramaButon}
                onPress={() => Linking.openURL(`tel:${servis.driver_phone}`)}
              >
                <Text style={styles.aramaYazi}>📞 {servis.driver_phone}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ortala: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: RENKLER.anaAcik,
  },
  hata: {
    color: RENKLER.hata,
    fontSize: 16,
    textAlign: 'center',
  },
  servisAdi: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  plaka: {
    fontSize: 16,
    fontWeight: '600',
    color: RENKLER.ana,
    marginTop: 4,
  },
  ikincil: {
    fontSize: 15,
    color: RENKLER.yaziIkincil,
    marginTop: 4,
  },
  kartBaslik: {
    fontSize: 13,
    color: RENKLER.yaziSoluk,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  satir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  etiket: {
    fontSize: 16,
    color: RENKLER.yaziIkincil,
  },
  deger: {
    fontSize: 16,
    fontWeight: '600',
  },
  aramaButon: {
    marginTop: 8,
    backgroundColor: RENKLER.anaAcik,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  aramaYazi: {
    color: RENKLER.ana,
    fontWeight: '600',
  },
});
