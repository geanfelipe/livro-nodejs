
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
		})
	})
})

load('models')
.then('controllers')
.then('routes')
.into(app);

app.use(error.notFound);
app.use(error.serverError);

io.sockets.on("connection",function(client) {
	var crypto = require("crypto");
	var session = client.handshake.session;
	var usuario = session.usuario;
});

load('sockets')
	.into(io);

server.listen(8080, function(){
    console.log("Ntalk no ar.");
});
