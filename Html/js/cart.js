/**
 * cart.js
 * Ostoskorin hallinta Metro Pizza -sovellukselle.
 *
 * Toiminnot:
 *  - Tuotteiden lisäys koriin (.add-btn -napeilla)
 *  - Ostoskorin näyttö modaalissa
 *  - Tilauksen lähetys POST /api/orders
 *  - Kirjautumisen tarkistus (JWT localStorage:ssa)
 */

const API = "http://localhost:3001/api";

// ─── Tila ────────────────────────────────────────────────────────────────────

/** @type {Map<number, { nimi: string, hinta: number, maara: number }>} */
const kori = new Map();

// ─── Apufunktiot ─────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem("token");
}

function formatHinta(euroa) {
  return euroa.toFixed(2).replace(".", ",") + " €";
}

// ─── UI-päivitykset ──────────────────────────────────────────────────────────

function paivitaLaskuri() {
  const yhteensa = [...kori.values()].reduce((s, i) => s + i.maara, 0);
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = yhteensa;
  });
}

function paivitaKoriModal() {
  const lista = document.getElementById("cart-items-list");
  const yhteensaEl = document.getElementById("cart-total");
  if (!lista) return;

  if (kori.size === 0) {
    lista.innerHTML =
      '<p style="color:var(--text2);text-align:center;padding:1rem 0">Ostoskori on tyhjä</p>';
    if (yhteensaEl) yhteensaEl.textContent = formatHinta(0);
    return;
  }

  lista.innerHTML = "";
  let yhteensa = 0;

  kori.forEach((item, id) => {
    yhteensa += item.hinta * item.maara;
    const rivi = document.createElement("div");
    rivi.className = "cart-row";
    rivi.innerHTML = `
      <span class="cart-row-name">${item.nimi}</span>
      <div class="cart-row-controls">
        <button class="qty-btn" data-id="${id}" data-delta="-1">−</button>
        <span class="cart-row-qty">${item.maara}</span>
        <button class="qty-btn" data-id="${id}" data-delta="1">+</button>
        <span class="cart-row-price">${formatHinta(item.hinta * item.maara)}</span>
        <button class="cart-remove-btn" data-id="${id}">✕</button>
      </div>
    `;
    lista.appendChild(rivi);
  });

  if (yhteensaEl) yhteensaEl.textContent = formatHinta(yhteensa);
}

// ─── Kori-modal ──────────────────────────────────────────────────────────────

