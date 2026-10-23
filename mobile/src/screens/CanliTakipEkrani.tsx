import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiIstegi } from '../api';
import Harita from '../components/Harita';
import { useCanliKonumlar } from '../canliKonum';
import { okunurZaman } from '../tarih';
import { ortak, RENKLER } from '../stiller';

type ServisOzeti = {
  id: number;
  name: string;
  plate: string;
};

type Props = {
  token: string;
};

export default function CanliTakipEkrani({ token }: Props) {
  const { konumlar, bagli } = useCanliKonumlar(token);
  const [servisler, setServisler] = useState<ServisOzeti[]>([]);
  const [hata, setHata] = useState('');

  useEffect(() => {
    async function servisleriGetir() {
      const sonuc = await apiIstegi<ServisOzeti[]>('/services', token);

      if (sonuc.ok) {
        setServisler(sonuc.veri);
      } else {
        setHata(sonuc.hata);
      }
    }
    servisleriGetir();
  }, [token]);

  function servisAdi(servisId: number): string {
    const servis = servisler.find((s) => s.id === servisId);
    return servis === undefined ? `Servis ${servisId}` : servis.name;
  }

  const noktalar = konumlar.map((konum) => ({
    id: konum.service_id,
    lat: konum.lat,
    lng: konum.lng,
    etiket: servisAdi(konum.service_id),
  }));

  return (
    <ScrollView style={ortak.ekran} contentContainerStyle={ortak.icerik}>
      {hata !== '' && <Text style={styles.hata}>{hata}</Text>}

      <View style={styles.ozetSatiri}>
        <Text style={styles.ozet}>
          Yolda: {konumlar.length} / {servisler.length} servis
        </Text>
        <View style={styles.baglanti}>
          <View style={[styles.nokta, bagli ? styles.noktaYesil : styles.noktaGri]} />
          <Text style={styles.baglantiYazi}>{bagli ? 'Canlı' : 'Bağlanıyor...'}</Text>
        </View>
      </View>

      <Harita noktalar={noktalar} yukseklik={400} />

      {servisler.map((servis) => {
        const konum = konumlar.find((k) => k.service_id === servis.id);
        return (
          <View key={servis.id} style={styles.kart}>
            <View style={styles.kartBilgi}>
              <Text style={styles.servisAdi}>{servis.name}</Text>
              <Text style={styles.ikincil}>{servis.plate}</Text>
            </View>
            {konum === undefined ? (
              <Text style={styles.yoldaDegil}>Yolda değil</Text>
            ) : (
              <View style={styles.yoldaKutu}>
                <Text style={styles.yolda}>Yolda</Text>
                <Text style={styles.saat}>{okunurZaman(konum.at)}</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hata: {
    color: RENKLER.hata,
    textAlign: 'center',
    marginBottom: 12,
  },
  ozetSatiri: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ozet: {
    fontSize: 17,
    fontWeight: '600',
  },
  baglanti: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nokta: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  noktaYesil: {
    backgroundColor: RENKLER.basari,
  },
  noktaGri: {
    backgroundColor: '#999',
  },
  baglantiYazi: {
    color: RENKLER.yaziIkincil,
    fontSize: 13,
  },
  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RENKLER.beyaz,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  kartBilgi: {
    flex: 1,
  },
  servisAdi: {
    fontSize: 16,
    fontWeight: '600',
  },
  ikincil: {
    fontSize: 14,
    color: RENKLER.yaziIkincil,
    marginTop: 2,
  },
  yoldaDegil: {
    color: RENKLER.yaziSoluk,
  },
  yoldaKutu: {
    alignItems: 'flex-end',
  },
  yolda: {
    color: RENKLER.basari,
    fontWeight: 'bold',
  },
  saat: {
    color: RENKLER.yaziSoluk,
    fontSize: 12,
    marginTop: 2,
  },
});
