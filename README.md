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
