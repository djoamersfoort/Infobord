const socket = io();

socket.on("slide", function(s) {
  if(s.type === 0) {
    $(".slide").html("<div class='column'><div class='slide_title'>"+s.title+"</div><div class='slide_subtitle'>"+s.subtitle+"</div></div>");
  } else if(s.type === 1) {
    $(".slide").html("<div class='row'><img src='"+s.img+"'><div class='column'><div class='slide_title limited'>"+s.title+"</div><div class='slide_subtitle limited'>"+s.subtitle+"</div></div></div>");
  } else if(s.type === 2) {
    $(".slide").html("<img src='"+s.img+"'>");
  } else if(s.type === 3) {
    $(".slide").html("<img class='full' src='"+s.img+"'>");
  }
});
