# Deploy GitHub Pages

Questo progetto e pronto per essere pubblicato come sito statico.

## Contenuto da caricare

Carica nella root del repository questi file:

- `index.html`
- `catalogo.html`
- `auth.html`
- `admin-login.html`
- `ordini.html`
- `app.js`
- `styles.css`
- `zenit-logo-crop.png`
- `.nojekyll`

Se vuoi, puoi includere anche eventuali immagini aggiuntive.

## Passi

1. Crea un repository pubblico su GitHub.
2. Carica tutti i file del progetto nella root del repository.
3. Vai su `Settings > Pages`.
4. In `Build and deployment`, scegli:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` oppure `master`
   - `Folder`: `/ (root)`
5. Salva.
6. Attendi che GitHub Pages pubblichi il sito.

## Risultato

Il sito sara visibile su un URL del tipo:

`https://TUO-USERNAME.github.io/NOME-REPOSITORY/`

## Nota importante

Il sito salva utenti, carrello, ordini, prodotti admin e brand nel `localStorage` del browser.
Quindi:

- i dati restano sul dispositivo/browser che li ha creati
- non c'e un database condiviso online
- l'area admin funziona, ma modifica solo i dati locali del browser in uso

Se vuoi un vero backend condiviso online, il passo successivo e collegare database e autenticazione server-side.
