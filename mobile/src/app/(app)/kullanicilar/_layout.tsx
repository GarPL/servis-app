import { Stack } from 'expo-router';

export default function KullanicilarLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Kullanıcılar' }} />
      <Stack.Screen name="yeni" options={{ title: 'Yeni kullanıcı' }} />
      <Stack.Screen name="[id]" options={{ title: 'Kullanıcıyı düzenle' }} />
    </Stack>
  );
}
