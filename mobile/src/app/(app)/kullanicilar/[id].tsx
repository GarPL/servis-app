import { router, useLocalSearchParams } from 'expo-router';
import KullaniciFormu from '../../../screens/KullaniciFormu';
import { useOturum } from '../../../oturum';

export default function KullaniciDuzenleRotasi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return (
    <KullaniciFormu
      token={oturum.token}
      kullaniciId={Number(id)}
      onTamamlandi={() => router.back()}
    />
  );
}
