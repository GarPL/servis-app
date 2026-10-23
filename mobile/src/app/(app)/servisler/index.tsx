import { router } from 'expo-router';
import ServisListesiEkrani from '../../../screens/ServisListesiEkrani';
import { useOturum } from '../../../oturum';

export default function ServislerRotasi() {
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return (
    <ServisListesiEkrani
      token={oturum.token}
      onYeni={() => router.push('/servisler/yeni')}
      onSec={(id) => router.push(`/servisler/${id}`)}
    />
  );
}