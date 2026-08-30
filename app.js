/*
FRIENDS & FAMILY PRINTS
Customer Website
*/

const API_URL =
"https://script.google.com/macros/s/AKfycbwXBlRSPgE_ufvIPhw9LqTdX95CW3YYjQcLajL4XcKAv6GbAKVErdYDiSrD0AXAK09_/exec";

let shopData = {
gallery: [],
inventory: []
};

/* =========================
API
========================= */

async function api(action, data = {}) {

if (!API_URL ||
API_URL.includes("PASTE_YOUR")) {

```
throw new Error(
  "The website has not been connected to Google Apps Script yet."
);
```

}

const url =
API_URL +
"?action=" +
encodeURIComponent(action) +
"&data=" +
encodeURIComponent(
JSON.stringify(data)
);

const response =
await fetch(url);

if (!response.ok) {
throw new Error(
"The server could not be reached."
);
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
LOAD SHOP
========================= */

async function loadShop() {

const gallery =
document.getElementById(
"galleryGrid"
);

try {

```
shopData =
  await api("catalog");


/* GALLERY */

if (!shopData.gallery.length) {

  gallery.innerHTML = `
    <div class="empty">
      <h3>No prints yet</h3>
      <p>
        Add a print to the Gallery
        sheet in Google Sheets.
      </p>
    </div>
  `;

} else {

  gallery.innerHTML =
    shopData.gallery
      .map(print => {

        const image =
          print.imageUrl
            ? `
              <img
                src="${escapeHTML(print.imageUrl)}"
                alt="${escapeHTML(print.name)}"
              >
            `
            : `
              <div class="no-image">
                3D PRINT
              </div>
            `;

        return `
          <article
            class="print-card"
          >

            ${image}

            <div class="print-info">

              <h3>
                ${escapeHTML(print.name)}
              </h3>

              <p>
                ${escapeHTML(
                  print.description
                )}
              </p>

              <button
                class="button small-button"
                onclick="selectPrint('${escapeHTML(print.id)}')"
              >
                Order this
              </button>

            </div>

          </article>
        `;

      })
      .join("");

}


/* PRINT DROPDOWN */

const printSelect =
  document.getElementById(
    "printSelect"
  );

printSelect.innerHTML = `
  <option value="">
    Choose a print...
  </option>
`;

shopData.gallery.forEach(print => {

  const option =
    document.createElement(
      "option"
    );

  option.value = print.id;

  option.textContent =
    print.name;

  printSelect.appendChild(
    option
  );

});


updateFilamentTypes();
```

} catch (error) {

```
gallery.innerHTML = `
  <div class="error-box">

    <h3>Shop unavailable</h3>

    <p>
      ${escapeHTML(
        error.message
      )}
    </p>

  </div>
`;
```

}

}

/* =========================
SELECT PRINT
========================= */

function selectPrint(id) {

const select =
document.getElementById(
"printSelect"
);

select.value = id;

document
.getElementById("order")
.scrollIntoView({
behavior: "smooth"
});

}

/* =========================
FILAMENT TYPES
========================= */

function updateFilamentTypes() {

const typeSelect =
document.getElementById(
"typeSelect"
);

const types =
[
...new Set(
shopData.inventory
.filter(item =>
String(item.inStock)
.toLowerCase() !== "false"
)
.map(item =>
item.type
)
)
];

typeSelect.innerHTML = `     <option value="">
      Choose a type...     </option>
  `;

types.forEach(type => {

```
const option =
  document.createElement(
    "option"
  );

option.value = type;
option.textContent = type;

typeSelect.appendChild(
  option
);
```

});

updateColors();

}

/* =========================
COLORS
========================= */

function updateColors() {

const type =
document.getElementById(
"typeSelect"
).value;

const colorSelect =
document.getElementById(
"colorSelect"
);

const colors =
[
...new Set(
shopData.inventory
.filter(item =>
item.type === type &&
String(item.inStock)
.toLowerCase() !== "false"
)
.map(item =>
item.color
)
)
];

colorSelect.innerHTML = `     <option value="">
      Choose a color...     </option>
  `;

colors.forEach(color => {

```
const option =
  document.createElement(
    "option"
  );

option.value = color;
option.textContent = color;

colorSelect.appendChild(
  option
);
```

});

}

/* =========================
FILE → BASE64
========================= */

function fileToBase64(file) {

return new Promise(
(resolve, reject) => {

```
  const reader =
    new FileReader();

  reader.onload = () => {

    const result =
      reader.result;

    resolve(
      result.split(",")[1]
    );

  };

  reader.onerror =
    reject;

  reader.readAsDataURL(
    file
  );

}
```

);

}

/* =========================
ORDER FORM
========================= */

document
.getElementById("orderForm")
.addEventListener(
"submit",
async function(event) {

```
  event.preventDefault();


  const result =
    document.getElementById(
      "orderResult"
    );


  result.className =
    "message";

  result.textContent =
    "Submitting your order...";


  try {

    const formData =
      new FormData(this);


    const fileInput =
      document.getElementById(
        "file"
      );


    let file = null;


    if (
      fileInput.files.length
    ) {

      const selectedFile =
        fileInput.files[0];


      if (
        selectedFile.size >
        15 * 1024 * 1024
      ) {

        throw new Error(
          "Your file is too large. Please keep it under 15 MB."
        );

      }


      const base64 =
        await fileToBase64(
          selectedFile
        );


      file = {

        name:
          selectedFile.name,

        type:
          selectedFile.type ||
          "application/octet-stream",

        base64

      };

    }


    const order = {

      name:
        formData.get("name"),

      contact:
        formData.get("contact"),

      printId:
        formData.get("printId"),

      quantity:
        Number(
          formData.get(
            "quantity"
          )
        ),

      filamentType:
        formData.get(
          "filamentType"
        ),

      color:
        formData.get(
          "color"
        ),

      notes:
        formData.get(
          "notes"
        ),

      file

    };


    const response =
      await api(
        "createOrder",
        order
      );


    if (!response.ok) {

      throw new Error(
        response.error ||
        "The order could not be submitted."
      );

    }


    result.className =
      "success-message";


    result.innerHTML = `
      <strong>
        Order submitted!
      </strong>

      <br>

      Your order number is:

      <strong>
        ${escapeHTML(
          response.orderNumber
        )}
      </strong>

      <br><br>

      Save this number so you can
      track your order.
    `;


    this.reset();

    updateFilamentTypes();


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
TRACK ORDER
========================= */

document
.getElementById("trackForm")
.addEventListener(
"submit",
async function(event) {

```
  event.preventDefault();


  const result =
    document.getElementById(
      "trackResult"
    );


  result.innerHTML =
    "<p>Looking up order...</p>";


  try {

    const orderNumber =
      new FormData(this)
        .get("orderNumber");


    const response =
      await api(
        "track",
        {
          orderNumber
        }
      );


    if (!response.ok) {

      throw new Error(
        response.error ||
        "Order not found."
      );

    }


    const order =
      response.order;


    result.innerHTML = `

      <div class="tracking-card">

        <div class="tracking-number">

          <span>
            Order
          </span>

          <strong>
            ${escapeHTML(
              order.orderNumber
            )}
          </strong>

        </div>


        <div class="tracking-status">

          <span>
            Status
          </span>

          <strong>
            ${escapeHTML(
              order.status
            )}
          </strong>

        </div>


        <div class="tracking-row">

          <span>
            Print
          </span>

          <strong>
            ${escapeHTML(
              order.printName
            )}
          </strong>

        </div>


        <div class="tracking-row">

          <span>
            Quantity
          </span>

          <strong>
            ${escapeHTML(
              order.quantity
            )}
          </strong>

        </div>


        <div class="tracking-row">

          <span>
            Filament
          </span>

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


        <div class="tracking-row">

          <span>
            Estimated completion
          </span>

          <strong>
            ${
              order.eta
                ? escapeHTML(
                    order.eta
                  )
                : "Not set yet"
            }
          </strong>

        </div>

      </div>

    `;


  } catch (error) {

    result.innerHTML = `
      <div class="error-box">
        ${escapeHTML(
          error.message
        )}
      </div>
    `;

  }

}
```

);

/* =========================
START
========================= */

document
.getElementById("typeSelect")
.addEventListener(
"change",
updateColors
);

loadShop();
