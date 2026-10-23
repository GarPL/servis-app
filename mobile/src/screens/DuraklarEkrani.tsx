import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { apiIstegi } from '../api';
import { ortak, RENKLER } from '../stiller';

type Durak = {
  id: number;
  name: string;
  order_no: number;
  address: string;
  employee_count: number;
};

type Props = {
  token: string;
  servisId: number;
};

export default function DuraklarEkrani({ token, servisId }: Props) {
  const [duraklar, setDuraklar] = useState<Durak[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState('');

  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<Durak | null>(null);
  const [formAd, setFormAd] = useState('');
  const [formAdres, setFormAdres] = useState('');

  const [silinecek, setSilinecek] = useState<Durak | null>(null);

  const duraklariGetir = useCallback(async () => {
    const sonuc = await apiIstegi<Durak[]>(`/services/${servisId}/stops`, token);

    if (sonuc.ok) {
      setDuraklar(sonuc.veri);
    } else {
      setHata(sonuc.hata);
    }
    setYukleniyor(false);
  }, [token, servisId]);

  useEffect(() => {
    duraklariGetir();
  }, [duraklariGetir]);

  async function istekGonder(
    adres: string,
    method: 'POST' | 'PUT' | 'DELETE',
    govde?: object
  ): Promise<boolean> {
    setHata('');
    setIslemde(true);
    const sonuc = await apiIstegi(adres, token, { method, govde });
    setIslemde(false);

    if (!sonuc.ok) {
      setHata(sonuc.hata);
    }
    return sonuc.ok;
  }

  function formuAc(durak: Durak | null) {
    setDuzenlenen(durak);
    setFormAd(durak === null ? '' : durak.name);
    setFormAdres(durak === null ? '' : durak.address);
    setSilinecek(null);
    setFormAcik(true);
  }

  async function kaydet() {
    const govde = { name: formAd, address: formAdres };

    const basarili =
      duzenlenen === null
        ? await istekGonder(`/services/${servisId}/stops`, 'POST', govde)
        : await istekGonder(`/stops/${duzenlenen.id}`, 'PUT', govde);

    if (basarili) {
      setFormAcik(false);
      duraklariGetir();
    }
  }

  async function tasi(durak: Durak, yon: 'up' | 'down') {
    if (await istekGonder(`/stops/${durak.id}/move`, 'POST', { direction: yon })) {
      duraklariGetir();
    }
  }

  async function sil(durak: Durak) {
    if (await istekGonder(`/stops/${durak.id}`, 'DELETE')) {
      setSilinecek(null);
      duraklariGetir();
    }
  }

  if (yukleniyor) {
    return (
      <View style={ortak.ortala}>
        <ActivityIndicator size="large" color={RENKLER.ana} />
      </View>
    );
  }

  return (
    <ScrollView
      style={ortak.ekran}
      contentContainerStyle={styles.icerik}
      keyboardShouldPersistTaps="handled"
    >
      {hata !== '' && <Text style={styles.hata}>{hata}</Text>}

      {duraklar.length === 0 && <Text style={styles.bos}>Bu serviste henüz durak yok.</Text>}

      {duraklar.map((durak, sira) => {
        const ilk = sira === 0;
        const son = sira === duraklar.length - 1;
        const silinecekMi = silinecek !== null && silinecek.id === durak.id;

        return (
          <View key={durak.id} style={styles.kart}>
            <View style={styles.satir}>
              <View style={styles.numara}>
                <Text style={styles.numaraYazi}>{sira + 1}</Text>
              </View>

              <View style={styles.bilgi}>
                <Text style={styles.durakAdi}>{durak.name}</Text>
                <Text style={styles.ikincil}>{durak.address}</Text>
                <Text style={styles.ikincil}>{durak.employee_count} çalışan</Text>
              </View>

              <View>
                <Pressable
                  style={styles.ok}
                  onPress={() => tasi(durak, 'up')}
                  disabled={ilk || islemde}
                >
                  <Ionicons name="arrow-up" size={20} color={ilk ? RENKLER.kenarlik : RENKLER.ana} />
                </Pressable>
                <Pressable
                  style={styles.ok}
                  onPress={() => tasi(durak, 'down')}
                  disabled={son || islemde}
                >
                  <Ionicons name="arrow-down" size={20} color={son ? RENKLER.kenarlik : RENKLER.ana} />
                </Pressable>
              </View>
            </View>

            {silinecekMi ? (
              <View style={styles.onayKutusu}>
                <Text style={styles.onayYazi}>
                  {durak.employee_count > 0
                    ? `Bu durakta ${durak.employee_count} çalışan var. Silinirse servissiz kalacaklar. `
                    : ''}
                  Durağı silmek istediğine emin misin?
                </Text>
                <View style={styles.butonSatiri}>
                  <Pressable
                    style={[styles.kucukButon, styles.beyaz]}
                    onPress={() => setSilinecek(null)}
                  >
                    <Text>Vazgeç</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.kucukButon, styles.kirmizi]}
                    onPress={() => sil(durak)}
                    disabled={islemde}
                  >
                    <Text style={styles.beyazYazi}>Evet, sil</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.linkSatiri}>
                <Pressable onPress={() => formuAc(durak)}>
                  <Text style={styles.link}>Düzenle</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setFormAcik(false);
                    setSilinecek(durak);
                  }}
                >
                  <Text style={styles.silLink}>Sil</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}

      {formAcik ? (
        <View style={styles.kart}>
          <Text style={styles.formBaslik}>
            {duzenlenen === null ? 'Yeni durak' : 'Durağı düzenle'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Durak adı"
            value={formAd}
            onChangeText={setFormAd}
          />
          <TextInput
            style={styles.input}
            placeholder="Adres"
            value={formAdres}
            onChangeText={setFormAdres}
          />
          <View style={styles.butonSatiri}>
            <Pressable
              style={[styles.kucukButon, styles.beyaz]}
              onPress={() => setFormAcik(false)}
            >
              <Text>Vazgeç</Text>
            </Pressable>
            <Pressable
              style={[styles.kucukButon, styles.mavi]}
              onPress={kaydet}
              disabled={islemde}
            >
              <Text style={styles.beyazYazi}>{islemde ? 'Kaydediliyor...' : 'Kaydet'}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.yeniButon} onPress={() => formuAc(null)}>
          <Text style={styles.beyazYazi}>+ Yeni durak</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  icerik: {
    padding: 16,
    paddingBottom: 40,
  },
  hata: {
    color: RENKLER.hata,
    marginBottom: 12,
  },
  bos: {
    textAlign: 'center',
    color: RENKLER.yaziIkincil,
    marginVertical: 24,
  },
  kart: {
    backgroundColor: RENKLER.beyaz,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numara: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RENKLER.ana,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numaraYazi: {
    color: RENKLER.beyaz,
    fontWeight: 'bold',
  },
  bilgi: {
    flex: 1,
  },
  durakAdi: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ikincil: {
    fontSize: 13,
    color: RENKLER.yaziIkincil,
    marginTop: 2,
  },
  ok: {
    padding: 4,
  },
  linkSatiri: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  link: {
    color: RENKLER.ana,
    fontWeight: '600',
  },
  silLink: {
    color: RENKLER.hata,
    fontWeight: '600',
  },
  onayKutusu: {
    marginTop: 10,
    backgroundColor: RENKLER.hataAcik,
    padding: 12,
    borderRadius: 8,
  },
  onayYazi: {
    color: RENKLER.hataKoyu,
    marginBottom: 10,
  },
  butonSatiri: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  kucukButon: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  beyaz: {
    backgroundColor: RENKLER.beyaz,
    borderWidth: 1,
    borderColor: '#ccd',
  },
  kirmizi: {
    backgroundColor: RENKLER.hata,
  },
  mavi: {
    backgroundColor: RENKLER.ana,
  },
  beyazYazi: {
    color: RENKLER.beyaz,
    fontWeight: '600',
  },
  formBaslik: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f3f6fb',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 8,
  },
  yeniButon: {
    backgroundColor: RENKLER.ana,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
});
