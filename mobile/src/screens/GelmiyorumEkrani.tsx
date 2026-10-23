import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { apiIstegi } from '../api';
import { bugun, okunurTarih } from '../tarih';
import { ortak, RENKLER } from '../stiller';

LocaleConfig.locales['tr'] = {
  monthNames: [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ],
  monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün',
};
LocaleConfig.defaultLocale = 'tr';

type Bildirim = {
  id: number;
  date: string;
  trip_type: 'morning' | 'evening';
};

type Props = {
  token: string;
};

export default function GelmiyorumEkrani({ token }: Props) {
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [secilenGunler, setSecilenGunler] = useState<string[]>([]);
  const [sabah, setSabah] = useState(true);
  const [aksam, setAksam] = useState(true);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState('');
  const [bilgi, setBilgi] = useState('');

  const bildirimleriGetir = useCallback(async () => {
    const sonuc = await apiIstegi<Bildirim[]>('/my-absences', token);

    if (sonuc.ok) {
      setBildirimler(sonuc.veri);
    } else {
      setHata(sonuc.hata);
    }
    setYukleniyor(false);
  }, [token]);

  useEffect(() => {
    bildirimleriGetir();
  }, [bildirimleriGetir]);

  function gunuSecVeyaKaldir(tarih: string) {
    setBilgi('');
    if (secilenGunler.includes(tarih)) {
      setSecilenGunler(secilenGunler.filter((g) => g !== tarih));
    } else {
      setSecilenGunler([...secilenGunler, tarih]);
    }
  }

  async function gonder() {
    const seferler: string[] = [];
    if (sabah) seferler.push('morning');
    if (aksam) seferler.push('evening');

    setHata('');
    setBilgi('');
    setIslemde(true);
    const sonuc = await apiIstegi('/my-absences', token, {
      method: 'POST',
      govde: { dates: secilenGunler, trip_types: seferler },
    });
    setIslemde(false);

    if (!sonuc.ok) {
      setHata(sonuc.hata);
      return;
    }

    setSecilenGunler([]);
    setBilgi('Bildirimin kaydedildi. Şoförün listesinde görünecek.');
    bildirimleriGetir();
  }

  async function geriAl(bildirim: Bildirim) {
    setHata('');
    setBilgi('');
    const sonuc = await apiIstegi(`/my-absences/${bildirim.id}`, token, { method: 'DELETE' });

    if (!sonuc.ok) {
      setHata(sonuc.hata);
      return;
    }
    bildirimleriGetir();
  }

  const isaretliGunler: Record<string, object> = {};
  for (const b of bildirimler) {
    isaretliGunler[b.date] = { marked: true, dotColor: RENKLER.hata };
  }
  for (const g of secilenGunler) {
    isaretliGunler[g] = { ...isaretliGunler[g], selected: true, selectedColor: RENKLER.ana };
  }

  if (yukleniyor) {
    return (
      <View style={ortak.ortala}>
        <ActivityIndicator size="large" color={RENKLER.ana} />
      </View>
    );
  }

  return (
    <ScrollView style={ortak.ekran} contentContainerStyle={styles.icerik}>
      <Text style={styles.aciklama}>
        Gelmeyeceğin günlere dokun. Kırmızı noktalı günler için zaten bildirim yapmışsın.
      </Text>

      <View style={styles.kart}>
        <Calendar
          minDate={bugun()}
          firstDay={1}
          onDayPress={(gun) => gunuSecVeyaKaldir(gun.dateString)}
          markedDates={isaretliGunler}
          theme={{
            todayTextColor: RENKLER.ana,
            arrowColor: RENKLER.ana,
            textDisabledColor: RENKLER.kenarlik,
          }}
        />
      </View>

      <Text style={styles.etiket}>Hangi seferler?</Text>
      <View style={styles.chipler}>
        <Pressable style={[styles.chip, sabah && styles.chipSecili]} onPress={() => setSabah(!sabah)}>
          <Text style={[styles.chipYazi, sabah && styles.chipYaziSecili]}>Sabah</Text>
        </Pressable>
        <Pressable style={[styles.chip, aksam && styles.chipSecili]} onPress={() => setAksam(!aksam)}>
          <Text style={[styles.chipYazi, aksam && styles.chipYaziSecili]}>Akşam</Text>
        </Pressable>
      </View>

      {hata !== '' && <Text style={styles.hata}>{hata}</Text>}
      {bilgi !== '' && <Text style={styles.bilgi}>{bilgi}</Text>}

      <Pressable
        style={[styles.buton, (secilenGunler.length === 0 || islemde) && styles.butonPasif]}
        onPress={gonder}
        disabled={secilenGunler.length === 0 || islemde}
      >
        <Text style={styles.butonYazi}>
          {secilenGunler.length === 0
            ? 'Önce gün seç'
            : `${secilenGunler.length} gün için bildir`}
        </Text>
      </Pressable>

      <Text style={styles.bolumBaslik}>Bildirimlerim</Text>
      {bildirimler.length === 0 ? (
        <Text style={styles.bos}>Yaklaşan bir bildirimin yok.</Text>
      ) : (
        bildirimler.map((b) => (
          <View key={b.id} style={styles.bildirim}>
            <Text style={styles.bildirimYazi}>
              {okunurTarih(b.date)} · {b.trip_type === 'morning' ? 'Sabah' : 'Akşam'}
            </Text>
            <Pressable onPress={() => geriAl(b)}>
              <Text style={styles.geriAl}>Geri al</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  icerik: {
    padding: 16,
    paddingBottom: 40,
  },
  aciklama: {
    color: RENKLER.yaziIkincil,
    marginBottom: 12,
  },
  kart: {
    backgroundColor: RENKLER.beyaz,
    borderRadius: 12,
    padding: 8,
    overflow: 'hidden',
  },
  etiket: {
    fontSize: 14,
    color: RENKLER.yaziIkincil,
    marginTop: 16,
    marginBottom: 8,
  },
  chipler: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: RENKLER.beyaz,
    borderWidth: 1,
    borderColor: '#ccd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  chipSecili: {
    backgroundColor: RENKLER.ana,
    borderColor: RENKLER.ana,
  },
  chipYazi: {
    color: RENKLER.yazi,
  },
  chipYaziSecili: {
    color: RENKLER.beyaz,
    fontWeight: '600',
  },
  hata: {
    color: RENKLER.hata,
    marginTop: 12,
  },
  bilgi: {
    color: RENKLER.basari,
    marginTop: 12,
  },
  buton: {
    backgroundColor: RENKLER.ana,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  butonPasif: {
    backgroundColor: '#9bbcf0',
  },
  butonYazi: {
    color: RENKLER.beyaz,
    fontSize: 16,
    fontWeight: '600',
  },
  bolumBaslik: {
    fontSize: 13,
    color: RENKLER.yaziSoluk,
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 8,
  },
  bos: {
    color: RENKLER.yaziIkincil,
  },
  bildirim: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: RENKLER.beyaz,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  bildirimYazi: {
    fontSize: 15,
    flex: 1,
  },
  geriAl: {
    color: RENKLER.hata,
    fontWeight: '600',
  },
});