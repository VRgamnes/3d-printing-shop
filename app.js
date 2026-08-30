const API_URL = "https://script.google.com/macros/s/AKfycbyaH7bu_g5t-FRx6MjZmznhVbo6gDIkJLRiSCvR5zV5wj9lVEPT-dxMjMqKNqu8qwtB2A/exec";

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
    encodeURIComponent(
      JSON.stringify(data)
    );

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Could not connect to the shop server."
    );
  }

  const result =
    await response.json();

  if (
    result &&
    result.ok === false
  ) {
    throw new Error(
      result.error ||
      "The server returned an error."
    );
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
   LOAD SHOP
========================= */

async function loadShop() {

  const gallery =
    document.getElementById(
      "galleryGrid"
    );

  try {

    const response =
      await api("catalog");

    shopData = {
      gallery:
        response.gallery || [],

      inventory:
        response.inventory || []
    };

    loadGallery();
    loadPrints();
    loadFilamentTypes();

  } catch (error) {

    if (gallery) {

      gallery.innerHTML =
        "<div class='error-box'>" +
        "<h3>Shop unavailable</h3>" +
        "<p>" +
        escapeHTML(error.message) +
        "</p>" +
        "</div>";

    }

    console.error(error);
  }
}


/* =========================
   GALLERY
========================= */

function loadGallery() {

  const gallery =
    document.getElementById(
      "galleryGrid"
    );

  if (!gallery) {
    return;
  }

  const prints =
    shopData.gallery || [];

  if (prints.length === 0) {

    gallery.innerHTML =
      "<div class='empty'>" +
      "<h3>No prints yet</h3>" +
      "<p>Add a print to the Gallery sheet.</p>" +
      "</div>";

    return;
  }


  gallery.innerHTML =
    prints.map(function(print) {

      let imageHTML;

      if (print.imageUrl) {

        imageHTML =
          "<img src='" +
          escapeHTML(print.imageUrl) +
          "' alt='" +
          escapeHTML(print.name) +
          "'>";

      } else {

        imageHTML =
          "<div class='no-image'>" +
          "3D PRINT" +
          "</div>";

      }


      return (
        "<article class='print-card'>" +

          imageHTML +

          "<div class='print-info'>" +

            "<h3>" +
            escapeHTML(print.name) +
            "</h3>" +

            "<p>" +
            escapeHTML(
              print.description || ""
            ) +
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
    .querySelectorAll(
      ".order-print"
    )
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

          if (orderType) {

            orderType.value =
              "gallery";

            updateOrderType();

          }

          if (printSelect) {

            printSelect.value =
              button.dataset.id;

          }

          const order =
            document.getElementById(
              "order"
            );

          if (order) {

            order.scrollIntoView({
              behavior: "smooth"
            });

          }

        }
      );

    });

}


/* =========================
   PRINT SELECT
========================= */

function loadPrints() {

  const select =
    document.getElementById(
      "printSelect"
    );

  if (!select) {
    return;
  }

  select.innerHTML =
    "<option value=''>" +
    "Choose a print..." +
    "</option>";


  (shopData.gallery || [])
    .forEach(function(print) {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        print.id;

      option.textContent =
        print.name;

      select.appendChild(option);

    });

}


/* =========================
   FILAMENT TYPES
========================= */

function loadFilamentTypes() {

  const select =
    document.getElementById(
      "typeSelect"
    );

  if (!select) {
    return;
  }

  const types = [];


  (shopData.inventory || [])
    .forEach(function(item) {

      const available =
        String(item.inStock)
          .toLowerCase() !==
        "false";


      if (
        available &&
        item.type &&
        !types.includes(
          item.type
        )
      ) {

        types.push(
          item.type
        );

      }

    });


  select.innerHTML =
    "<option value=''>" +
    "Choose a type..." +
    "</option>";


  types.forEach(function(type) {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      type;

    option.textContent =
      type;

    select.appendChild(
      option
    );

  });


  loadColors();

}


/* =========================
   COLORS
========================= */

function loadColors() {

  const typeSelect =
    document.getElementById(
      "typeSelect"
    );

  const colorSelect =
    document.getElementById(
      "colorSelect"
    );

  if (!typeSelect ||
      !colorSelect) {
    return;
  }


  const type =
    typeSelect.value;


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
          .toLowerCase() !==
        "false";


      if (
        available &&
        String(item.type) ===
          String(type) &&
        item.color &&
        !colors.includes(
          item.color
        )
      ) {

        colors.push(
          item.color
        );

      }

    });


  colors.forEach(function(color) {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      color;

    option.textContent =
      color;

    colorSelect.appendChild(
      option
    );

  });

}


/* =========================
   ORDER TYPE
========================= */

