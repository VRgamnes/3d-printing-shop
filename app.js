const API_URL = "https://script.google.com/macros/s/AKfycbwXBlRSPgE_ufvIPhw9LqTdX95CW3YYjQcLajL4XcKAv6GbAKVErdYDiSrD0AXAK09_/exec";

let shopData = {
  gallery: [],
  inventory: []
};

async function api(action, data = {}) {
  const url =
    API_URL +
    "?action=" +
    encodeURIComponent(action) +
    "&data=" +
    encodeURIComponent(JSON.stringify(data));

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not connect to Google Apps Script.");
  }

  return await response.json();
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadShop() {
  const gallery = document.getElementById("galleryGrid");

  if (!gallery) {
    return;
  }

  try {
    const response = await api("catalog");

 
  

    shopData = response;

    loadGallery();
    loadPrints();
    loadFilamentTypes();

  } catch (error) {
    gallery.innerHTML =
      '<div class="error-box">' +
      '<h3>Shop unavailable</h3>' +
      '<p>' +
      escapeHTML(error.message) +
      '</p>' +
      '</div>';
  }
}

function loadGallery() {
  const gallery =
    document.getElementById("galleryGrid");

  const prints =
    shopData.gallery || [];

  if (prints.length === 0) {
    gallery.innerHTML =
      '<div class="empty">' +
      '<h3>No prints yet</h3>' +
      '<p>Add a print to the Gallery sheet.</p>' +
      '</div>';

    return;
  }

  gallery.innerHTML = prints.map(function(print) {

    let imageHTML;

    if (print.imageUrl) {
      imageHTML =
        '<img src="' +
        escapeHTML(print.imageUrl) +
        '" alt="' +
        escapeHTML(print.name) +
        '">';
    } else {
      imageHTML =
        '<div class="no-image">3D PRINT</div>';
    }

    return (
      '<article class="print-card">' +

        imageHTML +

        '<div class="print-info">' +

          '<h3>' +
          escapeHTML(print.name) +
          '</h3>' +

          '<p>' +
          escapeHTML(print.description || "") +
          '</p>' +

          '<button class="button order-print" ' +
          'data-id="' +
          escapeHTML(print.id) +
          '">' +
          'Order this' +
          '</button>' +

        '</div>' +

      '</article>'
    );

  }).join("");

  document
    .querySelectorAll(".order-print")
    .forEach(function(button) {

      button.addEventListener(
        "click",
        function() {

          const select =
            document.getElementById("printSelect");

          if (select) {
            select.value =
              button.dataset.id;
          }

          const order =
            document.getElementById("order");

          if (order) {
            order.scrollIntoView({
              behavior: "smooth"
            });
          }

        }
      );

    });
}

function loadPrints() {
  const select =
    document.getElementById("printSelect");

  if (!select) {
    return;
  }

  select.innerHTML =
    '<option value="">Choose a print...</option>';

  (shopData.gallery || [])
    .forEach(function(print) {

      const option =
        document.createElement("option");

      option.value =
        print.id;

      option.textContent =
        print.name;

      select.appendChild(option);

    });
}

function loadFilamentTypes() {
  const select =
    document.getElementById("typeSelect");

  if (!select) {
    return;
  }

  const types = [];

  (shopData.inventory || [])
    .forEach(function(item) {

      const available =
        String(item.inStock)
          .toLowerCase() !== "false";

      if (
        available &&
        item.type &&
        !types.includes(item.type)
      ) {
        types.push(item.type);
      }

    });

  select.innerHTML =
    '<option value="">Choose a type...</option>';

  types.forEach(function(type) {

    const option =
      document.createElement("option");

    option.value = type;
    option.textContent = type;

    select.appendChild(option);

  });

  loadColors();
}

