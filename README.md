# Gestione contenuti

Questo progetto permette di aggiornare quasi tutto senza toccare la logica principale del sito.

I file che userai piu spesso sono:

1. `treatments.json`
2. `Listino_info.md`
3. `events.json`
4. `site-config.js`

## Flusso consigliato per il listino

Il flusso normale consigliato e questo:

1. aggiorna `Listino_info.md`
2. usa la skill `update-listino-from-markdown`
3. sincronizza `treatments.json`
4. controlla il sito

Questo e il flusso migliore quando stai cambiando struttura, prezzi, note o sottocategorie.

## Eccezione: se modifichi prima `treatments.json`

Se per una volta aggiorni direttamente `treatments.json`, poi devi riallineare `Listino_info.md` al JSON.

In pratica:

1. `treatments.json` diventa la fonte vera
2. `Listino_info.md` va rigenerato o corretto per riflettere esattamente il JSON
3. non devono restare sezioni, prezzi o dettagli vecchi nel markdown

## `site-config.js`

Contiene le impostazioni di Umami e dei temi stagionali.

### Struttura

```js
window.SITE_CONFIG = {
  umamiEnabled: false,
  umamiWebsiteId: "d5955fa0-bba7-43d1-929b-6f62bb11d097",
  theme: {
    mode: "auto",
    showThemePreviewButton: true,
    selectedTheme: "halloween",
    schedule: [
      { theme: "halloween", start: "10-15", end: "11-05" },
      { theme: "newyear", start: "12-31", end: "01-01" },
      { theme: "christmas", start: "12-10", end: "12-30" }
    ]
  }
};
```

### Come usarlo

1. In locale e sul sito di prova: lascia `umamiEnabled: false`
2. Dopo il push di produzione, imposta `umamiEnabled: true` direttamente nel repository `Listino_Prezzi` su GitHub
3. Se non vuoi tracciare nulla: lascia sempre `false`

Con `false`, Umami non viene caricato e non sporca le statistiche.

## Temi stagionali

La configurazione `theme` seleziona lo stile su entrambe le pagine (`home.html` e `index.html`).

- `mode: "auto"`: attiva il tema in base alle date in `schedule`; fuori da tutti gli intervalli usa lo stile normale.
- `mode: "manual"`: usa sempre il valore di `selectedTheme`, utile per provare un tema fuori stagione.
- `mode: "off"`: disattiva i temi stagionali e usa lo stile normale.
- `showThemePreviewButton: true`: mostra il pulsante di anteprima per provare i temi in locale.

Le date sono annuali nel formato `MM-DD`, estremi inclusi. Per aggiungere un periodo, aggiungi una voce a `schedule`; la prima voce che corrisponde ha la precedenza. Per aggiungere un nuovo tema, registra il suo nome e il colore della barra del browser in `theme.js`, poi definisci la palette in `style.css`.

Il pulsante di anteprima passa tra configurazione corrente, tema normale, Halloween, Natale e Capodanno. Prima di caricare la versione su `production`, imposta `showThemePreviewButton: false` in `site-config.js`; il pulsante sparisce e gli eventuali parametri di anteprima nell'URL vengono ignorati.

Con le date impostate in `site-config.js`, Halloween va dal 15 ottobre al 5 novembre, Natale dal 10 al 30 dicembre e Capodanno dal 31 dicembre al 1 gennaio. Se gli intervalli si sovrappongono, ha la precedenza la prima voce di `schedule`. Per provare un tema fuori stagione, usa `mode: "manual"` e scegli `selectedTheme: "halloween"`, `selectedTheme: "christmas"` oppure `selectedTheme: "newyear"`. Per tornare alle date, rimetti `mode: "auto"`.

## Regole generali

1. Usa sempre virgolette doppie `"`.
2. Dopo ogni blocco, se sotto ce n'e un altro, serve la virgola.
3. Non lasciare virgole finali dopo l'ultimo elemento.
4. Se qualcosa non appare sul sito, controlla prima che JSON e percorsi immagini siano corretti.

## Struttura immagini e PDF

Usa questa struttura per tenere in ordine il progetto:

1. `Immagini/Attestati` per attestati e relative anteprime
2. `Immagini/Eventi` per immagini eventi e promozioni
3. `Immagini/Generiche` per logo, foto profilo e immagini varie
4. `Immagini/Trattamenti` per le immagini dei trattamenti

Esempi di percorsi corretti:

1. `Immagini/Eventi/Img_WorkshopArmocromia.png`
2. `Immagini/Generiche/logo.png`
3. `Immagini/Generiche/Img_ChiSono.png`
4. `Immagini/Attestati/Attestato_CactusNailManicure.png`

## `events.json`

Serve per la sezione `Eventi e offerte` della home.

Ogni elemento sta dentro `items` e puo essere di due tipi:

1. `event`
2. `promo`

Ogni elemento ha anche il campo:

1. `active`

Se `active` e `true`, l'elemento compare sul sito.
Se `active` e `false`, l'elemento resta salvato ma non viene mostrato.

### Campi disponibili

