const { Slides } = require("./lib/slides.js");
const { randomUUID } = require("crypto");

const fs = require("fs");

const express = require('express');
const http = require("http");
const SocketIO = require("socket.io");

const { AuthorizationCode } = require("simple-oauth2")
const https = require("https")

const port = 8180;
let authorized = {};

let config = {
	delay: 30000
};

// oath2
const oauth2 = new AuthorizationCode({
	client: {
		id: process.env.CLIENT_ID,
		secret: process.env.CLIENT_SECRET
	},
	auth: {
		tokenHost: "https://leden.djoamersfoort.nl",
                authorizePath: "/o/authorize/",
                tokenPath: "/o/token/"
	}
});

const slides = new Slides();

// all slide styles
const styles = [
	{type:0,title:"Title",subtitle:"Subtitle"},
	{type:1,title:"Title",subtitle:"Subtitle",img:"/src/logo_white.png"},
	{type:2,img:"/src/logo_white.png"},
	{type:3,img:"/src/img-placeholder.png"}
];

// read slides from file
slides.slides = JSON.parse(fs.readFileSync("data/slides.json", {encoding:"utf8"}));


// webshite
const app = express();
app.use(express.static("html"))
const httpServer = new http.Server(app);
const io = new SocketIO.Server(httpServer);

// cycle slides
let slideIndex = -1;
const nextSlide = function() {
	slideIndex++;

	if(slideIndex >= slides.get().length) {
		slideIndex = 0;
	}

	io.emit("slide", slides.get(slideIndex));

	setTimeout(nextSlide, config.delay);
};
nextSlide();

// oauth2
app.get("/auth", async function(req, res) {
	const authorizationUri = oauth2.authorizeURL({
	  redirect_uri: `${process.env.BASE_URL}/authed`,
	  scope: 'user/basic user/names',
		state: "infobord"
	});

	res.redirect(authorizationUri);
});
app.get("/authed", async function(req, res) {
	try {
	  const result = await oauth2.getToken({
			code: req.query.code,
			redirect_uri: `${process.env.BASE_URL}/authed`,
			scope: 'user/basic user/names'
		})

		const accessToken = result.token.access_token;

		https.request({
			host: "leden.djoamersfoort.nl",
			port: 443,
			path: "/api/v1/member/details",
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer "+accessToken
			}
		}, function(_res) {
			let output = "";
			_res.on("data", function(chunk) {
				output += chunk;
			});
			_res.on("end", function() {
				output = JSON.parse(output);
				res.setHeader('Content-Type', 'text/html');

				if(output.accountType.split(",").indexOf("bestuur") !== -1 || output.id === 96) {
					const code = randomUUID();
					authorized[code] = output.firstName;

					res.send(`<script>localStorage.code="${code}"; localStorage.person="${output.firstName}"; location.href = "/editor";</script>`);
				} else {
					res.send(`<script>localStorage.person="${output.firstName}"; location.href = "/lid";</script>`);
				}
			});
		}).on("error", function () {
			res.redirect("/auth");
		}).end();
	} catch (error) {
		console.log("error while making GET request", error);
	  res.send("Uh Oh! This wasn't supposed to happen! If this keeps happening, please contact a developer.");
	}
});

// socketio server
io.on("connection", function(socket) {
	socket.emit("gotAll", slides.get());
	socket.emit("slide", slides.get(slideIndex));

	socket.on("save", function(args) {
		if(args.code && authorized.hasOwnProperty(args.code)) {
			fs.writeFile("data/slides.json", JSON.stringify(slides.get()), function(err) {
				if(err) {
					console.log("Error while saving slides!", err);
					socket.emit("notify", [{message:"Uh Oh... Your progress could not be saved. This was not meant to happen!"},{type:"warning"}]);
				} else {
					socket.emit("notify", [{message:"All your progress has been saved."},{type:"success"}]);
				}
			});
		} else {
			socket.emit("notify", [{message:"You do not have enough permissions to do this!"},{type:"danger"}]);
		}
	});

	socket.on("add", function(args) {
		if(args.code && authorized.hasOwnProperty(args.code)) {
			slides.add(styles[args.style]);
			io.emit("added", styles[args.style]);
		} else {
			socket.emit("notify", [{message:"You do not have enough permissions to do this!"},{type:"danger"}]);
		}
	});

	socket.on("edit", function(args) {
		if(args.code && authorized.hasOwnProperty(args.code)) {
			slides.edit(args.slide, args.content);
			socket.broadcast.emit("edited", {slide:args.slide,content:args.content});
		} else {
			socket.emit("notify", [{message:"You do not have enough permissions to do this!"},{type:"danger"}]);
		}
	});

	socket.on("remove", function(args) {
		if(args.code && authorized.hasOwnProperty(args.code)) {
			slides.remove(args.index);
			io.emit("removed", args.index);
		} else {
			socket.emit("notify", [{message:"You do not have enough permissions to do this!"},{type:"danger"}]);
		}
	});

	socket.on("auth", function(args) {
		socket.emit("auth", (args.code && authorized.hasOwnProperty(args.code)));
	});

	socket.on("config", function(args) {
		if(args.code && authorized.hasOwnProperty(args.code)) {
			config = args.config;
			socket.emit("notify", [{message:"The config has been saved!"},{type:"success"}]);
		} else {
			socket.emit("notify", [{message:"You do not have enough permissions to do this!"},{type:"danger"}]);
		}
	});
});

// listen to port
httpServer.listen(port, function() {
	console.log("Listening on *:"+port);
});
