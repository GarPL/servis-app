const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function tarihiYaziyaCevir(tarih: Date): string {
  const yil = tarih.getFullYear();
  const ay = String(tarih.getMonth() + 1).padStart(2, '0');
  const gun = String(tarih.getDate()).padStart(2, '0');
  return `${yil}-${ay}-${gun}`;
}

export function bugun(): string {
  return tarihiYaziyaCevir(new Date());
}

export function okunurTarih(tarih: string): string {
  const [yil, ay, gun] = tarih.split('-').map(Number);
  const nesne = new Date(yil, ay - 1, gun);
  return `${gun} ${AYLAR[ay - 1]} ${GUNLER[nesne.getDay()]}`;
}

export function gunEkle(tarih: string, gunSayisi: number): string {
  const [yil, ay, gun] = tarih.split('-').map(Number);
  return tarihiYaziyaCevir(new Date(yil, ay - 1, gun + gunSayisi));
}
export function okunurZaman(zaman: string): string {
  const tarih = new Date(zaman);
  const saat = String(tarih.getHours()).padStart(2, '0');
  const dakika = String(tarih.getMinutes()).padStart(2, '0');
  return `${tarih.getDate()} ${AYLAR[tarih.getMonth()]}, ${saat}:${dakika}`;
}