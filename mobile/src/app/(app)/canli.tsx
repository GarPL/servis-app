import CanliTakipEkrani from '../../screens/CanliTakipEkrani';
import { useOturum } from '../../oturum';

export default function Canli() {
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return <CanliTakipEkrani token={oturum.token} />;
}
