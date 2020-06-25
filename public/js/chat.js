$().ready(() => {
  //elements
  const $chatForm = $("#chatForm");
  const $chatInput = $("#chatInput");
  const $chatSubmitBtn = $("#chatSubmitBtn");
  const $shareLocationBtn = $("#shareLocationBtn");
  const $messageDiv = $("#messages");
  const $messageDiv2 = document.querySelector("#messages");
  const $sidebarDiv = $("#sidebar");

  //templates
  const messageTemplate = $("#message-template").html();
  const locationMessageTemplate = $("#location-message-template").html();
  const sidebarTemplate = $("#sidebar-template").html();

  //Options
  const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
  });

  const socket = io();

  const autoScroll = () => {
    const $newMessage = $messageDiv2.lastElementChild;

    const newMessageStyles = getComputedStyle($newMessage);
    //console.log(newMessageStyles);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible  height//
    const visibleHeight = $messageDiv2.offsetHeight;

    const containerHeight = $messageDiv2.scrollHeight;

    const scrollOffset = $messageDiv2.scrollTop + visibleHeight;
    if (containerHeight - newMessageHeight <= scrollOffset) {
      $messageDiv2.scrollTop = $messageDiv2.scrollHeight;
    }
  };

  socket.on("messageClient", (message) => {
    const html = Mustache.render(messageTemplate, {
      username: message.username,
      message: message.text,
      createdAt: moment(message.createdAt).format("h:mm a"),
    });

    $messageDiv.append(html);
    autoScroll();
  });

  socket.on("locationMessage", (locationMessage) => {
    const html = Mustache.render(locationMessageTemplate, {
      username: locationMessage.username,
      locationURL: locationMessage.url,
      createdAt: moment(locationMessage.createdAt).format("h:mm a"),
    });
    $messageDiv.append(html);
    autoScroll();
  });

  socket.on("roomData", (roomData) => {
    const html = Mustache.render(sidebarTemplate, {
      room: roomData.room,
      users: roomData.users,
    });
    $sidebarDiv.html(html);
  });

  $chatForm.submit((e) => {
    e.preventDefault();
    $chatSubmitBtn.prop("disabled", true);

    const message = $chatInput.val();

    socket.emit("sendMessage", message, (error) => {
      $chatSubmitBtn.prop("disabled", false);
      $chatInput.val("");
      $chatInput.focus();
      if (error) {
        return alert("Profanity not allowed");
      }
      console.log("message delivered");
    });
  });

  $shareLocationBtn.click(() => {
    if (!navigator.geolocation) {
      return alert("Sorry geolocation is not supported by your browser");
    }
    $shareLocationBtn.prop("disabled", true);

    navigator.geolocation.getCurrentPosition((position) => {
      const locationString = `Location is Lat: ${position.coords.latitude}, Lon : ${position.coords.longitude}`;
      socket.emit(
        "sendLocation",
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        (message) => {
          console.log(`${message}`);
          $shareLocationBtn.prop("disabled", false);
        }
      );
    });
  });

  socket.emit("Join", { username, room }, (error) => {
    if (error) {
      alert(error);
      location.href = "/";
    }
  });
});
