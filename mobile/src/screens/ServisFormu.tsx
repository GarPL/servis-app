import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiIstegi } from '../api';
import { Picker } from '@react-native-picker/picker';
import { ortak, RENKLER } from '../stiller';

const SAATLER: string[] = [];
for (let saat = 0; saat < 24; saat++) {
  for (let dakika = 0; dakika < 60; dakika += 5) {
    SAATLER.push(`${String(saat).padStart(2, '0')}:${String(dakika).padStart(2, '0')}`);
  }
}

type Sofor = {
  id: number;
  full_name: string;
  service_id: number | null;
  service_name: string | null;
};

type ServisDetayi = {
  name: string;
  plate: string;
  make_model: string | null;
  capacity: number;
  morning_departure: string;
  evening_departure: string;
  driver_id: number | null;
};

type Props = {
  token: string;
  servisId: number | null;
  onTamamlandi: () => void;
  onDuraklar?: () => void;
};

export default function ServisFormu({ token, servisId, onTamamlandi, onDuraklar }: Props) {
  const [ad, setAd] = useState('');
  const [plaka, setPlaka] = useState('');
  const [markaModel, setMarkaModel] = useState('');
  const [kapasite, setKapasite] = useState('');
  const [sabah, setSabah] = useState('');
  const [aksam, setAksam] = useState('');
  const [soforId, setSoforId] = useState<number | null>(null);

  const [soforler, setSoforler] = useState<Sofor[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [silOnayi, setSilOnayi] = useState(false);
  const [hata, setHata] = useState('');

  useEffect(() => {
    async function verileriGetir() {
      const soforSonuc = await apiIstegi<Sofor[]>('/users/drivers', token);

      if (!soforSonuc.ok) {
        setHata(soforSonuc.hata);
        setYukleniyor(false);
        return;
      }
      setSoforler(soforSonuc.veri);

      if (servisId !== null) {
        const sonuc = await apiIstegi<ServisDetayi>(`/services/${servisId}`, token);

        if (!sonuc.ok) {
          setHata(sonuc.hata);
          setYukleniyor(false);
          return;
        }

        const servis = sonuc.veri;
        setAd(servis.name);
        setPlaka(servis.plate);
        setMarkaModel(servis.make_model ?? '');
        setKapasite(String(servis.capacity));
        setSabah(servis.morning_departure.slice(0, 5));
        setAksam(servis.evening_departure.slice(0, 5));
        setSoforId(servis.driver_id);
      }

      setYukleniyor(false);
    }
    verileriGetir();
  }, [token, servisId]);

  async function kaydet() {
    setHata('');
    setKaydediliyor(true);

    const sonuc = await apiIstegi(
      servisId === null ? '/services' : `/services/${servisId}`,
      token,
      {
        method: servisId === null ? 'POST' : 'PUT',
        govde: {
          name: ad,
          plate: plaka,
          make_model: markaModel,
          capacity: Number(kapasite),
          morning_departure: sabah,
          evening_departure: aksam,
          driver_id: soforId,
        },
      }
    );
    setKaydediliyor(false);

    if (!sonuc.ok) {
      setHata(sonuc.hata);
      return;
    }
    onTamamlandi();
  }

  async function sil() {
    setHata('');
    setKaydediliyor(true);
    const sonuc = await apiIstegi(`/services/${servisId}`, token, { method: 'DELETE' });
    setKaydediliyor(false);

    if (!sonuc.ok) {
      setHata(sonuc.hata);
      setSilOnayi(false);
      return;
    }
    onTamamlandi();
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
      <Text style={styles.etiket}>Servis adı</Text>
      <TextInput
        style={styles.input}
        value={ad}
        onChangeText={setAd}
        placeholder="Örn. Kadıköy Servisi"
      />

      <Text style={styles.etiket}>Plaka</Text>
      <TextInput
        style={styles.input}
        value={plaka}
        onChangeText={(yazi) => setPlaka(yazi.toUpperCase())}
        placeholder="34 ABC 123"
        autoCapitalize="characters"
      />

      <Text style={styles.etiket}>Marka-model (isteğe bağlı)</Text>
      <TextInput
        style={styles.input}
        value={markaModel}
        onChangeText={setMarkaModel}
        placeholder="Örn. Ford Transit"
      />

      <Text style={styles.etiket}>Kapasite</Text>
      <TextInput
        style={styles.input}
        value={kapasite}
        onChangeText={setKapasite}
        placeholder="16"
        keyboardType="number-pad"
      />

      <View style={styles.satir}>
        <View style={styles.yarim}>
          <Text style={styles.etiket}>Sabah kalkış</Text>
          <View style={styles.pickerKutu}>
            <Picker
              style={styles.picker}
              selectedValue={sabah}
              onValueChange={(deger) => setSabah(deger)}
            >
              <Picker.Item label="Seçin" value="" />
              {SAATLER.map((s) => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.yarim}>
          <Text style={styles.etiket}>Akşam kalkış</Text>
          <View style={styles.pickerKutu}>
            <Picker
              style={styles.picker}
              selectedValue={aksam}
              onValueChange={(deger) => setAksam(deger)}
            >
              <Picker.Item label="Seçin" value="" />
              {SAATLER.map((s) => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <Text style={styles.etiket}>Şoför</Text>
      <View style={styles.chipler}>
        <Pressable
          style={[styles.chip, soforId === null && styles.chipSecili]}
          onPress={() => setSoforId(null)}
        >
          <Text style={[styles.chipYazi, soforId === null && styles.chipYaziSecili]}>
            Şoför yok
          </Text>
        </Pressable>

        {soforler.map((sofor) => {
          const baskaServiste = sofor.service_id !== null && sofor.service_id !== servisId;
          const secili = soforId === sofor.id;

          return (
            <Pressable
              key={sofor.id}
              style={[styles.chip, secili && styles.chipSecili, baskaServiste && styles.chipPasif]}
              onPress={() => setSoforId(sofor.id)}
              disabled={baskaServiste}
            >
              <Text style={[styles.chipYazi, secili && styles.chipYaziSecili]}>
                {sofor.full_name}
              </Text>
              {baskaServiste && <Text style={styles.chipAlt}>{sofor.service_name}</Text>}
            </Pressable>
          );
        })}
      </View>

      {hata !== '' && <Text style={styles.hata}>{hata}</Text>}

      <Pressable style={styles.buton} onPress={kaydet} disabled={kaydediliyor}>
        <Text style={styles.butonYazi}>{kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}</Text>
      </Pressable>

      {onDuraklar !== undefined && (
        <Pressable style={styles.duraklarButon} onPress={onDuraklar}>
          <Text style={styles.duraklarYazi}>Durakları yönet →</Text>
        </Pressable>
      )}

      {servisId !== null &&
        (silOnayi ? (
          <View style={styles.onayKutusu}>
            <Text style={styles.onayYazi}>
              Bu servis silinirse durakları, duyuruları ve seferleri de silinir. Bu duraklardaki
              çalışanlar servissiz kalır. Emin misin?
            </Text>
            <View style={styles.satir}>
              <Pressable
                style={[styles.onayButon, styles.vazgec]}
                onPress={() => setSilOnayi(false)}
              >
                <Text>Vazgeç</Text>
              </Pressable>
              <Pressable
                style={[styles.onayButon, styles.evetSil]}
                onPress={sil}
                disabled={kaydediliyor}
              >
                <Text style={styles.butonYazi}>Evet, sil</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.silButon} onPress={() => setSilOnayi(true)}>
            <Text style={styles.silYazi}>Servisi sil</Text>
          </Pressable>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  icerik: {
    padding: 16,
    paddingBottom: 40,
  },
  etiket: {
    fontSize: 14,
    color: RENKLER.yaziIkincil,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: RENKLER.beyaz,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  pickerKutu: {
    backgroundColor: RENKLER.beyaz,
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },

  satir: {
    flexDirection: 'row',
    gap: 12,
  },
  yarim: {
    flex: 1,
  },
  chipler: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: RENKLER.beyaz,
    borderWidth: 1,
    borderColor: '#ccd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSecili: {
    backgroundColor: RENKLER.ana,
    borderColor: RENKLER.ana,
  },
  chipPasif: {
    opacity: 0.4,
  },
  chipYazi: {
    color: RENKLER.yazi,
  },
  chipYaziSecili: {
    color: RENKLER.beyaz,
    fontWeight: '600',
  },
  chipAlt: {
    fontSize: 11,
    color: '#777',
  },
  hata: {
    color: RENKLER.hata,
    marginTop: 16,
  },
  buton: {
    backgroundColor: RENKLER.ana,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  butonYazi: {
    color: RENKLER.beyaz,
    fontSize: 16,
    fontWeight: '600',
  },
  silButon: {
    marginTop: 16,
    padding: 14,
    alignItems: 'center',
  },
  silYazi: {
    color: RENKLER.hata,
    fontWeight: '600',
  },
  onayKutusu: {
    marginTop: 16,
    backgroundColor: RENKLER.hataAcik,
    padding: 16,
    borderRadius: 10,
  },
  onayYazi: {
    color: RENKLER.hataKoyu,
    marginBottom: 12,
  },
  onayButon: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  vazgec: {
    backgroundColor: RENKLER.beyaz,
  },
  evetSil: {
    backgroundColor: RENKLER.hata,
  },
  duraklarButon: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: RENKLER.beyaz,
    borderWidth: 1,
    borderColor: RENKLER.ana,
  },
  duraklarYazi: {
    color: RENKLER.ana,
    fontSize: 16,
    fontWeight: '600',
  },
});
