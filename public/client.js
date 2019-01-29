$( document ).ready(function() {
  // Form submittion with new message in field with id 'm'
  $('form').submit(function(){
    if($('#m').val().trim() == '') return false;
    var messageToSend = $('#m').val();
    socket.emit('chat message', messageToSend);
    //send message to server here?
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
  
  /*global io*/
  var socket = io();
  socket.on('user', function(data){
  $('#num-users').text(data.currentUsers+' user(s) online');
  var message = data.name;
  if(data.connected) {
    message += ' has joined the chat.';
  } else {
    message += ' has left the chat.';
  }
    
  $('#listaUsuarios').html("");
  data.listaUsuarios.forEach((element) => {
    $('#listaUsuarios').append($('<p>').html('<b>'+ element +'<\/b>'));
  });
    
  $('#messages').append($('<li>').html('<b>'+ message +'<\/b>'));
});
  
  socket.on('disconnect', function(){
    socket.emit('disconnect');
  });
  
  socket.on('chat message', function(data) {
    $('#messages').append($('<li>').html('<b>'+data.name + ': ' + data.message +'<\/b>'));
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
    if (document.hidden) {
      Notification.requestPermission().then(function(permission) { 
      if(permission === 'granted') {
        var noty = new Notification(data.name, {
          body: data.message,
          dir: 'auto', // or ltr, rtl
          lang: 'EN', //lang used within the notification.
          tag: 'notificationPopup', //An element ID to get/set the content
          icon: 'https://cdn.glitch.com/054ae6c2-367c-4bd7-bc58-3f0aee51ecc4%2Ftoxic-xxl.png?1548695517512' //The URL of an image to be used as an icon
        });
        noty.onclick = function () {
            window.focus();
            noty.close();
        };
      }
    });
    // do what you need
    }
    
  });
  
  
  socket.on('user writing', function(data) {
    console.log(data);  
  });

  
  
var messageTextField = $('#m');
var canPublish = true;
var throttleTime = 3000; //3 seconds

messageTextField.on('keyup', function(event) {
  if(canPublish) {
    socket.emit('writing', new Date());
    canPublish = false;
    setTimeout(function() {
      canPublish = true;
    }, throttleTime);
  }
});

});
