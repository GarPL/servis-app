import { router } from 'expo-router';
import KullaniciFormu from '../../../screens/KullaniciFormu';
import { useOturum } from '../../../oturum';

export default function YeniKullaniciRotasi() {
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return (
    <KullaniciFormu
      token={oturum.token}
      kullaniciId={null}
      onTamamlandi={() => router.back()}
    />
  );
}