1. `type`: `"event"` oppure `"promo"`
2. `active`: `true` oppure `false`
3. `title`: titolo della card
4. `tag`: badge piccolo
5. `caption`: testo descrittivo
6. `price`: testo in evidenza
7. `subtitle`: testo secondario
8. `image`: percorso immagine, facoltativo
9. `imageAlt`: testo alternativo
10. `ctaLabel`: testo del link finale
11. `ctaUrl`: link finale
12. `ctaType`: `"instagram"` oppure `"whatsapp"`

### Esempio evento

```json
{
  "type": "event",
  "active": true,
  "title": "Brinda ai tuoi colori",
  "tag": "Workshop",
  "image": "Immagini/Eventi/Img_WorkshopArmocromia.png",
  "imageAlt": "Workshop Brinda ai tuoi colori",
  "caption": "Workshop di armocromia con prova drappi dal vivo e aperitivo finale.",
  "price": "10 euro",
  "subtitle": "19 aprile | 15:00 - 18:00",
  "ctaLabel": "Per maggiori info vai al post Instagram",
  "ctaUrl": "https://www.instagram.com/p/DWBsohBjKik/",
  "ctaType": "instagram"
}
```

## `treatments.json`

Serve per il listino trattamenti.

La struttura attuale e:

1. `categories`
2. dentro ogni categoria ci sono le `sections`
3. dentro ogni sezione ci sono gli `items`
4. ogni item puo essere:
   - un `treatment`
   - un `group` con dentro altri `treatments`

### Campi categoria

1. `id`: identificativo tecnico, per esempio `"unghie"`
2. `label`: nome visibile del filtro
3. `icon`: icona del filtro
4. `sections`: elenco sezioni

### Campi sezione

1. `title`: titolo sezione
2. `fromPrice`: prezzo da mostrare vicino al titolo, facoltativo
3. `items`: contenuto della sezione
4. `notes`: note finali facoltative

### Item diretto di tipo `treatment`

```json
{
  "type": "treatment",
  "name": "Kombi Manicure",
  "price": 25,
  "duration": "30 min",
  "description": "Descrizione del trattamento.",
  "image": "Immagini/Generiche/logo.png"
}
```

### Item di tipo `group`

```json
{
  "type": "group",
  "title": "Refill",
  "fromPrice": 55,
  "treatments": [
    {
      "type": "treatment",
      "name": "Refill corto",
      "label": "Corto",
      "price": 60,
      "duration": "90 min",
      "description": "Descrizione del trattamento.",
      "image": "Immagini/Generiche/logo.png"
    }
  ]
}
```

### Campi trattamento

1. `type`: sempre `"treatment"`
2. `name`: nome completo del trattamento
3. `label`: testo breve facoltativo mostrato nel listino
4. `price`: prezzo
5. `duration`: durata nel modal
6. `description`: descrizione nel modal
7. `image`: immagine nel modal

## `Listino_info.md`

Serve come versione leggibile e facile da modificare del listino.

Ha due parti:

1. struttura del listino in alto
2. blocco `## Dettagli trattamenti` in fondo

### Regole della struttura

1. riga senza indentazione = sezione
2. riga con una indentazione = trattamento diretto, gruppo o nota
3. riga con due indentazioni = trattamento finale dentro un gruppo
4. le note devono stare tra virgolette

Esempio:

```md
Gel da 55€
    Copertura in gel (prima applicazione) da 55€
        Mini 55€
        Corta 60€
    "Nota della sezione."
```

## Skill del listino

Ho creato la skill qui:

1. `C:\Users\marco\.codex\skills\update-listino-from-markdown\SKILL.md`
2. `C:\Users\marco\.codex\skills\update-listino-from-markdown\references\format.md`

### Cosa fa

La skill:

1. legge `Listino_info.md`
2. confronta la struttura con `treatments.json`
3. aggiorna il JSON
4. aggiorna il blocco `## Dettagli trattamenti`
5. controlla se servono modifiche a `script.js`, `style.css` o `index.html`
6. si ferma a chiedere chiarimenti se trova ambiguita

### Quando la skill fa domande

La skill chiede chiarimenti se:

1. una nota non e tra virgolette
2. una gerarchia e ambigua
3. un prezzo e scritto in modo incoerente
4. un trattamento nuovo non ha un mapping sicuro
5. la nuova struttura richiede di cambiare il comportamento della UI

### Esempio di richiesta

```text
Usa update-listino-from-markdown per sincronizzare Updated/Listino_info.md con Updated/treatments.json.
```

## Flusso pratico consigliato

### Caso standard

1. modifica `Listino_info.md`
2. usa la skill
3. controlla il risultato nel sito

### Caso eccezionale

1. modifichi prima `treatments.json`
2. riallinei `Listino_info.md`
3. controlli che menu, ancore e UI del listino siano ancora coerenti

## Nota utile

Se apri il sito direttamente come file locale e qualcosa non compare, puo dipendere dal `fetch` dei JSON. In quel caso conviene aprire il progetto con un piccolo server locale.
