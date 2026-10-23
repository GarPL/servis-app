import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { bugun, gunEkle, okunurTarih } from '../tarih';
import { RENKLER } from '../stiller';

export type Sefer = 'morning' | 'evening';

export function varsayilanSefer(): Sefer {
  return new Date().getHours() < 12 ? 'morning' : 'evening';
}

type Props = {
  sefer: Sefer;
  gun: string;
  onSeferDegisti: (sefer: Sefer) => void;
  onGunDegisti: (gun: string) => void;
};

export default function SeferGunSecici({ sefer, gun, onSeferDegisti, onGunDegisti }: Props) {
  return (
    <>
      <View style={styles.seferler}>
        <Pressable
          style={[styles.chip, sefer === 'morning' && styles.chipSecili]}
          onPress={() => onSeferDegisti('morning')}
        >
          <Text style={[styles.chipYazi, sefer === 'morning' && styles.chipYaziSecili]}>Sabah</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, sefer === 'evening' && styles.chipSecili]}
          onPress={() => onSeferDegisti('evening')}
        >
          <Text style={[styles.chipYazi, sefer === 'evening' && styles.chipYaziSecili]}>Akşam</Text>
        </Pressable>
      </View>

      <View style={styles.gunSecici}>
        <Pressable style={styles.okButon} onPress={() => onGunDegisti(gunEkle(gun, -1))}>
          <Ionicons name="chevron-back" size={24} color={RENKLER.ana} />
        </Pressable>
        <View style={styles.gunOrta}>
          <Text style={styles.gunYazi}>{okunurTarih(gun)}</Text>
          {gun !== bugun() && (
            <Pressable onPress={() => onGunDegisti(bugun())}>
              <Text style={styles.bugunLink}>Bugüne dön</Text>
            </Pressable>
          )}
        </View>
        <Pressable style={styles.okButon} onPress={() => onGunDegisti(gunEkle(gun, 1))}>
          <Ionicons name="chevron-forward" size={24} color={RENKLER.ana} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  seferler: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: RENKLER.beyaz,
    alignItems: 'center',
  },
  chipSecili: {
    backgroundColor: RENKLER.ana,
  },
  chipYazi: {
    fontSize: 15,
    color: RENKLER.ana,
    fontWeight: '600',
  },
  chipYaziSecili: {
    color: RENKLER.beyaz,
  },
  gunSecici: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  okButon: {
    padding: 8,
  },
  gunOrta: {
    alignItems: 'center',
  },
  gunYazi: {
    fontSize: 17,
    fontWeight: '600',
  },
  bugunLink: {
    color: RENKLER.ana,
    fontSize: 13,
    marginTop: 2,
  },
});