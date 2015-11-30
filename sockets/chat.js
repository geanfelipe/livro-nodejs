module.expots = function(io) {
	var sockets = io.sockets;
	var crypto = require("crypto");
	var onlines = {};
	var crypto = require("crypto");
	var session = client.handshake.session;
	var usuario = session.usuario;

	sockets.on("connection",function(client) {
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
}