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
import { useFocusEffect } from 'expo-router';
import { apiIstegi } from '../api';
import { okunurZaman } from '../tarih';
import { ortak, RENKLER } from '../stiller';

type Duyuru = {
  id: number;
  message: string;
  created_at: string;
  service_id: number | null;
  service_name: string | null;
  author_name: string | null;
};

type ServisOzeti = {
  id: number;
  name: string;
};

type Props = {
  token: string;
  yonetici: boolean;
};

export default function DuyurularEkrani({ token, yonetici }: Props) {
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [servisler, setServisler] = useState<ServisOzeti[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState('');

  const [formAcik, setFormAcik] = useState(false);
  const [secilenServis, setSecilenServis] = useState<number | null>(null);
  const [mesaj, setMesaj] = useState('');
  const [silinecek, setSilinecek] = useState<number | null>(null);

  const duyurulariGetir = useCallback(async () => {
    const sonuc = await apiIstegi<Duyuru[]>('/announcements', token);

    if (sonuc.ok) {
      setHata('');
      setDuyurular(sonuc.veri);
    } else {
      setHata(sonuc.hata);
    }
    setYukleniyor(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      duyurulariGetir();
    }, [duyurulariGetir])
  );

  useEffect(() => {
    if (!yonetici) {
      return;
    }

    async function servisleriGetir() {
      const sonuc = await apiIstegi<ServisOzeti[]>('/services', token);

      if (sonuc.ok) {
        setServisler(sonuc.veri);
      } else {
        setHata(sonuc.hata);
      }
    }
    servisleriGetir();
  }, [token, yonetici]);

  async function istekGonder(
    adres: string,
    method: 'POST' | 'DELETE',
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

  async function yayinla() {
    const basarili = await istekGonder('/announcements', 'POST', {
      service_id: secilenServis,
      message: mesaj,
    });

    if (basarili) {
      setMesaj('');
      setSecilenServis(null);
      setFormAcik(false);
      duyurulariGetir();
    }
  }

  async function sil(id: number) {
    if (await istekGonder(`/announcements/${id}`, 'DELETE')) {
      setSilinecek(null);
      duyurulariGetir();
    }
  }

  if (yukleniyor) {
    return (
      <View style={ortak.ortala}>
        <ActivityIndicator size="large" color={RENKLER.ana} />
      </View>
    );
  }

  const yayinlanabilir = !islemde && mesaj.trim() !== '';

  return (
    <ScrollView style={ortak.ekran} contentContainerStyle={ortak.icerik}>
      {hata !== '' && <Text style={styles.hata}>{hata}</Text>}

      {yonetici &&
        (formAcik ? (
          <View style={styles.form}>
            <Text style={styles.formBaslik}>Yeni duyuru</Text>

            <View style={styles.chipler}>
              <Pressable
                style={[styles.chip, secilenServis === null && styles.chipSecili]}
                onPress={() => setSecilenServis(null)}
              >
                <Text style={[styles.chipYazi, secilenServis === null && styles.chipYaziSecili]}>
                  Tüm servisler
                </Text>
              </Pressable>
              {servisler.map((servis) => {
                const secili = secilenServis === servis.id;
                return (
                  <Pressable
                    key={servis.id}
                    style={[styles.chip, secili && styles.chipSecili]}
                    onPress={() => setSecilenServis(servis.id)}
                  >
                    <Text style={[styles.chipYazi, secili && styles.chipYaziSecili]}>
                      {servis.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              style={styles.metinKutusu}
              value={mesaj}
              onChangeText={setMesaj}
              placeholder="Duyuru metni"
              multiline
              maxLength={1000}
            />
            <Text style={styles.sayac}>{mesaj.length} / 1000</Text>

            <View style={styles.butonSatiri}>
              <Pressable style={[styles.buton, styles.beyaz]} onPress={() => setFormAcik(false)}>
                <Text>Vazgeç</Text>
              </Pressable>
              <Pressable
                style={[styles.buton, styles.mavi, !yayinlanabilir && styles.pasif]}
                onPress={yayinla}
                disabled={!yayinlanabilir}
              >
                <Text style={styles.beyazYazi}>Yayınla</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.yeniButon} onPress={() => setFormAcik(true)}>
            <Text style={styles.yeniButonYazi}>+ Yeni duyuru</Text>
          </Pressable>
        ))}

      {duyurular.length === 0 ? (
        <Text style={styles.bos}>Son 30 günde duyuru yok.</Text>
      ) : (
        duyurular.map((duyuru) => (
          <View key={duyuru.id} style={ortak.kart}>
            <View style={styles.kartUst}>
              <Text style={styles.zaman}>{okunurZaman(duyuru.created_at)}</Text>
              <Text style={[styles.etiket, duyuru.service_id === null && styles.etiketGenel]}>
                {duyuru.service_name ?? 'Tüm servisler'}
              </Text>
            </View>

            <Text style={styles.mesaj}>{duyuru.message}</Text>

            {duyuru.author_name !== null && (
              <Text style={styles.yazar}>— {duyuru.author_name}</Text>
            )}

            {yonetici &&
              (silinecek === duyuru.id ? (
                <View style={styles.onayKutusu}>
                  <Text style={styles.onayYazi}>Bu duyuruyu silmek istediğine emin misin?</Text>
                  <View style={styles.butonSatiri}>
                    <Pressable style={[styles.buton, styles.beyaz]} onPress={() => setSilinecek(null)}>
                      <Text>Vazgeç</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.buton, styles.kirmizi]}
                      onPress={() => sil(duyuru.id)}
                      disabled={islemde}
                    >
                      <Text style={styles.beyazYazi}>Evet, sil</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.silLink} onPress={() => setSilinecek(duyuru.id)}>
                  <Text style={styles.silYazi}>Sil</Text>
                </Pressable>
              ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hata: {
    color: RENKLER.hata,
    textAlign: 'center',
    marginBottom: 12,
  },
  yeniButon: {
    backgroundColor: RENKLER.ana,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  yeniButonYazi: {
    color: RENKLER.beyaz,
    fontWeight: '600',
    fontSize: 16,
  },
  form: {
    backgroundColor: RENKLER.beyaz,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  formBaslik: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chipler: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: RENKLER.anaAcik,
  },
  chipSecili: {
    backgroundColor: RENKLER.ana,
  },
  chipYazi: {
    color: RENKLER.ana,
    fontWeight: '600',
  },
  chipYaziSecili: {
    color: RENKLER.beyaz,
  },
  metinKutusu: {
    borderWidth: 1,
    borderColor: RENKLER.kenarlik,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  sayac: {
    alignSelf: 'flex-end',
    color: RENKLER.yaziSoluk,
    fontSize: 12,
    marginTop: 4,
  },
  butonSatiri: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  buton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  beyaz: {
    backgroundColor: RENKLER.beyaz,
    borderWidth: 1,
    borderColor: RENKLER.kenarlik,
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
  beyazYazi: {
    color: RENKLER.beyaz,
    fontWeight: '600',
  },
  bos: {
    color: RENKLER.yaziSoluk,
    textAlign: 'center',
    marginTop: 24,
  },
  kartUst: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zaman: {
    color: RENKLER.yaziSoluk,
    fontSize: 13,
  },
  etiket: {
    fontSize: 12,
    fontWeight: '600',
    color: RENKLER.ana,
    backgroundColor: RENKLER.anaAcik,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  etiketGenel: {
    color: '#e65100',
    backgroundColor: '#fff3e0',
  },
  mesaj: {
    fontSize: 16,
    lineHeight: 22,
  },
  yazar: {
    color: RENKLER.yaziSoluk,
    fontSize: 13,
    marginTop: 8,
  },
  silLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  silYazi: {
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
    marginBottom: 4,
  },
});