function loadColors() {
  const typeSelect =
    document.getElementById("typeSelect");

  const colorSelect =
    document.getElementById("colorSelect");

  if (!typeSelect || !colorSelect) {
    return;
  }

  const selectedType =
    typeSelect.value;

  colorSelect.innerHTML =
    '<option value="">Choose a color...</option>';

  if (!selectedType) {
    return;
  }

  const colors = [];

  (shopData.inventory || [])
    .forEach(function(item) {

      const available =
        String(item.inStock)
          .toLowerCase() !== "false";

      if (
        available &&
        item.type === selectedType &&
        item.color &&
        !colors.includes(item.color)
      ) {
        colors.push(item.color);
      }

    });

  colors.forEach(function(color) {

    const option =
      document.createElement("option");

    option.value = color;
    option.textContent = color;

    colorSelect.appendChild(option);

  });
}

function fileToBase64(file) {
  return new Promise(function(resolve, reject) {

    const reader =
      new FileReader();

    reader.onload = function() {

      const result =
        reader.result;

      const base64 =
        result.split(",")[1];

      resolve(base64);

    };

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });
}

const typeSelect =
  document.getElementById("typeSelect");

if (typeSelect) {

  typeSelect.addEventListener(
    "change",
    loadColors
  );

}

const orderForm =
  document.getElementById("orderForm");

if (orderForm) {

  orderForm.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      const result =
        document.getElementById("orderResult");

      result.textContent =
        "Submitting order...";

      try {

        const formData =
          new FormData(orderForm);

        let file = null;

        const fileInput =
          document.getElementById("file");

        if (
          fileInput &&
          fileInput.files.length > 0
        ) {

          const selectedFile =
            fileInput.files[0];

          if (
            selectedFile.size >
            15 * 1024 * 1024
          ) {

            throw new Error(
              "File must be smaller than 15 MB."
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

            base64:
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
              formData.get("quantity")
            ),

          filamentType:
            formData.get("filamentType"),

          color:
            formData.get("color"),

          notes:
            formData.get("notes"),

          file:
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
            "Order could not be submitted."
          );

        }

        result.className =
          "success-message";

        result.innerHTML =
          "<strong>Order submitted!</strong>" +
          "<br><br>" +
          "Your order number is " +
          "<strong>" +
          escapeHTML(
            response.orderNumber
          ) +
          "</strong>" +
          "<br><br>" +
          "Save this number to track your order.";

        orderForm.reset();

        loadFilamentTypes();

      } catch (error) {

        result.className =
          "error-message";

        result.textContent =
          error.message;

      }

    }
  );

}

const trackForm =
  document.getElementById("trackForm");

if (trackForm) {

  trackForm.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      const result =
        document.getElementById("trackResult");

      result.innerHTML =
        "<p>Looking up order...</p>";

      try {

        const formData =
          new FormData(trackForm);

        const orderNumber =
          formData.get("orderNumber");

        const response =
          await api(
            "track",
            {
              orderNumber:
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

        result.innerHTML =
          '<div class="tracking-card">' +

            '<div class="tracking-number">' +
              '<span>Order</span>' +
              '<strong>' +
              escapeHTML(
                order.orderNumber
              ) +
              '</strong>' +
            '</div>' +

            '<div class="tracking-status">' +
              '<span>Status</span>' +
              '<strong>' +
              escapeHTML(
                order.status
              ) +
              '</strong>' +
            '</div>' +

            '<div class="tracking-row">' +
              '<span>Print</span>' +
              '<strong>' +
              escapeHTML(
                order.printName
              ) +
              '</strong>' +
            '</div>' +

            '<div class="tracking-row">' +
              '<span>Quantity</span>' +
              '<strong>' +
              escapeHTML(
                order.quantity
              ) +
              '</strong>' +
            '</div>' +

            '<div class="tracking-row">' +
              '<span>Filament</span>' +
              '<strong>' +
              escapeHTML(
                order.filamentType
              ) +
              " / " +
              escapeHTML(
                order.color
              ) +
              '</strong>' +
            '</div>' +

            '<div class="tracking-row">' +
              '<span>Estimated completion</span>' +
              '<strong>' +
              (
                order.eta
                  ? escapeHTML(order.eta)
                  : "Not set yet"
              ) +
              '</strong>' +
            '</div>' +

          '</div>';

      } catch (error) {

        result.innerHTML =
          '<div class="error-box">' +
          escapeHTML(error.message) +
          '</div>';

      }

    }
  );

}

loadShop();
