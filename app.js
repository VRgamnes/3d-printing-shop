const API_URL = "https://script.google.com/macros/s/AKfycbwXBlRSPgE_ufvIPhw9LqTdX95CW3YYjQcLajL4XcKAv6GbAKVErdYDiSrD0AXAK09_/exec";

let shopData = {
  gallery: [],
  inventory: []
};

let staffToken = localStorage.getItem("staffToken") || "";


/* =========================
   API
========================= */

async function api(action, data = {}) {

  const url =
    API_URL +
    "?action=" +
    encodeURIComponent(action) +
    "&data=" +
    encodeURIComponent(JSON.stringify(data));

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not connect to the server.");
  }

  const result = await response.json();

  if (result.ok === false) {
    throw new Error(result.error || "Server error.");
  }

  return result;
}


/* =========================
   HTML SAFETY
========================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   LOAD EVERYTHING
========================= */

async function loadShop() {

  try {

    const data = await api("catalog");

    shopData.gallery =
      Array.isArray(data.gallery)
        ? data.gallery
        : [];

    shopData.inventory =
      Array.isArray(data.inventory)
        ? data.inventory
        : [];

    showGallery();
    showPrints();
    showFilamentTypes();

  } catch (error) {

    console.error(error);

    const gallery =
      document.getElementById("galleryGrid");

    if (gallery) {
      gallery.innerHTML =
        "<div class='error-box'>" +
        "<h3>Shop unavailable</h3>" +
        "<p>" +
        escapeHTML(error.message) +
        "</p>" +
        "</div>";
    }
  }
}


/* =========================
   GALLERY
========================= */

function showGallery() {

  const gallery =
    document.getElementById("galleryGrid");

  if (!gallery) {
    return;
  }

  if (shopData.gallery.length === 0) {

    gallery.innerHTML =
      "<div class='empty'>" +
      "<h3>No prints yet</h3>" +
      "<p>Add prints to the Gallery sheet.</p>" +
      "</div>";

    return;
  }

  gallery.innerHTML =
    shopData.gallery.map(function(print) {

      let image;

      if (print.imageUrl) {

        image =
          "<img src='" +
          escapeHTML(print.imageUrl) +
          "' alt='" +
          escapeHTML(print.name) +
          "'>";

      } else {

        image =
          "<div class='no-image'>3D PRINT</div>";
      }

      return (
        "<article class='print-card'>" +
          image +
          "<div class='print-info'>" +
            "<h3>" +
            escapeHTML(print.name) +
            "</h3>" +
            "<p>" +
            escapeHTML(print.description || "") +
            "</p>" +
            "<button " +
            "type='button' " +
            "class='button order-print' " +
            "data-id='" +
            escapeHTML(print.id) +
            "'>" +
            "Order this" +
            "</button>" +
          "</div>" +
        "</article>"
      );

    }).join("");

  document
    .querySelectorAll(".order-print")
    .forEach(function(button) {

      button.addEventListener("click", function() {

        const orderType =
          document.getElementById("orderType");

        const printSelect =
          document.getElementById("printSelect");

        if (orderType) {
          orderType.value = "gallery";
          updateOrderType();
        }

        if (printSelect) {
          printSelect.value =
            button.dataset.id;
        }

        const order =
          document.getElementById("order");

        if (order) {
          order.scrollIntoView({
            behavior: "smooth"
          });
        }

      });

    });
}


/* =========================
   PRINT DROPDOWN
========================= */

function showPrints() {

  const select =
    document.getElementById("printSelect");

  if (!select) {
    return;
  }

  select.innerHTML =
    "<option value=''>" +
    "Choose a print..." +
    "</option>";

  shopData.gallery.forEach(function(print) {

    const option =
      document.createElement("option");

    option.value = print.id;
    option.textContent = print.name;

    select.appendChild(option);

  });
}


/* =========================
   FILAMENT TYPES
========================= */

function showFilamentTypes() {

  const select =
    document.getElementById("typeSelect");

  if (!select) {
    return;
  }

  const types = [];

  shopData.inventory.forEach(function(item) {

    const stock =
      String(item.inStock)
        .trim()
        .toLowerCase();

    const available =
      stock !== "false" &&
      stock !== "no" &&
      stock !== "0";

    const type =
      String(item.type || "").trim();

    if (
      available &&
      type &&
      !types.some(function(existing) {
        return existing.toLowerCase() ===
          type.toLowerCase();
      })
    ) {
      types.push(type);
    }

  });

  select.innerHTML =
    "<option value=''>" +
    "Choose a filament..." +
    "</option>";

  types.forEach(function(type) {

    const option =
      document.createElement("option");

    option.value = type;
    option.textContent = type;

    select.appendChild(option);

  });

  /*
   * IMPORTANT:
   * We do NOT touch the color
   * dropdown here.
   */

}