function updateOrderType() {

  const typeElement =
    document.getElementById(
      "orderType"
    );

  if (!typeElement) {
    return;
  }

  const type =
    typeElement.value;


  const galleryChoice =
    document.getElementById(
      "galleryChoice"
    );

  const customFileChoice =
    document.getElementById(
      "customFileChoice"
    );

  const ideaChoice =
    document.getElementById(
      "ideaChoice"
    );

  const linkChoice =
    document.getElementById(
      "linkChoice"
    );

  const printSelect =
    document.getElementById(
      "printSelect"
    );

  const fileInput =
    document.getElementById(
      "file"
    );

  const ideaInput =
    document.getElementById(
      "idea"
    );

  const linkInput =
    document.getElementById(
      "modelLink"
    );


  /* Hide everything */

  if (galleryChoice) {
    galleryChoice.style.display =
      "none";
  }

  if (customFileChoice) {
    customFileChoice.style.display =
      "none";
  }

  if (ideaChoice) {
    ideaChoice.style.display =
      "none";
  }

  if (linkChoice) {
    linkChoice.style.display =
      "none";
  }


  if (printSelect) {
    printSelect.required =
      false;
  }

  if (fileInput) {
    fileInput.required =
      false;
  }

  if (ideaInput) {
    ideaInput.required =
      false;
  }

  if (linkInput) {
    linkInput.required =
      false;
  }


  /* Gallery */

  if (type === "gallery") {

    if (galleryChoice) {
      galleryChoice.style.display =
        "block";
    }

    if (printSelect) {
      printSelect.required =
        true;
    }

  }


  /* File */

  else if (
    type === "file"
  ) {

    if (customFileChoice) {
      customFileChoice.style.display =
        "block";
    }

    if (fileInput) {
      fileInput.required =
        true;
    }

  }


  /* Idea */

  else if (
    type === "idea"
  ) {

    if (ideaChoice) {
      ideaChoice.style.display =
        "block";
    }

    if (ideaInput) {
      ideaInput.required =
        true;
    }

  }


  /* Link */

  else if (
    type === "link"
  ) {

    if (linkChoice) {
      linkChoice.style.display =
        "block";
    }

    if (linkInput) {
      linkInput.required =
        true;
    }

  }

}


/* =========================
   FILE BASE64
========================= */

function fileToBase64(file) {

  return new Promise(
    function(resolve, reject) {

      const reader =
        new FileReader();


      reader.onload =
        function() {

          const result =
            reader.result;


          resolve(
            String(result)
              .split(",")[1]
          );

        };


      reader.onerror =
        reject;


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =========================
   ORDER FORM
========================= */

const orderForm =
  document.getElementById(
    "orderForm"
  );


if (orderForm) {

  orderForm.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      const result =
        document.getElementById(
          "orderResult"
        );


      if (result) {
        result.className =
          "success-message";

        result.textContent =
          "Submitting order...";
      }


      try {

        const formData =
          new FormData(
            this
          );


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
          orderType === "file"
        ) {

          if (
            !fileInput ||
            fileInput.files.length === 0
          ) {

            throw new Error(
              "Please choose a 3D model file."
            );

          }


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
            formData.get(
              "name"
            ),

          contact:
            formData.get(
              "contact"
            ),

          orderType:
            orderType,

          printId:
            formData.get(
              "printId"
            ),

          idea:
            formData.get(
              "idea"
            ),

          modelLink:
            formData.get(
              "modelLink"
            ),

          quantity:
            Number(
              formData.get(
                "quantity"
              ) || 1
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

          file:
            file

        };


        const response =
          await api(
            "createOrder",
            order
          );


        if (result) {

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

        }


        this.reset();

        updateOrderType();

        loadFilamentTypes();


      } catch (error) {

        if (result) {

          result.className =
            "error-message";

          result.textContent =
            error.message;

        }

        console.error(error);

      }

    }
  );

}


/* =========================
   TRACKING
========================= */

const trackForm =
  document.getElementById(
    "trackForm"
  );


if (trackForm) {

  trackForm.addEventListener(
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
          new FormData(
            this
          );


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
                  order.status ||
                  "New"
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
                  order.filamentType ||
                  ""
                ) +
                " / " +
                escapeHTML(
                  order.color ||
                  ""
                ) +
              "</strong>" +
            "</div>" +

            "<div class='tracking-row'>" +
              "<span>Estimated completion</span>" +
              "<strong>" +
                (
                  order.eta
                    ? escapeHTML(
                        order.eta
                      )
                    : "Not set yet"
                ) +
              "</strong>" +
            "</div>" +

          "</div>";


      } catch (error) {

        if (result) {

          result.innerHTML =
            "<div class='error-box'>" +
            escapeHTML(
              error.message
            ) +
            "</div>";

        }

      }

    }
  );

}


/* =========================
   STAFF LOGIN
========================= */

async function staffLogin(
  password
) {

  const response =
    await api(
      "adminLogin",
      {
        password:
          password
      }
    );


  staffToken =
    response.token;


  localStorage.setItem(
    "staffToken",
    staffToken
  );


  return response;

}


/* =========================
   STAFF ORDERS
========================= */

async function getStaffOrders() {

  if (!staffToken) {
    throw new Error(
      "Please sign in."
    );
  }


  return await api(
    "adminOrders",
    {
      token:
        staffToken
    }
  );

}


/* =========================
   STAFF INVENTORY
========================= */

async function getStaffInventory() {

  if (!staffToken) {
    throw new Error(
      "Please sign in."
    );
  }


  return await api(
    "adminInventory",
    {
      token:
        staffToken
    }
  );

}


/* =========================
   UPDATE STAFF ORDER
========================= */

async function changeOrderStatus(
  orderNumber,
  status,
  eta
) {

  if (!staffToken) {
    throw new Error(
      "Please sign in."
    );
  }


  return await api(
    "updateOrder",
    {
      token:
        staffToken,

      orderNumber:
        orderNumber,

      status:
        status,

      eta:
        eta || ""
    }
  );

}


/* =========================
   UPDATE INVENTORY
========================= */

async function changeInventory(
  type,
  color,
  inStock
) {

  if (!staffToken) {
    throw new Error(
      "Please sign in."
    );
  }


  return await api(
    "setInventory",
    {
      token:
        staffToken,

      type:
        type,

      color:
        color,

      inStock:
        inStock
    }
  );

}


/* =========================
   START
========================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    updateOrderType();

    loadShop();

  }
);
