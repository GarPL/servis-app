import { server } from "./app";

const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});