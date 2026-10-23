import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Kullanici } from '../api';
import { RENKLER } from '../stiller';

type Props = {
  kullanici: Kullanici;
  onCikis: () => void;
};

export default function ProfilEkrani({ kullanici, onCikis }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.baslik}>Hoş geldin, {kullanici.full_name}</Text>
      <Text style={styles.rol}>Rol: {kullanici.role}</Text>

      <Pressable style={styles.buton} onPress={onCikis}>
        <Text style={styles.butonYazi}>Çıkış yap</Text>
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
  rol: {
    fontSize: 16,
    marginBottom: 32,
  },
  buton: {
    backgroundColor: RENKLER.hata,
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
