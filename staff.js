const API_URL =
"https://script.google.com/macros/s/AKfycbwXBlRSPgE_ufvIPhw9LqTdX95CW3YYjQcLajL4XcKAv6GbAKVErdYDiSrD0AXAK09_/exec";

let staffToken = "";

/* =========================
API
========================= */

async function api(
action,
data = {}
) {

if (
!API_URL ||
API_URL.includes("PASTE_YOUR")
) {

```
throw new Error(
  "Google Apps Script URL has not been added."
);
```

}

const url =
API_URL +
"?action=" +
encodeURIComponent(action) +
"&data=" +
encodeURIComponent(
JSON.stringify({
...data,
token: staffToken
})
);

const response =
await fetch(url);

if (!response.ok) {

```
throw new Error(
  "Could not connect to the server."
);
```

}

return await response.json();

}

/* =========================
HTML SAFETY
========================= */

function escapeHTML(value) {

return String(value ?? "")
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");

}

/* =========================
LOGIN
========================= */

document
.getElementById("loginForm")
.addEventListener(
"submit",
async function(event) {

```
  event.preventDefault();


  const result =
    document.getElementById(
      "loginResult"
    );


  result.textContent =
    "Signing in...";


  try {

    const password =
      document.getElementById(
        "password"
      ).value;


    const response =
      await api(
        "adminLogin",
        {
          password
        }
      );


    if (!response.ok) {

      throw new Error(
        response.error ||
        "Incorrect password."
      );

    }


    staffToken =
      response.token;


    sessionStorage.setItem(
      "staffToken",
      staffToken
    );


    document
      .getElementById(
        "loginSection"
      )
      .hidden = true;


    document
      .getElementById(
        "staffPanel"
      )
      .hidden = false;


    loadDashboard();


  } catch (error) {

    result.className =
      "error-message";

    result.textContent =
      error.message;

  }

}
```

);

/* =========================
RESTORE LOGIN
========================= */

staffToken =
sessionStorage.getItem(
"staffToken"
) || "";

if (staffToken) {

document
.getElementById(
"loginSection"
)
.hidden = true;

document
.getElementById(
"staffPanel"
)
.hidden = false;

loadDashboard();

}

/* =========================
DASHBOARD
========================= */

async function loadDashboard() {

await Promise.all([
loadOrders(),
loadInventory()
]);

}

/* =========================
ORDERS
========================= */

async function loadOrders() {

const container =
document.getElementById(
"ordersList"
);

container.innerHTML =
'<div class="loading">Loading orders...</div>';

try {

```
const response =
  await api(
    "adminOrders"
  );


if (!response.ok) {

  throw new Error(
    response.error
  );

}


const orders =
  response.orders || [];


updateStats(orders);


if (!orders.length) {

  container.innerHTML = `
    <div class="empty">
      <h3>No orders yet</h3>
      <p>
        Customer orders will appear here.
      </p>
    </div>
  `;

  return;

}


container.innerHTML =
  orders.map(
    createOrderCard
  ).join("");


document
  .querySelectorAll(
    ".save-order"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () =>
        saveOrder(
          button.dataset.order
        )
    );

  });
```

} catch (error) {

```
container.innerHTML = `
  <div class="error-box">
    ${escapeHTML(
      error.message
    )}
  </div>
`;
```

}

}

/* =========================
ORDER CARD
========================= */

function createOrderCard(order) {

const id =
escapeHTML(
order.orderNumber
);

return `

```
<article class="order-card">

  <div class="order-main">

    <div>

      <div class="order-number">
        ${id}
      </div>

      <h3>
        ${escapeHTML(
          order.printName
        )}
      </h3>

      <p class="customer-name">
        ${escapeHTML(
          order.name
        )}
      </p>

    </div>


    <div class="order-details">

      <div>
        <span>Contact</span>
        <strong>
          ${escapeHTML(
            order.contact
          )}
        </strong>
      </div>


      <div>
        <span>Quantity</span>
        <strong>
          ${escapeHTML(
            order.quantity
          )}
        </strong>
      </div>


      <div>
        <span>Filament</span>
        <strong>
          ${escapeHTML(
            order.filamentType
          )}
          /
          ${escapeHTML(
            order.color
          )}
        </strong>
      </div>


      <div>
        <span>Notes</span>
        <strong>
          ${
            order.notes
              ? escapeHTML(
                  order.notes
                )
              : "None"
          }
        </strong>
      </div>

    </div>


    <div class="file-area">

      ${
        order.fileUrl

          ? `
            <a
              class="button secondary"
              href="${escapeHTML(
                order.fileUrl
              )}"
              target="_blank"
              rel="noopener"
            >
              Open 3D File
            </a>
          `

          : `
            <span class="help">
              No file uploaded
            </span>
          `
      }

    </div>

  </div>


  <div class="order-controls">

    <div class="form-group">

      <label>Status</label>

      <select
        id="status-${id}"
      >

        ${statusOption(
          "New",
          order.status
        )}

        ${statusOption(
          "Approved",
          order.status
        )}

        ${statusOption(
          "Printing",
          order.status
        )}

        ${statusOption(
          "Ready",
          order.status
        )}

        ${statusOption(
          "Completed",
          order.status
        )}

        ${statusOption(
          "Cancelled",
          order.status
        )}

      </select>

    </div>


    <div class="form-group">

      <label>ETA</label>

      <input
        id="eta-${id}"
        value="${escapeHTML(
          order.eta || ""
        )}"
        placeholder="September 5"
      >

    </div>


    <button
      class="button save-order"
      data-order="${id}"
    >
      Save changes
    </button>

  </div>

