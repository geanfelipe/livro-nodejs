
const KEY = "ntalk.sid";
const SECRET = "ntalk";

var express = require('express')
, load = require('express-load')
, bodyParser = require("body-parser")
, cookieParser = require("cookie-parser")
, expressSession = require("express-session")
, methodOverride = require('method-override')
, error = require("./middlewares/error")
, app = express()
, server = require("http").Server(app)
, io = require("socket.io")(server)
, cookie = cookieParser(SECRET)
, store = new expressSession.MemoryStore()
, mongoose = require("mongoose")
;
global.db = mongoose.connect("mongodb://localhost/ntalk");


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(expressSession({
	secret: SECRET,
	name: KEY,
	resave: true,
	saveUninitialized: true,
	store: store
}));
app.use(cookieParser('ntalk'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(__dirname + '/public'));

io.use(function(socket, next) {
	var data = socket.request;

	cookie(data,{},function(err) {
		var sessioID = data.signedCookies[KEY];
		store.get(sessioID, function(err,session) {
			if(err || !session) {
				return next(new Error("acesso negado"));
			} else {
				socket.handshake.session = session;
				return next();
			}
		});
	});
});

load('models')
.then('controllers')
.then('routes')
.into(app);

app.use(error.notFound);
app.use(error.serverError);

load('sockets')
.into(io);

io.sockets.on("connection",function(client) {
	var sockets = io.sockets;
	var crypto = require("crypto");
	var onlines = {};
	var session = client.handshake.session;
	var usuario = session.usuario;

			onlines[usuario.email] = usuario.email;

		for(var email in onlines) {
			client.emit("notify-onlines",email);
			client.broadcast.emit("notify-onlines",email);
		}
		
		client.on("send-server", function(msg) {
			var sala = session.sala;
			var data = {email: usuario.email, sala:sala};

			msg = "<br>"+usuario.nome+": "+msg+"<br>";
			
			client.broadcast.emit("new-message",data);
			io.sockets.in(sala).emit("send-client",msg);
		});

		client.on("join",function(sala) {
			if(!sala) {
				var timestamp = new Date().toString();
				var md5 = crypto.createHash("md5");
				sala = md5.update(timestamp).digest("hex");
			}
			session.sala = sala;
			client.join(sala);
		});

		client.on("disconnect",function() {
			var sala = session.sala;
			var msg = "<b>" + usuario.nome + ": </b> saiu.<br>";

			client.broadcast.emit("notify-offline",usuario.email);
			io.sockets.in(sala).emit("send-client",msg);
			delete onlines[usuario.email];
			client.leave(sala);
		});
	});


server.listen(8080, function(){
    console.log("Ntalk no ar.");
});
