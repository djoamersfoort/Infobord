module.exports = function(app, folder, foldername) {
	const fs = require("fs");
	const _path = require('path');

	let path = _path.resolve(folder);

	fs.readdir(path, function(err, files) {
		if(err) return console.log(err);

		console.log("\n[!] Registering folder "+folder+"; serverpath: "+foldername);

		files.forEach(function(file) {
			const stat = fs.lstatSync(path+"/"+file);

			if(stat.isFile()) {
				const filepath = foldername+"/"+file;

				console.log("Registered file: "+path+"/"+file+"; serverpath: "+filepath);

				app.get(foldername+"/"+file, function(req, res) {
					res.sendFile(path+"/"+file);
				});

				if(file.match(/^index\.[A-z]+$/)) {
					app.get(foldername, function(req, res) {
						res.sendFile(path+"/"+file);
					});
				}
			} else if(stat.isDirectory()) {
				module.exports(app, path+"/"+file, foldername+"/"+file);
			}
		});
	});
};