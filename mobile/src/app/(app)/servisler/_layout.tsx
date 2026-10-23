import { Stack } from 'expo-router';

export default function ServislerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Servisler' }} />
      <Stack.Screen name="yeni" options={{ title: 'Yeni servis' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Servisi düzenle' }} />
      <Stack.Screen name="[id]/duraklar" options={{ title: 'Duraklar' }} />
    </Stack>
  );
}
