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
import { apiIstegi, Rol, ROL_ADLARI } from '../api';
import { ortak, RENKLER } from '../stiller';

type KullaniciOzeti = {
  id: number;
  full_name: string;
  email: string;
  role: Rol;
  must_change_password: boolean;
  service_name: string | null;
  stop_name: string | null;
  driven_service_name: string | null;
};

type Props = {
  token: string;
  onYeni: () => void;
  onSec: (id: number) => void;
};

const FILTRELER: { deger: Rol | null; ad: string }[] = [
  { deger: null, ad: 'Hepsi' },
  { deger: 'employee', ad: 'Çalışan' },
  { deger: 'driver', ad: 'Şoför' },
  { deger: 'admin', ad: 'Yönetici' },
];

export default function KullaniciListesiEkrani({ token, onYeni, onSec }: Props) {
  const [kullanicilar, setKullanicilar] = useState<KullaniciOzeti[]>([]);
  const [filtre, setFiltre] = useState<Rol | null>(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);

  const kullanicilariGetir = useCallback(async () => {
    const adres = filtre === null ? '/users' : `/users?role=${filtre}`;
    const sonuc = await apiIstegi<KullaniciOzeti[]>(adres, token);

    if (sonuc.ok) {
      setHata('');
      setKullanicilar(sonuc.veri);
    } else {
      setHata(sonuc.hata);
    }
    setYukleniyor(false);
    setYenileniyor(false);
  }, [token, filtre]);

  useFocusEffect(
    useCallback(() => {
      kullanicilariGetir();
    }, [kullanicilariGetir])
  );

  function yenile() {
    setYenileniyor(true);
    kullanicilariGetir();
  }

  function altBilgi(kullanici: KullaniciOzeti): string {
    if (kullanici.role === 'employee') {
      if (kullanici.service_name === null) {
        return 'Servis atanmadı';
      }
      return `${kullanici.service_name} · ${kullanici.stop_name}`;
    }

    if (kullanici.role === 'driver') {
      return kullanici.driven_service_name ?? 'Servis atanmadı';
    }

    return '';
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
      data={kullanicilar}
      keyExtractor={(kullanici) => String(kullanici.id)}
      refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} />}
      ListHeaderComponent={
        <>
          {hata !== '' && <Text style={styles.hata}>{hata}</Text>}

          <Pressable style={styles.yeniButon} onPress={onYeni}>
            <Text style={styles.yeniButonYazi}>+ Yeni kullanıcı</Text>
          </Pressable>

          <View style={styles.filtreler}>
            {FILTRELER.map((f) => {
              const secili = filtre === f.deger;
              return (
                <Pressable
                  key={f.ad}
                  style={[styles.filtre, secili && styles.filtreSecili]}
                  onPress={() => setFiltre(f.deger)}
                >
                  <Text style={[styles.filtreYazi, secili && styles.filtreYaziSecili]}>{f.ad}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      }
      ListEmptyComponent={<Text style={styles.bos}>Bu filtrede kullanıcı yok.</Text>}
      renderItem={({ item }) => {
        const alt = altBilgi(item);

        return (
          <Pressable style={styles.kart} onPress={() => onSec(item.id)}>
            <View style={styles.ustSatir}>
              <Text style={styles.ad}>{item.full_name}</Text>
              <Text style={styles.rolEtiketi}>{ROL_ADLARI[item.role]}</Text>
            </View>
            <Text style={styles.ikincil}>{item.email}</Text>
            {alt !== '' && <Text style={styles.ikincil}>{alt}</Text>}
            {item.must_change_password && (
              <Text style={styles.uyari}>İlk giriş bekleniyor</Text>
            )}
          </Pressable>
        );
      }}
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
    marginBottom: 12,
  },
  yeniButonYazi: {
    color: RENKLER.beyaz,
    fontSize: 16,
    fontWeight: '600',
  },
  filtreler: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filtre: {
    backgroundColor: RENKLER.beyaz,
    borderWidth: 1,
    borderColor: '#ccd',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  filtreSecili: {
    backgroundColor: RENKLER.ana,
    borderColor: RENKLER.ana,
  },
  filtreYazi: {
    color: RENKLER.yazi,
  },
  filtreYaziSecili: {
    color: RENKLER.beyaz,
    fontWeight: '600',
  },
  bos: {
    textAlign: 'center',
    color: RENKLER.yaziIkincil,
    marginTop: 24,
  },
  kart: {
    backgroundColor: RENKLER.beyaz,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  ustSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ad: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  rolEtiketi: {
    fontSize: 12,
    color: RENKLER.ana,
    backgroundColor: RENKLER.anaAcik,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  ikincil: {
    fontSize: 14,
    color: RENKLER.yaziIkincil,
    marginTop: 4,
  },
  uyari: {
    fontSize: 12,
    color: '#b26a00',
    marginTop: 6,
  },
});
