import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { apiIstegi } from '../api';
import { ortak, RENKLER } from '../stiller';

type ServisOzeti = {
  id: number;
  name: string;
  plate: string;
  capacity: number;
  morning_departure: string;
  evening_departure: string;
  driver_name: string | null;
};

type Props = {
  token: string;
  onYeni: () => void;
  onSec: (id: number) => void;
};

export default function ServisListesiEkrani({ token, onYeni, onSec }: Props) {
  const [servisler, setServisler] = useState<ServisOzeti[]>([]);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);

  const servisleriGetir = useCallback(async () => {
    const sonuc = await apiIstegi<ServisOzeti[]>('/services', token);

    if (sonuc.ok) {
      setHata('');
      setServisler(sonuc.veri);
    } else {
      setHata(sonuc.hata);
    }
    setYukleniyor(false);
    setYenileniyor(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      servisleriGetir();
    }, [servisleriGetir])
  );

  function yenile() {
    setYenileniyor(true);
    servisleriGetir();
  }

  if (yukleniyor) {
    return (
      <View style={ortak.ortala}>
        <ActivityIndicator size="large" color={RENKLER.ana} />
      </View>
    );
  }

  return (
    <FlatList
      style={ortak.ekran}
      contentContainerStyle={ortak.icerik}
      data={servisler}
      keyExtractor={(servis) => String(servis.id)}
      refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} />}
      ListHeaderComponent={
        <>
          {hata !== '' && <Text style={styles.hata}>{hata}</Text>}
          <Pressable style={styles.yeniButon} onPress={onYeni}>
            <Text style={styles.yeniButonYazi}>+ Yeni servis</Text>
          </Pressable>
        </>
      }
      ListEmptyComponent={<Text style={styles.bos}>Henüz servis yok.</Text>}
      renderItem={({ item }) => (
        <Pressable style={ortak.kart} onPress={() => onSec(item.id)}>
          <Text style={styles.servisAdi}>{item.name}</Text>
          <Text style={styles.plaka}>
            {item.plate} · {item.capacity} kişilik
          </Text>
          <Text style={styles.ikincil}>
            Sabah {item.morning_departure.slice(0, 5)} · Akşam {item.evening_departure.slice(0, 5)}
          </Text>
          <Text style={styles.ikincil}>Şoför: {item.driver_name ?? 'Atanmadı'}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  hata: {
    color: RENKLER.hata,
    marginBottom: 12,
  },
  yeniButon: {
    backgroundColor: RENKLER.ana,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  yeniButonYazi: {
    color: RENKLER.beyaz,
    fontSize: 16,
    fontWeight: '600',
  },
  bos: {
    textAlign: 'center',
    color: RENKLER.yaziIkincil,
    marginTop: 24,
  },
  servisAdi: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  plaka: {
    fontSize: 15,
    fontWeight: '600',
    color: RENKLER.ana,
    marginTop: 4,
  },
  ikincil: {
    fontSize: 14,
    color: RENKLER.yaziIkincil,
    marginTop: 4,
  },
});
