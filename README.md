# Bioscoop Planner

Deze repository bevat de broncode voor een simpele React-applicatie waarmee je filmprogramma's kunt plannen. De applicatie gebruikt Firebase voor opslag en authenticatie. 

## Installatie

1. Zorg dat [Node.js](https://nodejs.org/) is geïnstalleerd.
2. Installeer de dependencies:

```bash
npm install
```

3. Start de ontwikkelserver:

```bash
npm run dev
```

De applicatie is daarna bereikbaar op `http://localhost:3000`.

## Builden voor productie

```bash
npm run build
```
Wanneer je de applicatie op GitHub Pages plaatst, zorg dan dat in `vite.config.js` de optie `base: './'` is ingesteld. Hiermee worden de gebuildde assets vanaf het juiste pad geladen en voorkom je een wit scherm.

De geoptimaliseerde bestanden worden geplaatst in de map `dist/`, waarmee je de app bijvoorbeeld op GitHub Pages kunt hosten.

## Configuratie

De applicatie verwacht enkele globale variabelen voor Firebase-configuratie en authenticatie. Als je deze via een bundler of direct in `index.html` definieert, worden ze gebruikt bij het starten van de app:

```html
<script>
  window.__firebase_config = JSON.stringify({
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  });
  window.__app_id = 'mijn-app-id';
  window.__initial_auth_token = null; // optioneel
</script>
```

Zonder deze configuratie kun je Firebase niet gebruiken en zal de app foutmeldingen tonen.

