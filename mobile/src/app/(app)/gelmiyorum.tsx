import GelmiyorumEkrani from '../../screens/GelmiyorumEkrani';
import { useOturum } from '../../oturum';

export default function Gelmiyorum() {
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  return <GelmiyorumEkrani token={oturum.token} />;
}