/* =========================
   COLORS
========================= */

function showColors() {

  const typeSelect =
    document.getElementById("typeSelect");

  const colorSelect =
    document.getElementById("colorSelect");

  if (!typeSelect || !colorSelect) {
    return;
  }

  const selectedType =
    String(typeSelect.value || "").trim();

  /*
   * No filament selected
   */

  if (!selectedType) {

    colorSelect.innerHTML =
      "<option value=''>" +
      "Select filament first" +
      "</option>";

    return;
  }


  /*
   * A filament IS selected.
   * Now find its colors.
   */

  const colors = [];

  shopData.inventory.forEach(function(item) {

    const type =
      String(item.type || "").trim();

    const color =
      String(item.color || "").trim();

    const stock =
      String(item.inStock)
        .trim()
        .toLowerCase();

    const available =
      stock !== "false" &&
      stock !== "no" &&
      stock !== "0";

    if (
      available &&
      type.toLowerCase() ===
        selectedType.toLowerCase() &&
      color
    ) {

      const exists =
        colors.some(function(existing) {
          return existing.toLowerCase() ===
            color.toLowerCase();
        });

      if (!exists) {
        colors.push(color);
      }
    }

  });


  /*
   * Build the dropdown ONCE.
   */

  colorSelect.innerHTML =
    "<option value=''>" +
    "Choose a color..." +
    "</option>";


  colors.forEach(function(color) {

    const option =
      document.createElement("option");

    option.value = color;
    option.textContent = color;

    colorSelect.appendChild(option);

  });


  /*
   * If there are no colors.
   */

  if (colors.length === 0) {

    colorSelect.innerHTML =
      "<option value=''>" +
      "No colors available" +
      "</option>";

  }

}


/* =========================
   ORDER TYPE
========================= */

function updateOrderType() {

  const orderType =
    document.getElementById("orderType");

  if (!orderType) {
    return;
  }

  const type = orderType.value;

  const galleryChoice =
    document.getElementById("galleryChoice");

  const customFileChoice =
    document.getElementById("customFileChoice");

  const ideaChoice =
    document.getElementById("ideaChoice");

  const linkChoice =
    document.getElementById("linkChoice");

  const printSelect =
    document.getElementById("printSelect");

  const file =
    document.getElementById("file");

  const idea =
    document.getElementById("idea");

  const modelLink =
    document.getElementById("modelLink");


  if (galleryChoice)
    galleryChoice.style.display = "none";

  if (customFileChoice)
    customFileChoice.style.display = "none";

  if (ideaChoice)
    ideaChoice.style.display = "none";

  if (linkChoice)
    linkChoice.style.display = "none";


  if (printSelect)
    printSelect.required = false;

  if (file)
    file.required = false;

  if (idea)
    idea.required = false;

  if (modelLink)
    modelLink.required = false;


  if (type === "gallery") {

    if (galleryChoice)
      galleryChoice.style.display = "block";

    if (printSelect)
      printSelect.required = true;
  }


  if (type === "file") {

    if (customFileChoice)
      customFileChoice.style.display = "block";

    if (file)
      file.required = true;
  }


  if (type === "idea") {

    if (ideaChoice)
      ideaChoice.style.display = "block";

    if (idea)
      idea.required = true;
  }


  if (type === "link") {

    if (linkChoice)
      linkChoice.style.display = "block";

    if (modelLink)
      modelLink.required = true;
  }

}


/* =========================
   FILE READER
========================= */

function fileToBase64(file) {

  return new Promise(function(resolve, reject) {

    const reader =
      new FileReader();

    reader.onload = function() {

      const result =
        String(reader.result);

      const comma =
        result.indexOf(",");

      if (comma === -1) {
        reject(
          new Error("Could not read file.")
        );
        return;
      }

      resolve(
        result.substring(comma + 1)
      );
    };

    reader.onerror = function() {

      reject(
        new Error("Could not read file.")
      );

    };

    reader.readAsDataURL(file);

  });
}


/* =========================
   ORDER FORM
========================= */

