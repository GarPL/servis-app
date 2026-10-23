import { router } from 'expo-router';
import ServisFormu from '../../../screens/ServisFormu';
import { useOturum } from '../../../oturum';

export default function YeniServisRotasi() {
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return (
    <ServisFormu
      token={oturum.token}
      servisId={null}
      onTamamlandi={() => router.back()}
    />
  );
}
