# Metro Pizza

Metro Pizza on ravintola-aiheinen web-sovellus ja tilausjärjestelmä. Asiakas voi selata ruokalistaa, rekisteröityä, kirjautua sisään, lisätä tuotteita ostoskoriin ja tehdä tilauksen. Ylläpitäjä voi hallita tilauksia, ruokalistaa ja käyttäjiä hallintapaneelista.

## Julkaistu sovellus

Frontend: https://metropizza.netlify.app/

Backend API: https://webprojekti-production.up.railway.app/api

## Ryhmän jäsenet

- Kirill Aaltonen
- Aamos Kahainen

## Sovelluksen idea ja kohderyhmä

Metro Pizza on suunnattu ensisijaisesti Metropolian Arabian kampuksella opiskeleville opiskelijoille. Ideana on, että opiskelija voi selata ruokalistaa ja tehdä tilauksen nopeasti esimerkiksi oppitunnin lopussa, jolloin ruoka voidaan hakea mukaan heti tunnin jälkeen. Sovelluksessa huomioidaan myös opiskelija-alennukset, hinnat ja erityisruokavaliot, jotta tilaaminen olisi mahdollisimman selkeää ja nopeaa.

Arabian kampus valittiin kohteeksi, koska se sijaitsee hyvien julkisten yhteyksien päässä lähellä Helsingin keskustaa. Tämän vuoksi ravintola on helposti saavutettavissa opiskelijoiden lisäksi myös muille asiakkaille. Ylläpitäjälle sovellus tarjoaa helpon tavan seurata tilauksia ja muokata ruokalistaa ilman suoraa tietokannan käsittelyä.

## Päätoiminnallisuudet

### Asiakas

- Etusivu ja ravintolan perustiedot
- Ruokalista omasta API-rajapinnasta
- Päivän lounaslistan korostus
- Hintojen ja erityisruokavalioiden näyttäminen
- Suodatus: kaikki, kasvis, gluteeniton ja laktoositon
- Rekisteröityminen ja kirjautuminen
- Ostoskori
- Tilauksen tekeminen
- Omien tilausten katsominen
- Kirjautuneelle käyttäjälle Tilaukseni- ja Kirjaudu ulos -linkit

### Ylläpitäjä

- Admin-kirjautuminen
- Koontinäyttö tilastoilla
- Tilausten listaus ja tilan muuttaminen
- Ruokalistan tuotteen lisääminen, muokkaaminen ja poistaminen
- Käyttäjien listaus ja roolin vaihtaminen

### Avoin API

Sijaintisivulla käytetään HSL:n reititys-API:a backendin kautta. Käyttäjä voi hakea reitin nykyisestä sijainnistaan ravintolaan. Jos käyttäjä ei ole HSL-alueella tai reittejä ei ole saatavilla esimerkiksi yöaikaan, sovellus näyttää ilmoituksen.

## Teknologiat

Frontend:

- HTML
- CSS
- JavaScript
- Webpack
- Netlify

Backend:

- Node.js
- Express
- MySQL
- JWT
- bcrypt
- Railway

## Projektin rakenne

```txt
WEB_projekti/
├── backend/
│   ├── routes/
│   ├── db.js
│   └── server.js
├── Html/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── ruokalista.html
│   ├── kirjaudu.html
│   ├── sijainti.html
│   ├── hallinta.html
│   └── tilaukseni.html
├── img/
├── tietokanta.sql
├── package.json
└── webpack-configit
```

## Asennus ja käynnistys lokaalisti

### 1. Kloonaa projekti

```bash
git clone <repository-url>
cd WEB_projekti
```

### 2. Asenna riippuvuudet

```bash
npm install
```

