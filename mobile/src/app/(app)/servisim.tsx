import ServisimEkrani from '../../screens/ServisimEkrani';
import { useOturum } from '../../oturum';

export default function Servisim() {
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return <ServisimEkrani token={oturum.token} />;
}
