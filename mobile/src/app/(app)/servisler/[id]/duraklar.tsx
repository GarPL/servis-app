import { useLocalSearchParams } from 'expo-router';
import DuraklarEkrani from '../../../../screens/DuraklarEkrani';
import { useOturum } from '../../../../oturum';

export default function DuraklarRotasi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return <DuraklarEkrani token={oturum.token} servisId={Number(id)} />;
}
