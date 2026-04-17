# Deploy Zenit su Railway

Questa configurazione pubblica **frontend + backend insieme** sullo stesso dominio Railway.
In questo modo:

- login admin funziona online
- prodotti e brand restano salvati
- ordini restano salvati
- non serve piu usare GitHub Pages per la parte admin

## 1. Repository GitHub

Usa il repository:

- `https://github.com/Gmar125286/zenit-site.git`

## 2. Crea il progetto Railway

1. Vai su Railway.
2. Crea un nuovo progetto.
3. Scegli **Deploy from GitHub repo**.
4. Seleziona `zenit-site`.

Railway rilevera automaticamente l'app Python.

## 3. Variabili ambiente

Nel servizio web imposta:

- `ZENIT_SECRET_KEY` = una stringa lunga e privata
- `ZENIT_DATABASE_PATH` = `/data/zenit.db`

Facoltative:

- `FLASK_DEBUG` = `0`

## 4. Persistent volume

Per non perdere i prodotti dopo ogni deploy:

1. Apri il servizio web su Railway.
2. Aggiungi un **Volume**.
3. Montalo sul path:
   - `/data`

Il database SQLite verra salvato in:

- `/data/zenit.db`

## 5. Comando di avvio

Il progetto e gia pronto con:

- `Procfile`
- `gunicorn`

Quindi Railway dovrebbe usare automaticamente:

- `web: gunicorn app:app`

## 6. Dominio pubblico

1. Apri il servizio Railway.
2. Vai su **Networking**.
3. Genera un dominio pubblico.

Alla fine il sito sara disponibile su un URL tipo:

- `https://zenit-site-production.up.railway.app`

## 7. Importante

Per usare admin e catalogo online:

- pubblica il sito **da Railway**
- non usare GitHub Pages come sito principale per la parte admin

GitHub Pages puo restare eventualmente solo come vetrina statica, ma l'admin vero deve stare sul deployment Railway.

## 8. Controllo rapido

Dopo il deploy verifica:

- home: `/`
- admin: `/admin-login.html`
- salute backend: `/health`

Se `/health` risponde con `ok: true`, il backend e attivo.
