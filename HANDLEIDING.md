# Handleiding — Dessert Verkoop

Deze site bestaat uit twee delen:

1. **Google Sheet + Apps Script** = de "database" (gratis)
2. **De website op Netlify** = wat jullie openen op de dag zelf

Je moet beide een keer opzetten. Reken op ±15 minuten in totaal.

---

## Deel 1 — Google Sheets als backend (eenmalig, ±10 min)

### Stap 1: maak een nieuwe Google Sheet

1. Ga naar [sheets.google.com](https://sheets.google.com) en log in met je Google-account.
2. Klik op **Nieuw** (of ga naar [sheets.new](https://sheets.new)).
3. Noem de sheet bv. **Dessert Verkoop** (klik bovenaan op "Naamloze spreadsheet").

### Stap 2: plak de Apps Script-code

1. In de sheet: menu **Extensies → Apps Script**.
2. Er opent een editor. Verwijder alles wat er staat.
3. Open het bestand `google-apps-script/Code.gs` uit dit project en kopieér **de volledige inhoud**.
4. Plak het in de editor.
5. Klik op het **disketje** (Opslaan) of Ctrl/Cmd+S. Je mag het project een naam geven, bv. "Dessert backend".

### Stap 3: deployen als web-app

1. Klik rechtsboven op **Implementeren → Nieuwe implementatie**.
2. Klik op het tandwiel en kies **Web-app**.
3. Vul in:
   - **Omschrijving:** bv. `Dessert API`
   - **Uitvoeren als:** **Ik** (jouw e-mailadres)
   - **Wie heeft toegang:** **Iedereen**
4. Klik op **Implementeren**.
5. Er verschijnt een melding dat je nog moet autoriseren:
   - Klik op **Toestaan** (of *Advanced → Go to (project name) → Allow* als je een waarschuwing "Google has not verified this app" ziet — dat is normaal want het is je eigen script).
   - Kies je Google-account, eventueel *Bekijk instellingen → Ga naar (ongeverifieerde app) → Toestaan*.
6. Je krijgt nu een **web-app-URL**. Kopieer die (begint met `https://script.google.com/macros/s/...`).

> **Belangrijk:** Deze URL is wat de website nodig heeft. Deel hem niet publiek op social media — wie de link heeft, kan verkoopjes toevoegen.

> **Tip:** pas je later de code aan? Klik dan op **Implementeren → Implementatie beheren → ⋮ → Nieuwe implementatie** (nieuwe versie) en gebruik **dezelfde** URL.

### Stap 4: de sheet zelf

De code maakt bij de eerste aanroep twee tabbladen aan:

- **Desserts** — jouw lijst met *naam* en *prijs*. Staan er voorbeeldjes in? Vervang ze door jullie echte desserts (kolom A = naam, kolom B = prijs in euro, bv. `2.5`).
- **Verkoop** — hier komt automatisch elke verkoop in te staan. Niet aan raken.

### Stap 5: de URL in de website zetten

1. Open `js/config.js` in dit project.
2. Vervang `'PLAK_HIER_DE_URL_VAN_APPS_SCRIPT'` door je echte URL, tussen de aanhalingstekens:

```js
appsScriptUrl: 'https://script.google.com/macros/s/AKfycb.../exec',
```

3. Sla het bestand op.

**Testen:** open `index.html` lokaal in je browser (dubbelklik volstaat). Zie je de desserts en kan je een verkoop noteren? Dan werkt het.

---

## Deel 2 — GitHub + Netlify (eenmalig, ±5 min)

### Stap 1: push de code naar GitHub

Maak eerst op [github.com](https://github.com) een **nieuw leeg repo** aan (zonder README, .git of license):

- Naam: `dessert-verkoop`
- **Public** (Netlify moet er gratis bij kunnen; de site zelf bevat geen gevoelige data, de URL van je Sheet zit er wél in — als je dat liever niet publiek wil: kies Private en authenticeer Netlify met je account)

Daarna op je computer (lokaal is de repo al klaargezet; ik kan ook voor je pushen als je `gh` installeert):

```bash
cd "/Users/ayatsalma/Desktop/Extra/AI-Work/dessert-verkoop"
git remote add origin https://github.com/Salmayat/dessert-verkoop.git
git push -u origin main
```

(Vul je GitHub-gebruikersnaam en een personal access token wanneer gevraagd — of gebruik `gh auth login` als je de GitHub CLI hebt.)

### Stap 2: koppel Netlify

1. Ga naar [app.netlify.com](https://app.netlify.com) en log in (met GitHub is makkelijkst).
2. Klik **Add new site → Import an existing project → GitHub**.
3. Kies je repo `Salmayat/dessert-verkoop`.
4. Netlify leest `netlify.toml` automatisch uit — de instellingen kloppen al:
   - **Build command:** *(leeg)*
   - **Publish directory:** `.`
5. Klik **Deploy**. Na een minuutje is je site live, bv. op
   `https://dessert-verkoop.netlify.app`.

### Stap 3: delen

- **Iets noteren:** de hoofdlink (index)
- **Grafieken zien:** `<jouw-link>/dashboard.html`

Je kan de link doorsturen via WhatsApp of een QR-code maken.

> Let op: iedereen met de link kan verkoopjes toevoegen en verwijderen. Dat is prima voor een besloten groep. Wil je toch beveiliging, zeg het maar — dan voeg ik een pincode toe.

---

## De dag zelf

- Open de site op een gsm of tablet met internet.
- **Verkoop noteren:** aantal instellen (− / +), tik op **Cash** of **Bank**. Klaar.
- Foutje gemaakt? Tik op **×** bij het verkoopje in de lijst.
- **Nogmaals**-knop herhaalt de laatste verkoop met één tik.
- Het cijfer bovenaan (totaal / cash / bank) verandert live en synchroniseert tussen alle toestellen (elke 30 s automatisch, of meteen na elke verkoop).
- **Grafieken:** open `/dashboard.html`.

## Desserts aanpassen

Open de Google Sheet → tabblad **Desserts** → pas naam of prijs aan. De site pikt het de volgende keer dat iemand de pagina opent (of na tikken op *Vernieuw*) automatisch op. Extra dessert? Nieuwe rij erbij. Dessert weg? Verwijder de rij.

## Als er iets misgaat

| Probleem | Oplossing |
| --- | --- |
| "De site is nog niet gekoppeld..." | URL nog niet in `js/config.js` geplakt, of niet gepusht naar Netlify. |
| "Kon data niet laden" | Verkeerde/vervallen URL, of Google Apps Script heeft net een storing. Check de URL in een nieuw browsertabblad: je moet JSON-tekst zien. |
| Verkoop niet opgeslagen (401/403) | Opnieuw implementeren als **Iedereen** met uitvoeren als **Ik**. |
| Wijziging in de script-code werkt niet | Je moet een **nieuwe implementatie** maken (zie tip bij Stap 3). |
| Twee mensen tegelijk noteren | Werkt — het script gebruikt een lock, verkoopjes worden netjes om beurten weggeschreven. |
| Netlify toont "Cannot GET /" | Publish directory stond niet op `.` — pas aan in Site settings → Build & deploy. |
