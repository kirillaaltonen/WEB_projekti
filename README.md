# Metro Pizza

Metro Pizza on ravintola-aiheinen web-sovellus, jossa asiakas voi selata lounaslistaa, rekisteröityä, kirjautua sisään, lisätä tuotteita ostoskoriin ja tehdä tilauksen. Ylläpitäjä voi hallita ruokalistaa, tilauksia ja käyttäjiä erillisessä hallintapaneelissa.

## Julkaistu sovellus

Frontend:

https://metropizza.netlify.app/

Backend API:

https://webprojekti-production.up.railway.app/api

## Ryhmän jäsenet

- Nimi 1
- Nimi 2
- Nimi 3

## Sovelluksen idea ja kohderyhmä

Metro Pizza on kampusympäristöön suunniteltu pizzaravintolan tilaus- ja noutojärjestelmä. Sovelluksen kohderyhmänä ovat opiskelijat, henkilökunta ja ravintolan ylläpitäjät.

Asiakkaan näkökulmasta tärkeintä on, että ruokalista on selkeä, hinnat näkyvät heti, erityisruokavaliot ovat helposti tunnistettavissa ja tilauksen tekeminen onnistuu nopeasti.

Ylläpitäjän näkökulmasta tärkeintä on, että tilauksia voi seurata, tilausten tilaa voi päivittää ja ruokalistaa voi muokata ilman tietokannan manuaalista käsittelyä.

## Päätoiminnallisuudet

### Asiakas

- Etusivun selaaminen
- Ruokalistan selaaminen
- Päivän lounaslistan korostus
- Erityisruokavalioiden suodatus
  - kaikki
  - kasvis
  - gluteeniton
  - laktoositon
- Rekisteröityminen
- Kirjautuminen
- Kirjautuneen käyttäjän navigaatio
  - Kirjaudu-linkki muuttuu Tilaukseni-linkiksi
  - Kirjaudu ulos -toiminto
- Tuotteiden lisääminen ostoskoriin
- Tilauksen tekeminen
- Omien tilausten katsominen

### Ylläpitäjä

- Admin-kirjautuminen
- Koontinäyttö
  - tilaukset tänään
  - odottavat tilaukset
  - päivän myynti
  - rekisteröityneet käyttäjät
- Tilausten hallinta
  - tilausten listaus
  - tilauksen tilan muuttaminen
- Ruokalistan hallinta
  - tuotteen lisääminen
  - tuotteen muokkaaminen
  - tuotteen poistaminen
- Käyttäjien hallinta
  - käyttäjien listaus
  - roolin muuttaminen opiskelijasta adminiksi tai administa opiskelijaksi

### Avoin API

Sijaintisivulla käytetään HSL:n reititys-API:a backendin kautta. Käyttäjä voi hakea reitin nykyisestä sijainnistaan Metro Pizzaan. Jos reittiä ei löydy esimerkiksi yöaikaan tai HSL-alueen ulkopuolella, sovellus näyttää käyttäjälle ilmoituksen.

## Teknologiat

### Frontend

- HTML
- CSS
- JavaScript
- Webpack
- Netlify

### Backend

- Node.js
- Express
- MySQL
- JWT
- bcrypt
- Railway

### Tietokanta

- MySQL
- Railway MySQL

## Projektin rakenne

