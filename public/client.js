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
  $('#num-users').text(data.currentUsers+' Usuário (s) Online');
  var message = data.name;
  if(data.connected) {
    message += ' é mais um otário logado!';
  } else {
    message += ' é vacilão e deslogou!';
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
    $('div.chat').scrollTop($('div.chat')[0].scrollHeight);
    Notification.requestPermission();
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
            parent.focus();
            noty.close();
        };
      }
    });
    // do what you need
    }
    $('#messages').linkify();
  });
  
  var textarea = $('#m');
  var typingStatus = $('#typing');
  var usersTyping = [];
  var lastTypedTime = new Date(0);
  var typingDelayMillis = 3000;

  function refreshTypingStatus() {
      const ut = usersTyping.map((value)=>{return value.name});
      if(ut.length==0) {
        typingStatus.html('');
      }
      else if(ut.length>=4){
        typingStatus.html('Muita gente está escrevendo...');
      } else {
        const typingstring = ut.join(', ') + ' ' + (ut.length==1? 'está': 'estão') + ' escrevendo...';
        typingStatus.html(typingstring);
      }
  }
  function updateLastTypedTime() {
      if(new Date().getTime() - lastTypedTime.getTime() > typingDelayMillis) {
        socket.emit('writing', new Date());
        lastTypedTime = new Date();
      }
  }

  setInterval(refreshTypingStatus, 1000);
  textarea.keypress(updateLastTypedTime);
  textarea.blur(refreshTypingStatus);
  
  socket.on('user writing', function(data) {
    console.log('evento chegou');
    usersTyping.push(data);
    refreshTypingStatus();
    setTimeout(function(){ 
      limpaEscrevendo(data.name);
    }, typingDelayMillis-100);
  });
  
  function limpaEscrevendo(usuario) {
    usersTyping = usersTyping.filter(function(value) {
      return value.name!==usuario;
      
    });
  }

});
