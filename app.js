const API_URL = "https://script.google.com/macros/s/AKfycbwXBlRSPgE_ufvIPhw9LqTdX95CW3YYjQcLajL4XcKAv6GbAKVErdYDiSrD0AXAK09_/exec";


let shopData = {
  gallery: [],
  inventory: []
};


async function api(action, data) {

  if (data === undefined) {
    data = {};
  }

  const url =
    API_URL +
    "?action=" +
    encodeURIComponent(action) +
    "&data=" +
    encodeURIComponent(JSON.stringify(data));

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Google Apps Script returned an error."
    );
  }

  return await response.json();
}


function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


async function loadShop() {

  const gallery =
    document.getElementById("galleryGrid");

  try {

    const response =
      await api("catalog");

    shopData = response;

    loadGallery();
    loadPrints();
    loadFilamentTypes();

  } catch (error) {

    gallery.innerHTML =
      "<div class='error-box'>" +
      "<h3>Shop unavailable</h3>" +
      "<p>" +
      escapeHTML(error.message) +
      "</p>" +
      "</div>";

    console.error(error);

  }

}


function loadGallery() {

  const gallery =
    document.getElementById("galleryGrid");

  const prints =
    shopData.gallery || [];

  if (prints.length === 0) {

    gallery.innerHTML =
      "<div class='empty'>" +
      "<h3>No prints yet</h3>" +
      "<p>Add prints to the Gallery sheet.</p>" +
      "</div>";

    return;

  }


  gallery.innerHTML =
    prints.map(function(print) {

      let image = "";

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
            escapeHTML(
              print.description
            ) +
            "</p>" +

            "<button " +
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

      button.addEventListener(
        "click",
        function() {

          const orderType =
            document.getElementById(
              "orderType"
            );

          const printSelect =
            document.getElementById(
              "printSelect"
            );

          orderType.value =
            "gallery";

          updateOrderType();

          printSelect.value =
            button.dataset.id;

          document
            .getElementById("order")
            .scrollIntoView({
              behavior: "smooth"
            });

        }
      );

    });

}


function loadPrints() {

  const select =
    document.getElementById(
      "printSelect"
    );

  select.innerHTML =
    "<option value=''>" +
    "Choose a print..." +
    "</option>";


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
    document.getElementById(
      "typeSelect"
    );

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
    "<option value=''>" +
    "Choose a type..." +
    "</option>";


  types.forEach(function(type) {

    const option =
      document.createElement("option");

    option.value =
      type;

    option.textContent =
      type;

    select.appendChild(option);

  });


  loadColors();

}


function loadColors() {

  const type =
    document.getElementById(
      "typeSelect"
    ).value;


  const colorSelect =
    document.getElementById(
      "colorSelect"
    );


  colorSelect.innerHTML =
    "<option value=''>" +
    "Choose a color..." +
    "</option>";


  if (!type) {
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
        item.type === type &&
        item.color &&
        !colors.includes(item.color)
      ) {

        colors.push(item.color);

      }

    });


  colors.forEach(function(color) {

    const option =
      document.createElement("option");

    option.value =
      color;

    option.textContent =
      color;

    colorSelect.appendChild(option);

  });

}


function updateOrderType() {

  const type =
    document.getElementById(
      "orderType"
    ).value;


  const galleryChoice =
    document.getElementById(
      "galleryChoice"
    );


  const customFileChoice =
    document.getElementById(
      "customFileChoice"
    );


  const printSelect =
    document.getElementById(
      "printSelect"
    );


  const fileInput =
    document.getElementById(
      "file"
    );


  if (type === "gallery") {

    galleryChoice.style.display =
      "block";

    customFileChoice.style.display =
      "none";

    printSelect.required =
      true;

    fileInput.required =
      false;

  }

  else if (type === "custom") {

    galleryChoice.style.display =
      "none";

    customFileChoice.style.display =
      "block";

    printSelect.required =
      false;

    fileInput.required =
      true;

  }

  else {

    galleryChoice.style.display =
      "none";

    customFileChoice.style.display =
      "none";

    printSelect.required =
      false;

    fileInput.required =
      false;

  }

}


function fileToBase64(file) {

  return new Promise(function(resolve, reject) {

    const reader =
      new FileReader();


    reader.onload =
      function() {

        const result =
          reader.result;

        resolve(
          result.split(",")[1]
        );

      };


    reader.onerror =
      reject;


    reader.readAsDataURL(file);

  });

}


document
  .getElementById("orderType")
  .addEventListener(
    "change",
    updateOrderType
  );


document
  .getElementById("typeSelect")
  .addEventListener(
    "change",
    loadColors
  );


document
  .getElementById("orderForm")
  .addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      const result =
        document.getElementById(
          "orderResult"
        );


      result.textContent =
        "Submitting order...";


      try {

        const formData =
          new FormData(this);


        const orderType =
          formData.get(
            "orderType"
          );


        let file = null;


        const fileInput =
          document.getElementById(
            "file"
          );


        if (
          orderType === "custom" &&
          fileInput.files.length > 0
        ) {

          const selectedFile =
            fileInput.files[0];


          if (
            selectedFile.size >
            15 * 1024 * 1024
          ) {

            throw new Error(
              "Your file must be smaller than 15 MB."
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

          orderType:
            orderType,

          printId:
            formData.get("printId"),

          quantity:
            Number(
              formData.get("quantity")
            ),

          filamentType:
            formData.get(
              "filamentType"
            ),

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


        if (
          response &&
          response.ok === false
        ) {

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


        this.reset();


        updateOrderType();
        loadFilamentTypes();


      } catch (error) {

        result.className =
          "error-message";

        result.textContent =
          error.message;

        console.error(error);

      }

    }
  );


document
  .getElementById("trackForm")
  .addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      const result =
        document.getElementById(
          "trackResult"
        );


      result.innerHTML =
        "<p>Looking up order...</p>";


      try {

        const formData =
          new FormData(this);


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


        if (
          response.ok === false
        ) {

          throw new Error(
            response.error ||
            "Order not found."
          );

        }


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
                order.status
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
                order.filamentType
              ) +
              " / " +
              escapeHTML(
                order.color
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


updateOrderType();
loadShop();