```txt
WEB_projekti/
├── backend/
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── menu.js
│   │   └── orders.js
│   ├── db.js
│   └── server.js
│
├── Html/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── hsl/
│   │   │   ├── Routeservice.js
│   │   │   └── uiRenderer.js
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── hsl.js
│   │   ├── menu.js
│   │   ├── my-orders.js
│   │   └── nav-auth.js
│   ├── index.html
│   ├── ruokalista.html
│   ├── kirjaudu.html
│   ├── sijainti.html
│   ├── hallinta.html
│   └── tilaukseni.html
│
├── img/
├── tietokanta.sql
├── package.json
├── webpack.common.cjs
├── webpack.config.dev.cjs
└── webpack.config.prod.cjs
Asennus ja käynnistys lokaalisti
1. Kloonaa projekti
git clone <repository-url>
cd WEB_projekti
2. Asenna riippuvuudet
npm install
3. Luo .env-tiedosto projektin juureen
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=oma_salasana
DB_NAME=metro_pizza

JWT_SECRET=oma_salainen_avain
HSL_API_KEY=oma_hsl_api_avain
4. Luo tietokanta

Aja MySQL Workbenchissä projektin tietokanta.sql.

5. Käynnistä backend ja frontend kehitystilassa
npm run dev

Vaihtoehtoisesti erikseen:

npm run server
npm run frontend

Backend käynnistyy lokaalisti osoitteeseen:

http://localhost:3001

Frontend käynnistyy kehitystilassa osoitteeseen:

http://localhost:8080
Production build

Frontendin tuotantoversio rakennetaan komennolla:

npm run build

Build muodostaa dist/-kansion.

Buildin voi testata lokaalisti komennolla:

npx serve dist
Testikäyttäjät
Admin
Sähköposti: admin@metropizza.fi
Salasana: [lisää tähän sovittu salasana]
Asiakas

Käyttäjän voi luoda rekisteröitymissivun kautta.

API-endpointit
Auth
POST /api/auth/register
POST /api/auth/login
Ruokalista
GET /api/menu
GET /api/menu/lounas
Tilaukset
POST /api/orders
GET /api/orders/my-orders
Admin
GET /api/admin/orders
PUT /api/admin/orders/:id
GET /api/admin/stats

POST /api/admin/menu
PUT /api/admin/menu/:id
DELETE /api/admin/menu/:id

GET /api/admin/users
PUT /api/admin/users/:id/role
HSL-reitti
POST /api/route
Tietokannan taulut

Sovellus käyttää seuraavia päätauluja:

KAYTTAJAT
TUOTTEET
TILAUKSET
TILAUSRIVIT
KAYTTAJAT

Tallentaa käyttäjät, salasanahashit ja roolit.

TUOTTEET

Tallentaa ruokalistan tuotteet, hinnat, kategoriat, viikonpäivät ja erityisruokavaliot.

TILAUKSET

Tallentaa asiakkaan tekemät tilaukset ja tilauksen tilan.

TILAUSRIVIT

Tallentaa tilauksen tuotteet ja määrät.

Miten sovellusta testataan
1. Etusivu
Avaa sovellus.
Tarkista, että etusivu latautuu.
Tarkista, että navigaation linkit toimivat.
Siirry ruokalistaan.
2. Ruokalista
Avaa ruokalista.html.
Tarkista, että tuotteet latautuvat API:sta.
Tarkista, että hinnat näkyvät.
Tarkista, että erityisruokavaliot näkyvät.
Testaa suodattimet:
Kaikki
Kasvis
Gluteeniton
Laktoositon
Tarkista, että päivän lista on korostettu.
3. Rekisteröityminen ja kirjautuminen
Avaa kirjautumissivu.
Rekisteröi uusi käyttäjä.
Kirjaudu sisään.
Tarkista, että navigaatiossa näkyy Tilaukseni.
Kirjaudu ulos.
Tarkista, että navigaatiossa näkyy Kirjaudu.
4. Ostoskori ja tilaus
Kirjaudu sisään asiakkaana.
Avaa ruokalista.
Lisää tuote ostoskoriin.
Avaa ostoskori.
Tee tilaus.
Tarkista, että sovellus näyttää tilausnumeron.
Avaa Tilaukseni-sivu.
Tarkista, että tehty tilaus näkyy listassa.
5. Admin-paneeli
Kirjaudu admin-käyttäjänä.
Avaa hallinta.html.
Tarkista, että koontinäyttö latautuu.
Tarkista, että tilaukset näkyvät.
Muuta tilauksen tila.
Lisää uusi tuote ruokalistaan.
Muokkaa tuotetta.
Poista tuote.
Tarkista, että käyttäjälista näkyy.
Vaihda käyttäjän rooli.
6. HSL-reittihaku
Avaa sijainti.html.
Salli selaimen sijaintilupa.
Paina “Näytä reitti sijainnistani”.
Tarkista, että sovellus näyttää reitin tai selkeän viestin, jos reittiä ei löydy.

Huomio: HSL-reittejä ei välttämättä löydy yöaikaan tai HSL-alueen ulkopuolelta.

Integraatiotestien ehdotettu kattavuus

Projektissa voidaan testata vähintään seuraavat integraatiot:

Käyttäjän rekisteröinti
Käyttäjän kirjautuminen
Ruokalistan haku API:sta
Tilauksen tekeminen
Adminin tilausten haku
Tuotteen lisääminen adminina
Tuotteen poistaminen adminina
End-to-end-testien ehdotettu kattavuus

Projektissa voidaan testata vähintään seuraavat E2E-polut:

Käyttäjä avaa etusivun ja siirtyy ruokalistaan
Käyttäjä rekisteröityy ja kirjautuu sisään
Käyttäjä lisää tuotteen ostoskoriin
Käyttäjä tekee tilauksen
Käyttäjä näkee oman tilauksensa Tilaukseni-sivulla
Admin kirjautuu sisään ja muuttaa tilauksen tilaa
Admin lisää, muokkaa ja poistaa ruokalistan tuotteen
Käyttäjätestaus ja palaute

Käyttäjätestauksessa testikäyttäjille voidaan antaa seuraavat tehtävät:

Etsi ruokalista.
Suodata ruokalistaa erityisruokavalion perusteella.
Rekisteröidy ja kirjaudu sisään.
Lisää tuote ostoskoriin.
Tee tilaus.
Tarkista oma tilaus.
Adminina muuta tilauksen tila.
Adminina lisää tai muokkaa ruokalistan tuotetta.

Palautelomakkeen kysymykset:

Oliko README selkeä ja vaatimusten mukainen?
Arvio 1–5.
Saiko selkeän kuvan, mikä on sovelluksen käyttötarkoitus ja kenelle se on tarkoitettu?
Arvio 1–5.
Löytyivätkö käyttöliittymästä helposti kaikki tarvittavat toiminnot?
Arvio 1–5.
Vapaa palaute.
Oma kysymys: Oliko tilaaminen riittävän helppoa ilman erillistä ohjeistusta?
Arvio 1–5.
Lighthouse ja validointi

Sovelluksen tekninen testaus tehdään Chrome DevTools Lighthouse -työkalulla production-buildistä tai julkaistusta Netlify-versiosta.

Testattavat sivut:

Etusivu
Ruokalista
Kirjautuminen
Tilaukseni
Hallinta
Sijainti

Lighthouse-kategoriat:

Performance
Accessibility
Best Practices
SEO

HTML ja CSS voidaan validoida W3C-validaattoreilla.

Julkaisu

Frontend on julkaistu Netlifyssä.

Backend ja MySQL-tietokanta on julkaistu Railway-palvelussa.

Frontend kommunikoi backendin kanssa REST API -rajapintojen kautta.

Tunnetut rajoitukset
HSL-reittihaku voi palauttaa “Reittejä ei löytynyt”, jos käyttäjä ei ole HSL-alueella tai reittejä ei ole saatavilla kyseisenä ajankohtana.
Admin-käyttäjä pitää luoda joko rekisteröimällä käyttäjä ja vaihtamalla rooli adminiksi tai lisäämällä admin tietokantaan valmiilla salasanahashilla.
Testiautomaatio on dokumentoitu, mutta automaattiset testit pitää vielä ajaa tai täydentää, jos kurssipalautus sitä edellyttää.
Miksi projekti on hyödyllinen?

Sovellus ratkaisee kampusravintolan tilaus- ja noutoprosessin perusongelman: asiakas näkee ruokalistan, hinnat ja erityisruokavaliot selkeästi, voi tehdä tilauksen verkossa ja seurata omia tilauksiaan. Ravintolan ylläpitäjä pystyy hallitsemaan tilauksia ja ruokalistaa ilman suoraa tietokantatyöskentelyä.

Ylläpito ja jatkokehitys

Mahdollisia jatkokehitysideoita:

Maksutoiminto
Tarkempi tilauksen noutoaika
Tiedotteiden hallinta
Useampi toimipiste
Kielenvaihto suomi/englanti
Paremmat automaattiset testit
Admin-paneelin hakutoiminnot ja suodatus
