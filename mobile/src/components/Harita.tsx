import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { HaritaProps } from '../canliKonum';

const SAYFA = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html, body, #harita { height: 100%; margin: 0; }</style>
</head>
<body>
  <div id="harita"></div>
  <script>
    var harita = L.map('harita').setView([41.02, 29.05], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(harita);

    var simge = L.divIcon({
      html: '<div style="font-size: 28px; line-height: 32px;">🚌</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    var isaretler = {};
    var oncekiSayi = 0;

    function guncelle(noktalar) {
      var gelenler = {};

      noktalar.forEach(function (n) {
        gelenler[n.id] = true;
        if (isaretler[n.id]) {
          isaretler[n.id].setLatLng([n.lat, n.lng]);
          isaretler[n.id].setTooltipContent(n.etiket);
        } else {
          isaretler[n.id] = L.marker([n.lat, n.lng], { icon: simge })
            .bindTooltip(n.etiket, { direction: 'top', offset: [0, -14], permanent: true })
            .addTo(harita);
        }
      });

      Object.keys(isaretler).forEach(function (id) {
        if (!gelenler[id]) {
          harita.removeLayer(isaretler[id]);
          delete isaretler[id];
        }
      });

      if (noktalar.length !== oncekiSayi) {
        if (noktalar.length === 1) {
          harita.setView([noktalar[0].lat, noktalar[0].lng], 14);
        } else if (noktalar.length > 1) {
          harita.fitBounds(noktalar.map(function (n) { return [n.lat, n.lng]; }), { padding: [40, 40] });
        }
        oncekiSayi = noktalar.length;
      }
    }
  </script>
</body>
</html>`;

export default function Harita({ noktalar, yukseklik }: HaritaProps) {
  const sayfa = useRef<WebView>(null);
  const yuklendi = useRef(false);

  function gonder() {
    sayfa.current?.injectJavaScript(`guncelle(${JSON.stringify(noktalar)}); true;`);
  }

  useEffect(() => {
    if (yuklendi.current) {
      gonder();
    }
  }, [noktalar]);

  return (
    <View style={[styles.kutu, { height: yukseklik }]}>
      <WebView
        ref={sayfa}
        source={{ html: SAYFA }}
        originWhitelist={['*']}
        onLoad={() => {
          yuklendi.current = true;
          gonder();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
