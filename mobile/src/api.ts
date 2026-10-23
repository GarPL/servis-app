import Constants from 'expo-constants';
import { Platform } from 'react-native';

function sunucuAdresi(): string {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }
  const bilgisayar = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${bilgisayar ?? 'localhost'}:3000`;
}

export const API_URL = sunucuAdresi();

export type Kullanici = {
    id: number;
    full_name: string;
    role: 'admin' | 'driver' | 'employee';
    must_change_password: boolean;
};

export type Oturum = {
    token: string;
    user: Kullanici;
};

export type Rol = 'admin' | 'driver' | 'employee';

export const ROL_ADLARI: Record<Rol, string> = {
  admin: 'Yönetici',
  driver: 'Şoför',
  employee: 'Çalışan',
};

export type ApiSonucu<T> = { ok: true; veri: T } | { ok: false; hata: string };

type IstekSecenekleri = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  govde?: object;
};

export async function apiIstegi<T>(
  adres: string,
  token: string | null,
  secenekler: IstekSecenekleri = {}
): Promise<ApiSonucu<T>> {
  const basliklar: Record<string, string> = {};

  if (token !== null) {
    basliklar.Authorization = `Bearer ${token}`;
  }

  if (secenekler.govde !== undefined) {
    basliklar['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${adres}`, {
      method: secenekler.method ?? 'GET',
      headers: basliklar,
      body: secenekler.govde === undefined ? undefined : JSON.stringify(secenekler.govde),
    });
  } catch {
    return { ok: false, hata: 'Sunucuya bağlanılamadı' };
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    return { ok: false, hata: `Sunucudan beklenmeyen bir cevap geldi (${response.status})` };
  }

  if (!response.ok) {
    return { ok: false, hata: data.error ?? 'Bir hata oluştu' };
  }

  return { ok: true, veri: data as T };
}
