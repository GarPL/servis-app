import SifreDegistirEkrani from '../screens/SifreDegistirEkrani';
import { useOturum } from '../oturum';

export default function SifreDegistirRotasi() {
  const { oturum, sifreDegistirildi, cikisYap } = useOturum();

  if (oturum === null) {
    return null;
  }

  return (
    <SifreDegistirEkrani
      token={oturum.token}
      onTamamlandi={sifreDegistirildi}
      onCikis={cikisYap}
    />
  );
}
