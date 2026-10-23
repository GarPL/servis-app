import KatilimEkrani from '../../screens/KatilimEkrani';
import { useOturum } from '../../oturum';

export default function Katilim() {
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return <KatilimEkrani token={oturum.token} />;
}
