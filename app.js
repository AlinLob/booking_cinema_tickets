const SEAT_ROWS = 5;
const SEAT_COLS = 8;
let bookings = JSON.parse(localStorage.getItem("bookings")) || {};
let selectedSeats = [];
let dates = [];
const today = new Date();

function saveBookings() {
  localStorage.setItem("bookings", JSON.stringify(bookings));
}

function generateDates() {
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 7);

  while (startDate <= endDate) {
    const formattedDate = startDate.toISOString().split("T")[0];
    dates.push({
      date: formattedDate,
      isPast: startDate < today,
    });
    startDate.setDate(startDate.getDate() + 1);
  }
}

function loadDates() {
  $("#dates").empty();
  dates.forEach(({ date, isPast }) => {
    const button = $(`<button>${date}</button>`);
    if (isPast) {
      button.addClass("archived").prop("disabled", true);
    }
    button.click(() => {
      $("#dates button").removeClass("active");
      button.addClass("active");
      loadSessions(date, isPast);
      updateVisibility();
    });
    $("#dates").append(button);
  });
}

function loadSessions() {
  const currentDate = new Date();
  const selectedDate = new Date($("#dates button.active").text());
  const sessions = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

  $("#session-list").empty();

  sessions.forEach((session) => {
    const [hours, minutes] = session.split(":").map(Number);
    const sessionTime = new Date(selectedDate);
    sessionTime.setHours(hours, minutes, 0, 0);

    const button = $(`<button>${session}</button>`);

    if (
      selectedDate.toDateString() === currentDate.toDateString() &&
      sessionTime < currentDate
    ) {
      button.addClass("disabled").prop("disabled", true);
    } else {
      button.click(() => {
        $("#session-list button").removeClass("active");
        button.addClass("active");
        loadSeats($("#dates button.active").text(), session);
      });
    }

    $("#session-list").append(button);
  });
}

function loadSeats(date, session, isPast) {
  $("#seats-container").empty();
  const key = `${date}-${session}`;
  bookings[key] = bookings[key] || Array(SEAT_ROWS * SEAT_COLS).fill(false);

  bookings[key].forEach((booked, i) => {
    const seat = $(`<button>${i + 1}</button>`)
      .addClass(booked ? "booked" : "available")
      .data("index", i);

    if (selectedSeats.includes(i)) seat.addClass("selected");
    if (isPast || booked) seat.prop("disabled", true);

    seat.click(() => {
      if (seat.hasClass("booked")) return;
      seat.toggleClass("selected");
      const index = selectedSeats.indexOf(i);
      if (index >= 0) selectedSeats.splice(index, 1);
      else selectedSeats.push(i);
      $("#reserve-button").prop("disabled", selectedSeats.length === 0);
    });

    $("#seats-container").append(seat);
  });

  updateVisibility("choose-seats");
}

function updateVisibility(currentStep) {
  if (currentStep === "choose-seats") {
    $("#legend").fadeIn();
    $("#reserve-button").fadeIn();
  } else {
    $("#legend").hide();
    $("#reserve-button").hide();
  }
}

$("#reserve-button").click(() => {
  if (selectedSeats.length > 0) {
    showModal();
  }
});

function showModal() {
  $("#modal-overlay, #confirmation-modal").fadeIn();
}

function hideModal() {
  $("#modal-overlay, #confirmation-modal").fadeOut();
}

$("#confirm-reservation").click(() => {
  const date = $("#dates button.active").text();
  const session = $("#session-list button.active").text();
  const key = `${date}-${session}`;

  selectedSeats.forEach((index) => {
    bookings[key][index] = true;
    $(`#seats-container button`)
      .eq(index)
      .removeClass("selected")
      .addClass("booked")
      .off("click");
  });
  saveBookings();
  selectedSeats = [];
  $("#reserve-button").prop("disabled", true);
  hideModal();
});

$("#cancel-reservation").click(() => {
  hideModal();
});

$(document).ready(() => {
  generateDates();
  loadDates();
});