</article>
```

`;

}

/* =========================
STATUS OPTION
========================= */

function statusOption(
value,
current
) {

return `     <option
      value="${value}"
      ${value === current
        ? "selected"
        : ""}     >
      ${value}     </option>
  `;

}

/* =========================
SAVE ORDER
========================= */

async function saveOrder(
orderNumber
) {

const status =
document.getElementById(
"status-" + orderNumber
).value;

const eta =
document.getElementById(
"eta-" + orderNumber
).value;

try {

```
const response =
  await api(
    "updateOrder",
    {
      orderNumber,
      status,
      eta
    }
  );


if (!response.ok) {

  throw new Error(
    response.error
  );

}


alert(
  "Order updated."
);


loadOrders();
```

} catch (error) {

```
alert(
  error.message
);
```

}

}

/* =========================
STATS
========================= */

function updateStats(
orders
) {

const open =
orders.filter(
order =>
order.status !==
"Completed" &&
order.status !==
"Cancelled"
).length;

const completed =
orders.filter(
order =>
order.status ===
"Completed"
).length;

document.getElementById(
"stats"
).innerHTML = `

```
<div class="stat-card">

  <span>
    TOTAL ORDERS
  </span>

  <strong>
    ${orders.length}
  </strong>

</div>


<div class="stat-card">

  <span>
    OPEN ORDERS
  </span>

  <strong>
    ${open}
  </strong>

</div>


<div class="stat-card">

  <span>
    COMPLETED
  </span>

  <strong>
    ${completed}
  </strong>

</div>
```

`;

}

/* =========================
INVENTORY
========================= */

async function loadInventory() {

const container =
document.getElementById(
"inventoryList"
);

try {

```
const response =
  await api(
    "adminInventory"
  );


if (!response.ok) {

  throw new Error(
    response.error
  );

}


const inventory =
  response.inventory || [];


if (!inventory.length) {

  container.innerHTML = `
    <div class="empty">
      No filament has been added.
    </div>
  `;

  return;

}


container.innerHTML =
  inventory
    .map(
      item => {

        const inStock =
          String(
            item.inStock
          ).toLowerCase() !==
          "false";


        return `

          <div
            class="inventory-row"
          >

            <div>

              <strong>
                ${escapeHTML(
                  item.type
                )}
              </strong>

              <span>
                ${escapeHTML(
                  item.color
                )}
              </span>

            </div>


            <button
              class="stock-button
                ${
                  inStock
                    ? "in-stock"
                    : "out-stock"
                }"
              data-type="${escapeHTML(
                item.type
              )}"
              data-color="${escapeHTML(
                item.color
              )}"
              data-stock="${inStock}"
            >

              ${
                inStock
                  ? "In stock"
                  : "Out of stock"
              }

            </button>

          </div>

        `;

      }
    )
    .join("");


document
  .querySelectorAll(
    ".stock-button"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        const current =
          button.dataset.stock ===
          "true";


        await api(
          "setInventory",
          {
            type:
              button.dataset.type,

            color:
              button.dataset.color,

            inStock:
              !current
          }
        );


        loadInventory();

      }
    );

  });
```

} catch (error) {

```
container.innerHTML = `
  <div class="error-box">
    ${escapeHTML(
      error.message
    )}
  </div>
`;
```

}

}

/* =========================
ADD INVENTORY
========================= */

document
.getElementById(
"addInventory"
)
.addEventListener(
"click",
async () => {

```
  const type =
    document
      .getElementById(
        "newFilamentType"
      )
      .value
      .trim();


  const color =
    document
      .getElementById(
        "newFilamentColor"
      )
      .value
      .trim();


  if (!type || !color) {

    alert(
      "Enter both a filament type and color."
    );

    return;

  }


  try {

    const response =
      await api(
        "setInventory",
        {
          type,
          color,
          inStock: true
        }
      );


    if (!response.ok) {

      throw new Error(
        response.error
      );

    }


    document
      .getElementById(
        "newFilamentType"
      )
      .value = "";


    document
      .getElementById(
        "newFilamentColor"
      )
      .value = "";


    loadInventory();


  } catch (error) {

    alert(
      error.message
    );

  }

}
```

);

/* =========================
REFRESH
========================= */

document
.getElementById(
"refreshOrders"
)
.addEventListener(
"click",
loadDashboard
);
