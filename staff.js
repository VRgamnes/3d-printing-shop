const API_URL =
  "https://script.google.com/macros/s/AKfycbwXBlRSPgE_ufvIPhw9LqTdX95CW3YYjQcLajL4XcKAv6GbAKVErdYDiSrD0AXAK09_/exec";


let staffToken =
  localStorage.getItem(
    "staffToken"
  ) || "";


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


async function api(
  action,
  data = {}
) {

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
      "Could not connect to server."
    );
  }


  const result =
    await response.json();


  if (result.ok === false) {
    throw new Error(
      result.error ||
      "Server error."
    );
  }


  return result;

}


/* =========================
   LOGIN
========================= */

document
  .getElementById(
    "loginForm"
  )
  .addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      const password =
        document.getElementById(
          "password"
        ).value;


      const result =
        document.getElementById(
          "loginResult"
        );


      try {

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


        showDashboard();


      } catch (error) {

        result.textContent =
          error.message;

      }

    }
  );


/* =========================
   SHOW DASHBOARD
========================= */

function showDashboard() {

  document.getElementById(
    "loginSection"
  ).style.display =
    "none";


  document.getElementById(
    "dashboard"
  ).style.display =
    "block";


  document.getElementById(
    "logoutButton"
  ).style.display =
    "inline-block";


  loadOrders();
  loadInventory();
  loadGallery();

}


/* =========================
   LOGOUT
========================= */

document
  .getElementById(
    "logoutButton"
  )
  .addEventListener(
    "click",
    function() {

      localStorage.removeItem(
        "staffToken"
      );

      staffToken = "";

      location.reload();

    }
  );


/* =========================
   ORDERS
========================= */

async function loadOrders() {

  const container =
    document.getElementById(
      "ordersList"
    );


  container.innerHTML =
    "<p>Loading orders...</p>";


  try {

    const response =
      await api(
        "adminOrders",
        {
          token:
            staffToken
        }
      );


    if (
      !response.orders.length
    ) {

      container.innerHTML =
        "<p>No orders yet.</p>";

      return;
    }


    container.innerHTML =
      response.orders
        .map(function(order) {

          return (

            "<div class='staff-order'>" +

              "<h3>" +
                escapeHTML(
                  order.orderNumber
                ) +
              "</h3>" +

              "<p><strong>Name:</strong> " +
                escapeHTML(
                  order.name
                ) +
              "</p>" +

              "<p><strong>Contact:</strong> " +
                escapeHTML(
                  order.contact
                ) +
              "</p>" +

              "<p><strong>Print:</strong> " +
                escapeHTML(
                  order.printName
                ) +
              "</p>" +

              "<p><strong>Quantity:</strong> " +
                escapeHTML(
                  order.quantity
                ) +
              "</p>" +

              "<p><strong>Filament:</strong> " +
                escapeHTML(
                  order.filamentType
                ) +
                " / " +
                escapeHTML(
                  order.color
                ) +
              "</p>" +

              (
                order.idea
                  ? "<p><strong>Idea:</strong><br>" +
                    escapeHTML(
                      order.idea
                    ) +
                    "</p>"
                  : ""
              ) +

              (
                order.modelLink
                  ? "<p><strong>Model link:</strong><br>" +
                    "<a href='" +
                    escapeHTML(
                      order.modelLink
                    ) +
                    "' target='_blank'>" +
                    "Open model" +
                    "</a></p>"
                  : ""
              ) +

              (
                order.fileUrl
                  ? "<p>" +
                    "<a href='" +
                    escapeHTML(
                      order.fileUrl
                    ) +
                    "' target='_blank'>" +
                    "Open uploaded file" +
                    "</a>" +
                    "</p>"
                  : ""
              ) +

              "<label>Status</label>" +

              "<select class='order-status'>" +

                "<option " +
                (
                  order.status === "New"
                    ? "selected"
                    : ""
                ) +
                ">New</option>" +

                "<option " +
                (
                  order.status ===
                  "Printing"
                    ? "selected"
                    : ""
                ) +
                ">Printing</option>" +

                "<option " +
                (
                  order.status ===
                  "Ready"
                    ? "selected"
                    : ""
                ) +
                ">Ready</option>" +

                "<option " +
                (
                  order.status ===
                  "Completed"
                    ? "selected"
                    : ""
                ) +
                ">Completed</option>" +

                "<option " +
                (
                  order.status ===
                  "Cancelled"
                    ? "selected"
                    : ""
                ) +
                ">Cancelled</option>" +

              "</select>" +

              "<input " +
                "class='order-eta' " +
                "type='text' " +
                "placeholder='ETA' " +
                "value='" +
                escapeHTML(
                  order.eta || ""
                ) +
              "'>" +

              "<button " +
                "class='button save-order' " +
                "data-order='" +
                escapeHTML(
                  order.orderNumber
                ) +
              "'>" +
                "Save" +
              "</button>" +

            "</div>"

          );

        })
        .join("");


    document
      .querySelectorAll(
        ".save-order"
      )
      .forEach(function(button) {

        button.addEventListener(
          "click",
          async function() {

            const card =
              button.closest(
                ".staff-order"
              );


            const status =
              card.querySelector(
                ".order-status"
              ).value;


            const eta =
              card.querySelector(
                ".order-eta"
              ).value;


            try {

              await api(
                "updateOrder",
                {
                  token:
                    staffToken,

                  orderNumber:
                    button.dataset.order,

                  status:
                    status,

                  eta:
                    eta
                }
              );


              button.textContent =
                "Saved!";


              setTimeout(
                function() {
                  button.textContent =
                    "Save";
                },
                1500
              );


            } catch (error) {

              alert(
                error.message
              );

            }

          }
        );

      });


  } catch (error) {

    container.innerHTML =
      "<p>" +
      escapeHTML(
        error.message
      ) +
      "</p>";

  }

}


