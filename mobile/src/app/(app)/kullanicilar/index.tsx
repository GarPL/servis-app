import { router } from 'expo-router';
import KullaniciListesiEkrani from '../../../screens/KullaniciListesiEkrani';
import { useOturum } from '../../../oturum';

export default function KullanicilarRotasi() {
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return (
    <KullaniciListesiEkrani
      token={oturum.token}
      onYeni={() => router.push('/kullanicilar/yeni')}
      onSec={(id) => router.push(`/kullanicilar/${id}`)}
    />
  );
}
