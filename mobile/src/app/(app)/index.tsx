import { Redirect } from 'expo-router';
import { useOturum } from '../../oturum';

export default function Yonlendir() {
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  if (oturum.user.role === 'admin') {
    return <Redirect href="/servisler" />;
  }

  if (oturum.user.role === 'driver') {
    return <Redirect href="/yolcular" />;
  }

  return <Redirect href="/servisim" />;
}
