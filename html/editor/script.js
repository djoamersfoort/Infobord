/// AUTH ///

if(localStorage.code === undefined || localStorage.code === null) location.href = "/auth";

/// EDITOR & VARIABLES ///

const socket = io();

function question(title, placeholder, text, callback) {
  $(".input_modal_title").html(title);
  $(".input_modal_input").attr("placeholder",placeholder);
  if(text) $(".input_modal_input").val(text);
  $(".input_modal").modal("show");
  $(".input_modal_button").click(function() {
    callback($(".input_modal_input").val());
  });
}
const cmd = {
  undo: function() { document.execCommand("undo"); },
  redo: function() { document.execCommand("redo"); },
  cut: function() { document.execCommand("cut"); },
  copy: function() { document.execCommand("copy"); },
  paste: function() { document.execCommand("paste"); },
  removeSlide: function() { socket.emit("remove", {index:getCurrentSlide(),code:localStorage.code}); },
  addSlide: function(s) { socket.emit("add", {style:s,code:localStorage.code}); },
  save: function() { socket.emit("save", {code:localStorage.code}); },
  logout: function() { localStorage.removeItem("code");location.href = "/auth"; }
};

let slides = [];

/// SOCKET.IO ///

socket.on("gotAll", function(sl) {
  slides = sl;
  buildLinks();
});

socket.on("added", function(s) {
  slides.push(s);
  buildLinks();
});

socket.on("edited", function(s) {
  slides[s.slide] = s.content;
  if(getCurrentSlide() === s.slide) {
    buildSlide();
  }
});

socket.on("removed", function(i) {
  slides.splice(i, 1);
  buildLinks();
});

socket.on("notify", function(a) {
  $.notify(a[0],a[1]);
});

socket.on("connect", function() {
  socket.emit("auth", {code:localStorage.code});
});

socket.on("auth", function(a) {
  console.log(a);
  if(!a) location.href = '/auth';
});

/// DOCUMENT READY ///

$(document).ready(function() {

  // WAT EEN JOCH ///

  $(".user_name").text(localStorage.person);


  /// KEYBINDS ///

  $("body").keydown(function(e) {
    if(e.ctrlKey && e.which >= 49 && e.which <= 52) {
      e.preventDefault();
      cmd.addSlide(e.which-49);
    }
    if(e.ctrlKey && e.which === 46) {
      e.preventDefault();
      cmd.removeSlide();
    }
    if(e.ctrlKey && e.which === 83) {
      e.preventDefault();
      cmd.save();
    }
  });

  $(".config_modal_save").click(function() {
    socket.emit("config", {code:localStorage.code,config:{delay:parseFloat($(".config_modal_delay").val())*1000}});
  });

});

/// SLIDE FUNCTIONS ///

function regNavEvents() {
  $(".slide-link").click(function() {
    focusSlide(getSlideIndex(this));
  });
}

function regSlideEvents() {
  $(".slide_title").keyup(function() {
    slides[getCurrentSlide()].title = $(".slide_title").html();
    socket.emit("edit", {slide:getCurrentSlide(),content:slides[getCurrentSlide()],code:localStorage.code});
  });
  $(".slide_subtitle").keyup(function() {
    slides[getCurrentSlide()].subtitle = $(".slide_subtitle").html();
    socket.emit("edit", {slide:getCurrentSlide(),content:slides[getCurrentSlide()],code:localStorage.code});
  });

  $(".slide img").click(function() {
    let image = this;
    question("Change image URL", "url", null, function(url) {
      if(url.length === 0) return;
      $(image).attr("src", url);

      slides[getCurrentSlide()].img = url;
      socket.emit("edit", {slide:getCurrentSlide(),content:slides[getCurrentSlide()],code:localStorage.code});
    });
  });
}

function focusSlide(i) {
  $(".slide-link.disabled").removeClass("disabled");
  $(".slide-link").eq(i).addClass("disabled");

  buildSlide();
}

function getCurrentSlide() {
  return $(".slide-link.disabled").parent().index();
}

function getSlideIndex(link) {
  return $(link).parent().index();
}

function buildLinks() {
  $(".slides").html("");
  let sel = getCurrentSlide();

  for(let i = 0; i < slides.length; i++) {
    $(".slides").append("<li class='nav-item'><a class='nav-link slide-link' href='#'>Slide "+(i+1)+"</a></li>");
  }

  if(slides.length > 0) {
    focusSlide(Math.min(slides.length, sel));
  } else {
    $(".slide").html("");
  }

  regNavEvents();
}

function buildSlide() {
  let s = slides[getCurrentSlide()];

  if(s.type === 0) {
    $(".slide").html("<div class='column'><div class='slide_title' contenteditable>"+s.title+"</div><div class='slide_subtitle' contenteditable>"+s.subtitle+"</div></div>");
  } else if(s.type === 1) {
    $(".slide").html("<div class='row'><img src='"+s.img+"'><div class='column'><div class='slide_title limited' contenteditable>"+s.title+"</div><div class='slide_subtitle limited' contenteditable>"+s.subtitle+"</div></div></div>");
  } else if(s.type === 2) {
    $(".slide").html("<img src='"+s.img+"'>");
  } else if(s.type === 3) {
    $(".slide").html("<img class='full' src='"+s.img+"'>");
  }

  regSlideEvents();
}
