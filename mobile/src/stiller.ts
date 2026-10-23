import { StyleSheet } from 'react-native';

export const RENKLER = {
  ana: '#1a73e8',
  anaAcik: '#e8f0fe',
  beyaz: '#fff',
  yazi: '#333',
  yaziIkincil: '#555',
  yaziSoluk: '#888',
  kenarlik: '#ccc',
  hata: '#d32f2f',
  hataKoyu: '#b71c1c',
  hataAcik: '#fdecea',
  basari: '#2e7d32',
};

export const ortak = StyleSheet.create({
  ekran: {
    flex: 1,
    backgroundColor: RENKLER.anaAcik,
  },
  ortala: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RENKLER.anaAcik,
  },
  icerik: {
    padding: 16,
  },
  kart: {
    backgroundColor: RENKLER.beyaz,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
});
