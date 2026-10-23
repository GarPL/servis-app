import { useState} from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { apiIstegi, Oturum } from "../api";
import { RENKLER } from '../stiller';


type Props = {
    onGirisBasarili: (oturum:Oturum) => void;
};

export default function GirisEkrani({ onGirisBasarili }: Props) {
    const [email, setEmail] = useState('');
    const [sifre, setSifre] = useState('');
    const [hata, setHata] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);

    async function girisYap() {
        setHata('');
        setYukleniyor(true);
        const sonuc = await apiIstegi<Oturum>('/login', null, {
            method: 'POST',
            govde: { email: email, password: sifre },
        });
        setYukleniyor(false);

        if (!sonuc.ok) {
            setHata(sonuc.hata);
            return;
        }
        onGirisBasarili(sonuc.veri);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.baslik}>servis-app</Text>

            <TextInput
                style={styles.input}
                placeholder="E-posta"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                style={styles.input}
                placeholder="Şifre"
                value={sifre}
                onChangeText={setSifre}
                secureTextEntry
            />

            {hata !== '' && <Text style={styles.hata}>{hata}</Text>}

            <Pressable style={styles.buton} onPress={girisYap} disabled={yukleniyor}>
                <Text style={styles.butonYazi}>
                    {yukleniyor ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
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
});