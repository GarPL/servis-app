import { server } from "./app";

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});