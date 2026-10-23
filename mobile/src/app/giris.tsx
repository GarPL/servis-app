import GirisEkrani from '../screens/GirisEkrani';
import { useOturum } from '../oturum';

export default function GirisRotasi() {
  const { girisYapildi } = useOturum();
  return <GirisEkrani onGirisBasarili={girisYapildi} />;
}
