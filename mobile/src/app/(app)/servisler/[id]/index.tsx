import { router, useLocalSearchParams } from 'expo-router';
import ServisFormu from '../../../../screens/ServisFormu';
import { useOturum } from '../../../../oturum';

export default function ServisDuzenleRotasi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return (
    <ServisFormu
      token={oturum.token}
      servisId={Number(id)}
      onTamamlandi={() => router.back()}
      onDuraklar={() => router.push(`/servisler/${id}/duraklar`)}
    />
  );
}
