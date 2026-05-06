const MY_ORDERS_API =
  "https://webprojekti-production.up.railway.app/api/orders";

function formatPrice(value) {
  return (
    Number(value || 0)
      .toFixed(2)
      .replace(".", ",") + " €"
  );
}

function formatDate(value) {
  return new Date(value).toLocaleString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadMyOrders() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("my-orders");

  if (!token) {
    window.location.href = "kirjaudu.html";
    return;
  }

  try {
    const res = await fetch(`${MY_ORDERS_API}/my-orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const orders = await res.json();

    if (!res.ok) {
      container.innerHTML = `<p style="color:var(--accent)">Tilausten haku epäonnistui.</p>`;
      return;
    }

    if (!orders.length) {
      container.innerHTML = `<p style="color:var(--text2)">Sinulla ei ole vielä tilauksia.</p>`;
      return;
    }

    container.innerHTML = `
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th style="text-align:left;padding:1rem;border-bottom:1px solid var(--border)">Tilaus</th>
              <th style="text-align:left;padding:1rem;border-bottom:1px solid var(--border)">Päivä</th>
              <th style="text-align:left;padding:1rem;border-bottom:1px solid var(--border)">Tila</th>
              <th style="text-align:right;padding:1rem;border-bottom:1px solid var(--border)">Hinta</th>
            </tr>
          </thead>
          <tbody>
            ${orders
              .map(
                (o) => `
                  <tr>
                    <td style="padding:1rem;border-bottom:1px solid var(--border)">#${o.tilaus_id}</td>
                    <td style="padding:1rem;border-bottom:1px solid var(--border);color:var(--text2)">${formatDate(o.paivamaara)}</td>
                    <td style="padding:1rem;border-bottom:1px solid var(--border)">${o.tila}</td>
                    <td style="padding:1rem;border-bottom:1px solid var(--border);text-align:right;font-weight:700">${formatPrice(o.kokonaishinta)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color:var(--accent)">Palvelimeen ei saatu yhteyttä.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadMyOrders);