document
  .getElementById(
    "refreshOrders"
  )
  .addEventListener(
    "click",
    loadOrders
  );


/* =========================
   INVENTORY
========================= */

async function loadInventory() {

  const container =
    document.getElementById(
      "inventoryList"
    );


  try {

    const response =
      await api(
        "adminInventory",
        {
          token:
            staffToken
        }
      );


    container.innerHTML =
      response.inventory
        .map(function(item) {

          const available =
            String(
              item.inStock
            ).toLowerCase() !==
            "false";


          return (

            "<div class='inventory-item'>" +

              "<strong>" +
                escapeHTML(
                  item.type
                ) +
              "</strong>" +

              " — " +

              escapeHTML(
                item.color
              ) +

              "<label>" +

                "<input " +
                  "type='checkbox' " +
                  "class='inventory-check' " +
                  "data-type='" +
                  escapeHTML(
                    item.type
                  ) +
                  "' " +
                  "data-color='" +
                  escapeHTML(
                    item.color
                  ) +
                  "' " +
                  (
                    available
                      ? "checked"
                      : ""
                  ) +
                ">" +

                " In stock" +

              "</label>" +

            "</div>"

          );

        })
        .join("");


    document
      .querySelectorAll(
        ".inventory-check"
      )
      .forEach(function(check) {

        check.addEventListener(
          "change",
          async function() {

            await api(
              "setInventory",
              {
                token:
                  staffToken,

                type:
                  check.dataset.type,

                color:
                  check.dataset.color,

                inStock:
                  check.checked
              }
            );

          }
        );

      });


  } catch (error) {

    container.innerHTML =
      "<p>" +
      escapeHTML(
        error.message
      ) +
      "</p>";

  }

}


document
  .getElementById(
    "inventoryForm"
  )
  .addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      await api(
        "setInventory",
        {

          token:
            staffToken,

          type:
            document.getElementById(
              "inventoryType"
            ).value,

          color:
            document.getElementById(
              "inventoryColor"
            ).value,

          inStock:
            true

        }
      );


      this.reset();

      loadInventory();

    }
  );


/* =========================
   GALLERY ADMIN
========================= */

async function loadGallery() {

  const container =
    document.getElementById(
      "galleryList"
    );


  try {

    const response =
      await api(
        "adminGallery",
        {
          token:
            staffToken
        }
      );


    container.innerHTML =
      response.gallery
        .map(function(print) {

          return (

            "<div class='gallery-admin'>" +

              "<h3>" +
                escapeHTML(
                  print.name
                ) +
              "</h3>" +

              "<p>" +
                escapeHTML(
                  print.description
                ) +
              "</p>" +

              "<input " +
                "class='gallery-name' " +
                "value='" +
                escapeHTML(
                  print.name
                ) +
              "'>" +

              "<textarea class='gallery-description'>" +
                escapeHTML(
                  print.description
                ) +
              "</textarea>" +

              "<input " +
                "class='gallery-image' " +
                "value='" +
                escapeHTML(
                  print.imageUrl
                ) +
              "' " +
                "placeholder='Image URL'>" +

              "<label>" +

                "<input " +
                  "type='checkbox' " +
                  "class='gallery-active' " +
                  (
                    String(
                      print.active
                    ).toLowerCase() !==
                    "false"
                      ? "checked"
                      : ""
                  ) +
                ">" +

                " Visible" +

              "</label>" +

              "<button " +
                "class='button save-gallery' " +
                "data-id='" +
                escapeHTML(
                  print.id
                ) +
              "'>" +
                "Save" +
              "</button>" +

            "</div>"

          );

        })
        .join("");


    document
      .querySelectorAll(
        ".save-gallery"
      )
      .forEach(function(button) {

        button.addEventListener(
          "click",
          async function() {

            const card =
              button.closest(
                ".gallery-admin"
              );


            await api(
              "updateGallery",
              {

                token:
                  staffToken,

                id:
                  button.dataset.id,

                name:
                  card.querySelector(
                    ".gallery-name"
                  ).value,

                description:
                  card.querySelector(
                    ".gallery-description"
                  ).value,

                imageUrl:
                  card.querySelector(
                    ".gallery-image"
                  ).value,

                active:
                  card.querySelector(
                    ".gallery-active"
                  ).checked

              }
            );


            button.textContent =
              "Saved!";


            setTimeout(
              function() {
                button.textContent =
                  "Save";
              },
              1500
            );

          }
        );

      });


  } catch (error) {

    container.innerHTML =
      "<p>" +
      escapeHTML(
        error.message
      ) +
      "</p>";

  }

}


document
  .getElementById(
    "galleryForm"
  )
  .addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      await api(
        "addGallery",
        {

          token:
            staffToken,

          name:
            document.getElementById(
              "galleryName"
            ).value,

          description:
            document.getElementById(
              "galleryDescription"
            ).value,

          imageUrl:
            document.getElementById(
              "galleryImage"
            ).value

        }
      );


      this.reset();

      loadGallery();

    }
  );


/* =========================
   START
========================= */

if (staffToken) {

  showDashboard();

}
