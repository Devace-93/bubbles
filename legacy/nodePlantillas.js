var fs = require('fs');
function plantillas() {
	var dir = "./plantillas/";
	var outputFile = "./json/devolverPlantillas.json";
	var data = {};
	fs.readdir(dir, function(err, files){
		if (err) throw err;
		var c = 0;
		files.forEach(function(file){
			c++;
			var onlyFile = file.split('.')[0];
			fs.readFile(dir + file, 'utf-8', function(err, html){
				if (err) throw err;
				data[onlyFile] = html;
				if (0 === --c) {
					fs.writeFile(outputFile, JSON.stringify({"meta" : {"total":0, "success" : true}, "datos": data}), function(err) {
					    if(err) console.log(err);
					    else console.log(outputFile+" actualizado correctamente!!");
					});
				}
			});
		});
	});
}

plantillas();