function setupOrderForm() {

  const form =
    document.getElementById("orderForm");

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      const result =
        document.getElementById(
          "orderResult"
        );

      if (result) {
        result.textContent =
          "Submitting order...";
        result.className =
          "success-message";
      }

      try {

        const formData =
          new FormData(form);

        const orderType =
          formData.get("orderType");

        let uploadedFile = null;


        if (orderType === "file") {

          const fileInput =
            document.getElementById("file");

          if (
            !fileInput ||
            fileInput.files.length === 0
          ) {
            throw new Error(
              "Please choose a 3D model file."
            );
          }

          const file =
            fileInput.files[0];

          if (
            file.size >
            15 * 1024 * 1024
          ) {
            throw new Error(
              "File must be smaller than 15 MB."
            );
          }

          uploadedFile = {
            name: file.name,
            type:
              file.type ||
              "application/octet-stream",
            base64:
              await fileToBase64(file)
          };
        }


        const order = {

          name:
            formData.get("name"),

          contact:
            formData.get("contact"),

          orderType:
            orderType,

          printId:
            formData.get("printId"),

          idea:
            formData.get("idea"),

          modelLink:
            formData.get("modelLink"),

          quantity:
            Number(
              formData.get("quantity") || 1
            ),

          filamentType:
            formData.get("filamentType"),

          color:
            formData.get("color"),

          notes:
            formData.get("notes"),

          file:
            uploadedFile
        };


        const response =
          await api(
            "createOrder",
            order
          );


        if (result) {

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

          result.className =
            "success-message";
        }


        form.reset();

        updateOrderType();

        /*
         * IMPORTANT:
         * Don't reload filament types here.
         * That could interfere with colors.
         */

        showColors();


      } catch (error) {

        console.error(error);

        if (result) {

          result.textContent =
            error.message;

          result.className =
            "error-message";
        }

      }

    }
  );

}


/* =========================
   TRACKING
========================= */

function setupTracking() {

  const form =
    document.getElementById(
      "trackForm"
    );

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      const result =
        document.getElementById(
          "trackResult"
        );

      if (result) {
        result.innerHTML =
          "<p>Looking up order...</p>";
      }

      try {

        const formData =
          new FormData(form);

        const response =
          await api(
            "track",
            {
              orderNumber:
                formData.get(
                  "orderNumber"
                )
            }
          );

        const order =
          response.order;


        result.innerHTML =

          "<div class='tracking-card'>" +

            "<div class='tracking-number'>" +
              "<span>Order</span>" +
              "<strong>" +
                escapeHTML(
                  order.orderNumber
                ) +
              "</strong>" +
            "</div>" +

            "<div class='tracking-status'>" +
              "<span>Status</span>" +
              "<strong>" +
                escapeHTML(
                  order.status || "New"
                ) +
              "</strong>" +
            "</div>" +

            "<div class='tracking-row'>" +
              "<span>Print</span>" +
              "<strong>" +
                escapeHTML(
                  order.printName ||
                  "Customer model"
                ) +
              "</strong>" +
            "</div>" +

            "<div class='tracking-row'>" +
              "<span>Quantity</span>" +
              "<strong>" +
                escapeHTML(
                  order.quantity
                ) +
              "</strong>" +
            "</div>" +

            "<div class='tracking-row'>" +
              "<span>Filament</span>" +
              "<strong>" +
                escapeHTML(
                  order.filamentType || ""
                ) +
                " / " +
                escapeHTML(
                  order.color || ""
                ) +
              "</strong>" +
            "</div>" +

            "<div class='tracking-row'>" +
              "<span>Estimated completion</span>" +
              "<strong>" +
                (
                  order.eta
                    ? escapeHTML(order.eta)
                    : "Not set yet"
                ) +
              "</strong>" +
            "</div>" +

          "</div>";

      } catch (error) {

        result.innerHTML =
          "<div class='error-box'>" +
          escapeHTML(
            error.message
          ) +
          "</div>";

      }

    }
  );

}


/* =========================
   START
========================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    const typeSelect =
      document.getElementById(
        "typeSelect"
      );

    if (typeSelect) {

      typeSelect.addEventListener(
        "change",
        function() {
          showColors();
        }
      );

    }


    const orderType =
      document.getElementById(
        "orderType"
      );

    if (orderType) {

      orderType.addEventListener(
        "change",
        updateOrderType
      );

    }


    setupOrderForm();

    setupTracking();

    updateOrderType();

    loadShop();

  }
);
