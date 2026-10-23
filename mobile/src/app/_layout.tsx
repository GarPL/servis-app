import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { OturumProvider, useOturum } from '../oturum';

export default function RootLayout() {
  return (
    <OturumProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </OturumProvider>
  );
}

function RootNavigator() {
  const { oturum, hazir } = useOturum();

  if (!hazir) {
    return null;
  }

  const girisYapilmis = oturum !== null;
  const sifreDegismeli = oturum !== null && oturum.user.must_change_password;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!girisYapilmis}>
        <Stack.Screen name="giris" />
      </Stack.Protected>

      <Stack.Protected guard={sifreDegismeli}>
        <Stack.Screen name="sifre-degistir" />
      </Stack.Protected>

      <Stack.Protected guard={girisYapilmis && !sifreDegismeli}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
