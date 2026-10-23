import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiIstegi } from '../api';
import { RENKLER } from '../stiller';

type Props = {
  token: string;
  onTamamlandi: () => void;
  onCikis: () => void;
};

export default function SifreDegistirEkrani({ token, onTamamlandi, onCikis }: Props) {
  const [mevcutSifre, setMevcutSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  async function kaydet() {
    setHata('');

    if (yeniSifre !== yeniSifreTekrar) {
      setHata('Yeni şifreler birbiriyle aynı değil');
      return;
    }

    setYukleniyor(true);
    const sonuc = await apiIstegi('/change-password', token, {
      method: 'POST',
      govde: { currentPassword: mevcutSifre, newPassword: yeniSifre },
    });
    setYukleniyor(false);

    if (!sonuc.ok) {
      setHata(sonuc.hata);
      return;
    }
    onTamamlandi();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.baslik}>Şifreni değiştir</Text>
      <Text style={styles.aciklama}>
        Güvenliğin için ilk girişte geçici şifreni değiştirmen gerekiyor.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Mevcut (geçici) şifre"
        value={mevcutSifre}
        onChangeText={setMevcutSifre}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Yeni şifre"
        value={yeniSifre}
        onChangeText={setYeniSifre}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Yeni şifre (tekrar)"
        value={yeniSifreTekrar}
        onChangeText={setYeniSifreTekrar}
        secureTextEntry
      />

      {hata !== '' && <Text style={styles.hata}>{hata}</Text>}

      <Pressable style={styles.buton} onPress={kaydet} disabled={yukleniyor}>
        <Text style={styles.butonYazi}>
          {yukleniyor ? 'Kaydediliyor...' : 'Şifreyi değiştir'}
        </Text>
      </Pressable>

      <Pressable style={styles.cikis} onPress={onCikis}>
        <Text style={styles.cikisYazi}>Çıkış yap</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: RENKLER.anaAcik,
  },
  baslik: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aciklama: {
    fontSize: 15,
    color: RENKLER.yaziIkincil,
    marginBottom: 24,
  },
  input: {
    backgroundColor: RENKLER.beyaz,
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  hata: {
    color: RENKLER.hata,
    marginBottom: 12,
  },
  buton: {
    backgroundColor: RENKLER.ana,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  butonYazi: {
    color: RENKLER.beyaz,
    fontSize: 16,
    fontWeight: '600',
  },
  cikis: {
    marginTop: 16,
    alignItems: 'center',
  },
  cikisYazi: {
    color: RENKLER.yaziIkincil,
  },
});