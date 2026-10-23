import AsyncStorage from "@react-native-async-storage/async-storage";

const ANAHTAR = 'token';

export function tokeniOku(): Promise<string | null> {
    return AsyncStorage.getItem(ANAHTAR);
}

export function tokeniKaydet(token: string): Promise<void> {
    return AsyncStorage.setItem(ANAHTAR, token);
}

export function tokeniSil(): Promise<void> {
    return AsyncStorage.removeItem(ANAHTAR);
}