### 3. Luo `.env`-tiedosto projektin juureen

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=oma_salasana
DB_NAME=metro_pizza
JWT_SECRET=oma_salainen_avain
HSL_API_KEY=oma_hsl_api_avain
```

### 4. Luo tietokanta

Aja MySQL Workbenchissä projektin `tietokanta.sql`.

### 5. Käynnistä projekti

Backend ja frontend yhdessä:

```bash
npm run dev
```

Tai erikseen:

```bash
npm run server
npm run frontend
```

Backend toimii lokaalisti osoitteessa:

```txt
http://localhost:3001
```

Frontend toimii kehitystilassa osoitteessa:

```txt
http://localhost:8080
```

## Production build

```bash
npm run build
```

Build muodostaa `dist/`-kansion. Buildin voi testata lokaalisti:

```bash
npx serve dist
```

## Testikäyttäjät

Admin:

```txt
Sähköposti: admin@metropizza.fi
Salasana: lisää tähän sovittu salasana
```

Asiakkaan voi luoda rekisteröitymissivun kautta.

## API-endpointit

Auth:

```txt
POST /api/auth/register
POST /api/auth/login
```

Ruokalista:

```txt
GET /api/menu
GET /api/menu/lounas
```

Tilaukset:

```txt
POST /api/orders
GET /api/orders/my-orders
```

Admin:

```txt
GET /api/admin/orders
PUT /api/admin/orders/:id
GET /api/admin/stats
POST /api/admin/menu
PUT /api/admin/menu/:id
DELETE /api/admin/menu/:id
GET /api/admin/users
PUT /api/admin/users/:id/role
```

HSL:

```txt
POST /api/route
```

## Tietokanta

Sovellus käyttää MySQL-tietokantaa. Päätaulut ovat:

- `KAYTTAJAT`
- `TUOTTEET`
- `TILAUKSET`
- `TILAUSRIVIT`

Tietokannan rakenne löytyy tiedostosta `tietokanta.sql`.

## Miten sovellus testataan

### Asiakaspolku

1. Avaa etusivu.
2. Siirry ruokalistaan.
3. Tarkista, että tuotteet latautuvat API:sta.
4. Rekisteröidy ja kirjaudu sisään.
5. Lisää tuote ostoskoriin.
6. Tee tilaus.
7. Tarkista tilaus Tilaukseni-sivulta.
8. Kirjaudu ulos.

### Admin-polku

1. Kirjaudu admin-käyttäjänä.
2. Avaa hallintasivu painamalla ylläpito nappia etusivun alaosassa.
3. Tarkista koontinäytön tiedot.
4. Muuta tilauksen tila.
5. Lisää uusi tuote.
6. Muokkaa tuotetta.
7. Poista tuote.
8. Tarkista käyttäjälista ja roolin vaihtaminen.

### HSL-reittihaku

1. Avaa sijaintisivu.
2. Salli selaimen sijaintilupa.
3. Paina “Näytä reitti sijainnistani”.
4. Tarkista, että sovellus näyttää reitin tai selkeän ilmoituksen, jos reittiä ei löydy.

## Testiautomaatio

Projektin vaatimuksiin kuuluu vähintään 5 integraatiotestiä ja 5 end-to-end-testiä.

Ehdotetut integraatiotestit:

1. Käyttäjän rekisteröinti
2. Käyttäjän kirjautuminen
3. Ruokalistan haku API:sta
4. Tilauksen tekeminen
5. Adminin tilausten haku

Ehdotetut E2E-testit:

1. Käyttäjä avaa etusivun ja siirtyy ruokalistaan
2. Käyttäjä rekisteröityy ja kirjautuu
3. Käyttäjä lisää tuotteen ostoskoriin
4. Käyttäjä tekee tilauksen
5. Admin kirjautuu ja muuttaa tilauksen tilaa

## Käyttäjätestaus ja palaute

Testikäyttäjille voidaan antaa tehtäviksi esimerkiksi ruokalistan löytäminen, tilauksen tekeminen ja admin-paneelin toimintojen kokeileminen.

Palautelomakkeen kysymykset:

1. Oliko README selkeä ja vaatimusten mukainen? Arvio 1–5.
2. Saiko selkeän kuvan, mikä sovelluksen tarkoitus on ja kenelle se on tarkoitettu? Arvio 1–5.
3. Löytyivätkö tarvittavat toiminnot helposti? Arvio 1–5.
4. Oliko tilaaminen riittävän helppoa ilman ohjeistusta? Arvio 1–5.
5. Vapaa palaute.

## Lighthouse ja validointi

Lighthouse-testit ajetaan Chrome DevToolsilla julkaistusta Netlify-versiosta tai production-buildistä. Testattavat kategoriat:

- Performance
- Accessibility
- Best Practices
- SEO

Testattavat sivut:

- Etusivu
- Ruokalista
- Kirjautuminen
- Tilaukseni
- Hallinta
- Sijainti

HTML ja CSS voidaan validoida W3C-validaattoreilla.

## Julkaisu

Frontend on julkaistu Netlifyssä.

Backend ja MySQL-tietokanta on julkaistu Railway-palvelussa.

Frontend kommunikoi backendin kanssa REST API -rajapintojen kautta.

## Tunnetut rajoitukset

- HSL-reittihaku ei välttämättä löydä reittiä yöaikaan tai HSL-alueen ulkopuolelta.
- Admin-käyttäjä pitää luoda rekisteröimällä käyttäjä ja vaihtamalla rooli adminiksi tai lisäämällä admin tietokantaan valmiilla salasanahashilla.

## Jatkokehitysideoita

- Maksutoiminto
- Tarkempi noutoaika
- Tiedotteiden hallinta
- Useampi toimipiste
- Kielenvaihto suomi/englanti
- 
