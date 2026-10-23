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
import { apiIstegi, Rol, ROL_ADLARI } from '../api';
import { ortak, RENKLER } from '../stiller';

type Secenek = {
  id: number;
  name: string;
};

type KullaniciDetayi = {
  full_name: string;
  email: string;
  phone: string | null;
  role: Rol;
  service_id: number | null;
  stop_id: number | null;
};

type Props = {
  token: string;
  kullaniciId: number | null;
  onTamamlandi: () => void;
};

const ROLLER: Rol[] = ['employee', 'driver', 'admin'];

export default function KullaniciFormu({ token, kullaniciId, onTamamlandi }: Props) {
  const yeniKayit = kullaniciId === null;

  const [ad, setAd] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [rol, setRol] = useState<Rol>('employee');
  const [sifre, setSifre] = useState('');
  const [servisId, setServisId] = useState<number | null>(null);
  const [durakId, setDurakId] = useState<number | null>(null);

  const [servisler, setServisler] = useState<Secenek[]>([]);
  const [duraklar, setDuraklar] = useState<Secenek[]>([]);

  const [yeniSifre, setYeniSifre] = useState('');
  const [bilgi, setBilgi] = useState('');

  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemde, setIslemde] = useState(false);
  const [silOnayi, setSilOnayi] = useState(false);
  const [hata, setHata] = useState('');

  useEffect(() => {
    async function verileriGetir() {
      const servisSonuc = await apiIstegi<Secenek[]>('/services', token);

      if (!servisSonuc.ok) {
        setHata(servisSonuc.hata);
        setYukleniyor(false);
        return;
      }
      setServisler(servisSonuc.veri);

      if (kullaniciId !== null) {
        const sonuc = await apiIstegi<KullaniciDetayi>(`/users/${kullaniciId}`, token);

        if (!sonuc.ok) {
          setHata(sonuc.hata);
          setYukleniyor(false);
          return;
        }

        const kullanici = sonuc.veri;
        setAd(kullanici.full_name);
        setEmail(kullanici.email);
        setTelefon(kullanici.phone ?? '');
        setRol(kullanici.role);
        setServisId(kullanici.service_id);
        setDurakId(kullanici.stop_id);
      }

      setYukleniyor(false);
    }
    verileriGetir();
  }, [token, kullaniciId]);

  useEffect(() => {
    if (servisId === null) {
      setDuraklar([]);
      return;
    }

    async function duraklariGetir() {
      const sonuc = await apiIstegi<Secenek[]>(`/services/${servisId}/stops`, token);

      if (sonuc.ok) {
        setDuraklar(sonuc.veri);
      } else {
        setHata(sonuc.hata);
      }
    }
    duraklariGetir();
  }, [token, servisId]);

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

  function servisSec(id: number) {
    setServisId(id);
    setDurakId(null);
  }

  async function kaydet() {
    const ortak = {
      full_name: ad,
      email: email,
      phone: telefon,
      stop_id: rol === 'employee' ? durakId : null,
    };

    const basarili = yeniKayit
      ? await istekGonder('/users', 'POST', { ...ortak, role: rol, password: sifre })
      : await istekGonder(`/users/${kullaniciId}`, 'PUT', ortak);

    if (basarili) {
      onTamamlandi();
    }
  }

  async function sifreSifirla() {
    setBilgi('');

    if (await istekGonder(`/users/${kullaniciId}/reset-password`, 'POST', { password: yeniSifre })) {
      setYeniSifre('');
      setBilgi('Şifre sıfırlandı. Kullanıcı bir sonraki girişinde kendi şifresini belirleyecek.');
    }
  }

  async function sil() {
    if (await istekGonder(`/users/${kullaniciId}`, 'DELETE')) {
      onTamamlandi();
    } else {
      setSilOnayi(false);
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
      <Text style={styles.etiket}>Ad soyad</Text>
      <TextInput style={styles.input} value={ad} onChangeText={setAd} placeholder="Örn. Ayşe Yılmaz" />

      <Text style={styles.etiket}>E-posta</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="ornek@sirket.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.etiket}>Telefon (isteğe bağlı)</Text>
      <TextInput
        style={styles.input}
        value={telefon}
        onChangeText={setTelefon}
        placeholder="0532 000 00 00"
        keyboardType="phone-pad"
      />

      <Text style={styles.etiket}>Rol</Text>
      {yeniKayit ? (
        <View style={styles.chipler}>
          {ROLLER.map((r) => (
            <Pressable
              key={r}
              style={[styles.chip, rol === r && styles.chipSecili]}
              onPress={() => setRol(r)}
            >
              <Text style={[styles.chipYazi, rol === r && styles.chipYaziSecili]}>
                {ROL_ADLARI[r]}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.sabitDeger}>{ROL_ADLARI[rol]} (değiştirilemez)</Text>
      )}

      {yeniKayit && (
        <>
          <Text style={styles.etiket}>Geçici şifre</Text>
          <TextInput
            style={styles.input}
            value={sifre}
            onChangeText={setSifre}
            placeholder="Kullanıcıya ileteceğin şifre"
            autoCapitalize="none"
          />
        </>
      )}

      {rol === 'employee' && (
        <>
          <Text style={styles.etiket}>Servis</Text>
          <View style={styles.chipler}>
            {servisler.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.chip, servisId === s.id && styles.chipSecili]}
                onPress={() => servisSec(s.id)}
              >
                <Text style={[styles.chipYazi, servisId === s.id && styles.chipYaziSecili]}>
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.etiket}>Durak</Text>
          {servisId === null ? (
            <Text style={styles.ipucu}>Önce bir servis seç.</Text>
          ) : duraklar.length === 0 ? (
            <Text style={styles.ipucu}>Bu serviste henüz durak yok.</Text>
          ) : (
            <View style={styles.chipler}>
              {duraklar.map((d) => (
                <Pressable
                  key={d.id}
                  style={[styles.chip, durakId === d.id && styles.chipSecili]}
                  onPress={() => setDurakId(d.id)}
                >
                  <Text style={[styles.chipYazi, durakId === d.id && styles.chipYaziSecili]}>
                    {d.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      {rol === 'driver' && (
        <Text style={styles.ipucu}>Şoförün süreceği servis, Servisler ekranından atanır.</Text>
      )}

      {hata !== '' && <Text style={styles.hata}>{hata}</Text>}

      <Pressable style={styles.buton} onPress={kaydet} disabled={islemde}>
        <Text style={styles.butonYazi}>{islemde ? 'Kaydediliyor...' : 'Kaydet'}</Text>
      </Pressable>

      {!yeniKayit && (
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Şifre sıfırla</Text>
          <TextInput
            style={styles.input}
            value={yeniSifre}
            onChangeText={setYeniSifre}
            placeholder="Yeni geçici şifre"
            autoCapitalize="none"
          />
          {bilgi !== '' && <Text style={styles.bilgi}>{bilgi}</Text>}
          <Pressable style={styles.ikincilButon} onPress={sifreSifirla} disabled={islemde}>
            <Text style={styles.ikincilButonYazi}>Şifreyi sıfırla</Text>
          </Pressable>
        </View>
      )}

      {!yeniKayit &&
        (silOnayi ? (
          <View style={styles.onayKutusu}>
            <Text style={styles.onayYazi}>
              Bu kullanıcı silinecek. Şoförse sürdüğü servis şoförsüz kalır. Emin misin?
            </Text>
            <View style={styles.satir}>
              <Pressable style={[styles.onayButon, styles.vazgec]} onPress={() => setSilOnayi(false)}>
                <Text>Vazgeç</Text>
              </Pressable>
              <Pressable
                style={[styles.onayButon, styles.evetSil]}
                onPress={sil}
                disabled={islemde}
              >
                <Text style={styles.butonYazi}>Evet, sil</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.silButon} onPress={() => setSilOnayi(true)}>
            <Text style={styles.silYazi}>Kullanıcıyı sil</Text>
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
  sabitDeger: {
    fontSize: 16,
    color: RENKLER.yazi,
    paddingVertical: 4,
  },
  ipucu: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
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
  chipYazi: {
    color: RENKLER.yazi,
  },
  chipYaziSecili: {
    color: RENKLER.beyaz,
    fontWeight: '600',
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
  bolum: {
    marginTop: 28,
    backgroundColor: RENKLER.beyaz,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  bolumBaslik: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bilgi: {
    color: RENKLER.basari,
  },
  ikincilButon: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RENKLER.ana,
  },
  ikincilButonYazi: {
    color: RENKLER.ana,
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
  satir: {
    flexDirection: 'row',
    gap: 12,
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
});