const API_URL =
  "https://script.google.com/macros/s/AKfycbwXBlRSPgE_ufvIPhw9LqTdX95CW3YYjQcLajL4XcKAv6GbAKVErdYDiSrD0AXAK09_/exec";


let loggedIn = false;


async function api(action, data) {

  if (data === undefined) {
    data = {};
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
      "Could not connect to Google Apps Script."
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


document
  .getElementById("loginForm")
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


      result.textContent =
        "Logging in...";


      try {

        const response =
          await api(
            "login",
            {
              password:
                password
            }
          );


        if (
          response.ok === false
        ) {

          throw new Error(
            response.error ||
            "Incorrect password."
          );

        }


        loggedIn = true;


        document
          .getElementById(
            "loginScreen"
          )
          .style.display =
          "none";


        document
          .getElementById(
            "dashboard"
          )
          .style.display =
          "block";


        loadDashboard();


      } catch (error) {

        result.textContent =
          error.message;

      }

    }
  );


async function loadDashboard() {

  await loadOrders();
  await loadInventory();
  await loadGallery();

}


async function loadOrders() {

  const container =
    document.getElementById(
      "orders"
    );


  container.innerHTML =
    "Loading orders...";


  try {

    const response =
      await api(
        "orders"
      );


    if (
      response.ok === false
    ) {

      throw new Error(
        response.error ||
        "Could not load orders."
      );

    }


    const orders =
      response.orders ||
      [];


    if (orders.length === 0) {

      container.innerHTML =
        "<p>No orders yet.</p>";

      return;

    }


    container.innerHTML =
      orders.map(function(order) {

        return (

          "<div class='staff-card'>" +

            "<h3>" +
            escapeHTML(
              order.orderNumber
            ) +
            "</h3>" +

            "<p>" +
            "<strong>Customer:</strong> " +
            escapeHTML(
              order.name
            ) +
            "</p>" +

            "<p>" +
            "<strong>Print:</strong> " +
            escapeHTML(
              order.printName ||
              "Customer model"
            ) +
            "</p>" +

            "<p>" +
            "<strong>Quantity:</strong> " +
            escapeHTML(
              order.quantity
            ) +
            "</p>" +

            "<p>" +
            "<strong>Filament:</strong> " +
            escapeHTML(
              order.filamentType
            ) +
            " / " +
            escapeHTML(
              order.color
            ) +
            "</p>" +

            "<p>" +
            "<strong>Status:</strong> " +
            escapeHTML(
              order.status
            ) +
            "</p>" +

            "<p>" +
            "<strong>ETA:</strong> " +
            escapeHTML(
              order.eta ||
              "Not set"
            ) +
            "</p>" +

          "</div>"

        );

      }).join("");


  } catch (error) {

    container.innerHTML =
      "<div class='error-box'>" +
      escapeHTML(
        error.message
      ) +
      "</div>";

  }

}


async function loadInventory() {

  const container =
    document.getElementById(
      "inventory"
    );


  container.innerHTML =
    "Loading inventory...";


  try {

    const response =
      await api(
        "catalog"
      );


    const inventory =
      response.inventory ||
      [];


    if (inventory.length === 0) {

      container.innerHTML =
        "<p>No inventory yet.</p>";

      return;

    }


    container.innerHTML =
      inventory.map(function(item) {

        const available =
          String(
            item.inStock
          ).toLowerCase() !==
          "false";


        return (

          "<div class='staff-card'>" +

            "<h3>" +
            escapeHTML(
              item.type
            ) +
            "</h3>" +

            "<p>" +
            "<strong>Color:</strong> " +
            escapeHTML(
              item.color
            ) +
            "</p>" +

            "<p>" +
            "<strong>In stock:</strong> " +
            (
              available
                ? "Yes"
                : "No"
            ) +
            "</p>" +

          "</div>"

        );

      }).join("");


  } catch (error) {

    container.innerHTML =
      "<div class='error-box'>" +
      escapeHTML(
        error.message
      ) +
      "</div>";

  }

}


async function loadGallery() {

  const container =
    document.getElementById(
      "staffGallery"
    );


  container.innerHTML =
    "Loading gallery...";


  try {

    const response =
      await api(
        "catalog"
      );


    const gallery =
      response.gallery ||
      [];


    if (gallery.length === 0) {

      container.innerHTML =
        "<p>No gallery prints yet.</p>";

      return;

    }


    container.innerHTML =
      gallery.map(function(print) {

        return (

          "<div class='staff-card'>" +

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

            "<p>" +
            "<strong>Active:</strong> " +
            (
              print.active
                ? "Yes"
                : "No"
            ) +
            "</p>" +

          "</div>"

        );

      }).join("");


  } catch (error) {

    container.innerHTML =
      "<div class='error-box'>" +
      escapeHTML(
        error.message
      ) +
      "</div>";

  }

}


document
  .getElementById(
    "refreshButton"
  )
  .addEventListener(
    "click",
    loadDashboard
  );


document
  .getElementById(
    "logoutButton"
  )
  .addEventListener(
    "click",
    function() {

      loggedIn = false;

      document
        .getElementById(
          "dashboard"
        )
        .style.display =
        "none";


      document
        .getElementById(
          "loginScreen"
        )
        .style.display =
        "block";


      document
        .getElementById(
          "password"
        ).value = "";

    }
  );