function luoKoriModal() {
  if (document.getElementById("cart-modal-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "cart-modal-overlay";
  overlay.innerHTML = `
    <div id="cart-modal">
      <div id="cart-modal-header">
        <h3>Ostoskori</h3>
        <button id="cart-close-btn">✕</button>
      </div>
      <div id="cart-items-list"></div>
      <div id="cart-footer">
        <div id="cart-total-row">
          <span>Yhteensä</span>
          <span id="cart-total">0,00 €</span>
        </div>
        <div id="cart-info-msg" style="display:none"></div>
        <button id="cart-order-btn" class="btn btn-primary" style="width:100%;margin-top:1rem">
          Tilaa nyt
        </button>
      </div>
    </div>
  `;

  // Inline-tyylit modaalille (ei riko olemassa olevaa CSS:ää)
  overlay.style.cssText = `
    display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);
    z-index:300;place-items:center;
  `;
  const modal = overlay.querySelector("#cart-modal");
  modal.style.cssText = `
    background:var(--bg2,#1a1a1a);border:1px solid var(--border,#333);
    border-radius:16px;padding:1.5rem;width:100%;max-width:460px;
    margin:1rem;max-height:85vh;overflow-y:auto;
  `;

  overlay.querySelector("#cart-modal-header").style.cssText =
    "display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border,#333)";
  overlay.querySelector("#cart-modal-header h3").style.cssText =
    "font-family:'Playfair Display',serif;font-size:1.3rem";
  overlay.querySelector("#cart-close-btn").style.cssText =
    "background:none;border:none;color:var(--text2,#888);font-size:1.2rem;cursor:pointer";
  overlay.querySelector("#cart-footer").style.cssText =
    "border-top:1px solid var(--border,#333);padding-top:1rem;margin-top:1rem";
  overlay.querySelector("#cart-total-row").style.cssText =
    "display:flex;justify-content:space-between;font-weight:600;font-size:1.05rem";

  // Lisätään globaalit tyylit kori-riveille
  const style = document.createElement("style");
  style.textContent = `
    .cart-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0;
      border-bottom: 1px solid var(--border, #2a2a2a);
      gap: 0.5rem;
    }
    .cart-row-name { flex: 1; font-size: 0.9rem; }
    .cart-row-controls {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .cart-row-qty {
      min-width: 1.5rem;
      text-align: center;
      font-size: 0.9rem;
    }
    .cart-row-price {
      min-width: 4rem;
      text-align: right;
      font-size: 0.9rem;
      color: var(--text2, #aaa);
    }
    .qty-btn, .cart-remove-btn {
      background: var(--bg3, #222);
      border: 1px solid var(--border, #333);
      color: var(--text, #fff);
      width: 26px; height: 26px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .qty-btn:hover { background: var(--accent, #e8471a); border-color: transparent; }
    .cart-remove-btn { font-size: 0.7rem; color: var(--text2, #888); }
    .cart-remove-btn:hover { background: var(--accent, #e8471a); color: #fff; border-color: transparent; }
    #cart-info-msg {
      margin-top: 0.75rem;
      padding: 0.6rem 0.9rem;
      border-radius: 8px;
      font-size: 0.85rem;
    }
    #cart-info-msg.success {
      background: rgba(39,174,96,0.15);
      color: #27ae60;
      border: 1px solid rgba(39,174,96,0.3);
    }
    #cart-info-msg.error {
      background: rgba(232,71,42,0.15);
      color: var(--accent, #e8471a);
      border: 1px solid rgba(232,71,42,0.3);
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(overlay);

  // Sulje nappi
  overlay.querySelector("#cart-close-btn").addEventListener("click", () => {
    overlay.style.display = "none";
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.style.display = "none";
  });

  // Määrä-napit ja poisto (event delegation)
  overlay.querySelector("#cart-items-list").addEventListener("click", (e) => {
    const id = parseInt(e.target.dataset.id);
    if (isNaN(id)) return;

    if (e.target.classList.contains("qty-btn")) {
      const delta = parseInt(e.target.dataset.delta);
      const item = kori.get(id);
      if (item) {
        item.maara += delta;
        if (item.maara <= 0) kori.delete(id);
        paivitaLaskuri();
        paivitaKoriModal();
      }
    }

    if (e.target.classList.contains("cart-remove-btn")) {
      kori.delete(id);
      paivitaLaskuri();
      paivitaKoriModal();
    }
  });

  // Tilaa-nappi
  overlay
    .querySelector("#cart-order-btn")
    .addEventListener("click", lahetaTilaus);
}

function avaaKoriModal() {
  const overlay = document.getElementById("cart-modal-overlay");
  if (!overlay) return;
  paivitaKoriModal();
  overlay.style.display = "grid";
}

// ─── Tuotteiden lisäys koriin ─────────────────────────────────────────────────

/**
 * Sitoo kaikki .add-btn -napit sivulla.
 * Odottaa data-tuote-id, data-name ja data-price attribuutteja.
 * Jos niitä ei ole, etsii ne lähimmästä .menu-item -vanhemmasta.
 */
function sitooAddNapit() {
  document.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const menuItem = btn.closest(".menu-item");
      if (!menuItem) return;

      // Haetaan tuote_id data-attribuutista tai generoidaan väliaikainen
      const tuoteId =
        parseInt(btn.dataset.tuoteId || menuItem.dataset.tuoteId) || null;
      const nimi =
        btn.dataset.name ||
        menuItem.dataset.name ||
        menuItem.querySelector("h4")?.textContent?.trim() ||
        "Tuote";
      const hintaStr =
        btn.dataset.price ||
        menuItem.dataset.price ||
        menuItem.querySelector(".menu-item-price")?.textContent ||
        "0";
      const hinta = parseFloat(
        hintaStr.replace(/[^\d.,]/g, "").replace(",", "."),
      );

      // Käytetään tuote_id:tä avaimena. Jos ei ole, käytä nimeä.
      const avain = tuoteId !== null ? tuoteId : nimi;

      if (kori.has(avain)) {
        kori.get(avain).maara += 1;
      } else {
        kori.set(avain, { tuote_id: tuoteId, nimi, hinta, maara: 1 });
      }

      paivitaLaskuri();

      // Visuaalinen palaute napissa
      const alkupTeksti = btn.textContent;
      btn.textContent = "✓";
      btn.style.background = "var(--accent, #e8471a)";
      btn.style.color = "#fff";
      btn.style.borderColor = "transparent";
      setTimeout(() => {
        btn.textContent = alkupTeksti;
        btn.style.background = "";
        btn.style.color = "";
        btn.style.borderColor = "";
      }, 800);
    });
  });
}

// ─── Tilauksen lähetys ────────────────────────────────────────────────────────

async function lahetaTilaus() {
  const token = getToken();
  if (!token) {
    window.location.href = "kirjaudu.html";
    return;
  }

  if (kori.size === 0) {
    naytaKoriViesti("Ostoskori on tyhjä.", "error");
    return;
  }

  // Rakennetaan ostoskori-lista backendille
  // Jos tuote_id on null (tuotteita ei haettu backendistä), käytetään nimeä
  // HUOM: Suositellaan hakemaan menu backendistä tuote_id:n saamiseksi
  const ostoskori = [...kori.entries()]
    .filter(([, item]) => item.tuote_id !== null)
    .map(([, item]) => ({
      tuote_id: item.tuote_id,
      maara: item.maara,
    }));

  if (ostoskori.length === 0) {
    naytaKoriViesti(
      "Tuotteiden tietoja ei löydy. Lataa sivu uudelleen.",
      "error",
    );
    return;
  }

  const orderBtn = document.getElementById("cart-order-btn");
  if (orderBtn) {
    orderBtn.disabled = true;
    orderBtn.textContent = "Lähetetään…";
  }

  try {
    const res = await fetch(`${API}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ostoskori }),
    });

    const data = await res.json();

    if (!res.ok) {
      naytaKoriViesti(data.error || "Tilaus epäonnistui.", "error");
      return;
    }

    // Tilaus onnistui
    kori.clear();
    paivitaLaskuri();
    paivitaKoriModal();

    let viesti = `Tilaus #${data.tilaus_id} vastaanotettu! Yhteensä: ${parseFloat(
      data.lopullinenHinta,
    )
      .toFixed(2)
      .replace(".", ",")} €`;
    if (data.info) viesti += ` (${data.info})`;

    naytaKoriViesti(viesti, "success");
  } catch (_err) {
    naytaKoriViesti("Palvelimeen ei saatu yhteyttä.", "error");
  } finally {
    if (orderBtn) {
      orderBtn.disabled = false;
      orderBtn.textContent = "Tilaa nyt";
    }
  }
}

