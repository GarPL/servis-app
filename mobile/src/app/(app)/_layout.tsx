import { Tabs } from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useOturum } from '../../oturum';
import { RENKLER } from '../../stiller';

export default function AppLayout() {
  const { oturum } = useOturum();

  if (oturum === null) {
    return null;
  }

  const rol = oturum.user.role;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: RENKLER.ana }}>
      <Tabs.Screen name="index" options={{ href: null }} />

      <Tabs.Protected guard={rol === 'employee'}>
        <Tabs.Screen
          name="servisim"
          options={{
            title: 'Servisim',
            tabBarIcon: ({ color, size }) => <Ionicons name="bus" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="gelmiyorum"
          options={{
            title: 'Gelmiyorum',
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
          }}
        />
      </Tabs.Protected>

      <Tabs.Protected guard={rol === 'driver'}>
        <Tabs.Screen
          name="yolcular"
          options={{
            title: 'Yolcular',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
          }}
        />
      </Tabs.Protected>

      <Tabs.Protected guard={rol === 'admin'}>
        <Tabs.Screen
          name="servisler"
          options={{
            title: 'Servisler',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="bus" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="kullanicilar"
          options={{
            title: 'Kullanıcılar',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="katilim"
          options={{
            title: 'Katılım',
            tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="canli"
          options={{
            title: 'Canlı',
            tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
          }}
        />
      </Tabs.Protected>

      <Tabs.Screen
        name="duyurular"
        options={{
          title: 'Duyurular',
          tabBarIcon: ({ color, size }) => <Ionicons name="megaphone" color={color} size={size} />,
        }}
      />
      
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>

    
  );
}
