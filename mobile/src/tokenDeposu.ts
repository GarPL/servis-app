import * as SecureStore from 'expo-secure-store';

const ANAHTAR = 'token';

export function tokeniOku(): Promise<string | null> {
    return SecureStore.getItemAsync(ANAHTAR);
}

export function tokeniKaydet(token: string): Promise<void> {
    return SecureStore.setItemAsync(ANAHTAR, token);
}

export function tokeniSil(): Promise<void> {
    return SecureStore.deleteItemAsync(ANAHTAR);
}