function naytaKoriViesti(teksti, tyyppi) {
  const el = document.getElementById("cart-info-msg");
  if (!el) return;
  el.textContent = teksti;
  el.className = tyyppi; // 'success' tai 'error'
  el.style.display = "block";
  if (tyyppi === "success") {
    setTimeout(() => {
      el.style.display = "none";
    }, 6000);
  }
}

// ─── Menun haku backendistä (valinnainen, parempi kuin kovakoodatut id:t) ─────

/**
 * Hakee menun backendistä ja asettaa data-tuote-id attribuutit .menu-item -elementeille.
 * Yhdistää backendin tuotteet HTML:n h4-nimien perusteella.
 */
async function haeMenuJaAsettaIdt() {
  try {
    const res = await fetch(`${API}/menu`);
    if (!res.ok) return;
    const tuotteet = await res.json();

    document.querySelectorAll(".menu-item").forEach((menuItem) => {
      const h4 = menuItem.querySelector("h4");
      if (!h4) return;
      const nimi = h4.textContent.trim().toLowerCase();
      const tuote = tuotteet.find((t) => t.nimi.trim().toLowerCase() === nimi);
      if (tuote) {
        menuItem.dataset.tuoteId = tuote.tuote_id;
        menuItem.dataset.name = tuote.nimi;
        menuItem.dataset.price = tuote.hinta;
        const addBtn = menuItem.querySelector(".add-btn");
        if (addBtn) {
          addBtn.dataset.tuoteId = tuote.tuote_id;
          addBtn.dataset.name = tuote.nimi;
          addBtn.dataset.price = tuote.hinta;
        }
      }
    });
  } catch (_err) {
    console.warn("Menun haku epäonnistui, käytetään HTML:n tietoja.");
  }
}

// ─── Alustus ──────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  // Luo kori-modal
  luoKoriModal();

  // Hae menu backendistä tuote_id:iden saamiseksi
  await haeMenuJaAsettaIdt();

  // Sido plus-napit
  sitooAddNapit();

  // Sido ostoskori-nappi
  document.querySelectorAll(".cart-btn").forEach((btn) => {
    btn.addEventListener("click", avaaKoriModal);
  });

  // Päivitä laskuri
  paivitaLaskuri();
});
