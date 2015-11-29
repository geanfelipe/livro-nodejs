module.exports = function(app) {
	var contatos = app.controllers.contatos;
	var autenticar = require("./../middlewares/autenticador");
	
	app.get('/contatos',autenticar,contatos.index)
	app.get('/contatos/:id',autenticar,contatos.show);
	app.post('/contato',autenticar,contatos.create);
	app.get('/contato/:id/editar',autenticar,contatos.edit);
	app.put('/contato/:id',autenticar,contatos.update);
	app.delete('/contato/:id',autenticar,contatos.destroy);
}