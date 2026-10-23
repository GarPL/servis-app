import ProfilEkrani from '../../screens/ProfilEkrani';
import { useOturum } from '../../oturum';

export default function Profil() {
  const { oturum, cikisYap } = useOturum();

  if (oturum === null) {
    return null;
  }

  return <ProfilEkrani kullanici={oturum.user} onCikis={cikisYap} />;
}