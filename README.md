# Solar System 3D Pro

Unapređena interaktivna 3D simulacija Sunčevog sistema.

## Šta je novo u odnosu na original

- **Loading screen** sa progress barom
- **Modern HUD** – pauza, brzina 1×/5×/20×, reset kamere, fullscreen
- **Glassmorphism info panel** na srpskom jeziku
- **Ispravljeni bugovi**: Venus bump, WebGL renderer, senke, asteroid animacija
- **InstancedMesh** asteroidi (bolje performanse)
- **Smooth camera** focus sa easing-om
- **Day/night shader** za Zemlju
- **Bolje senke** i soft shadows
- **Hover outline** + cursor pointer
- Nema build koraka – radi preko CDN Three.js

## Pokretanje

Potreban je lokalni server (browser blokira module sa `file://`).

```bash
# Python
python -m http.server 8080

# ili Node
npx serve .
```

Otvori `http://localhost:8080`

## Kontrole

| Akcija | Kako |
|--------|------|
| Rotacija kamere | Prevuci mišem |
| Zum | Skrol |
| Detalji planete | Klik na planetu |
| Pauza | ⏸ dugme |
| Brzina | 1× / 5× / 20× |
| Reset | ⌂ dugme |
