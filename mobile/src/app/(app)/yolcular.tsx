import YolcuListesiEkrani from '../../screens/YolcuListesiEkrani';
import { useOturum } from '../../oturum';

export default function Yolcular() {
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return <YolcuListesiEkrani token={oturum.token} />;
}
