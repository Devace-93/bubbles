var app_id = '1170805582936150',
app_id_prueba = '1185834494766592';


var banners = false;

var mobile=true;

var plantillas,
	inter,
	bonificacionBotellas=5,
	bitacora = {},
	preparado = false,
	marcador = {
		puntos: 0,
		agregado: 0
	},
	alturaInicial,
	racha = 0,
	puntuacion=0,
	config = {
		tiempo_max: 3,
		tiempo_min: 2.5,
		tiempo_hurry: 2.4,
		cel_max : 3,
		cel_min : 2.8,
		cel_huhurry: 2.75
	},
	tipos = {
		buenas : ['cuadrado','triangulo'],
		malas : ['circulo','pentagono'],
		tiempo : ['mora']
	},
	lineaTabla,
	user,
	llave = 0,
	rachas = [],
	mayorRacha = 0,
	tabla;

var frutas_name = {
	cuadrado: 'Cuadrados',
	triangulo : 'Triangulos',
	circulo : 'Circulos',
	pentagono : 'Pentagonos',
	mora : 'Moras'
}


var clicks = {};

var contadoresFrutas = {
	'50' : {},
	'menos7':{},
	'tiempo' :{},
	'RACHAS' :{ 
		'RACHA3' :0,
		'RACHA9' : 0,
		'RACHA12': 0
	}
}

var animacionesY = [
	Power1.easeIn,
	Power1.easeOut,
	Power0.easeNone
];

var animacionesX = [
	Back.easeInOut.config(1.7),
	Power0.easeNone,
	Power1.easeInOut,
	Elastic.easeInOut.config(1, 1)
];

var objetos = {}, veces = 0;

function inicia(){
	veces++;

	if(veces != 1)
		return;

	$('.counter').show();
	

	var h1 = $('.counter h1');
	sonidos.BEEP[0].play()
	TweenLite.to(h1,1,{
		'font-size' : '.2em',
		onComplete : function(){
			h1.css({'font-size' : '5em'});
			
			h1.text(2);
			sonidos.BEEP[0].play()
			TweenLite.to(h1,1,{
				'font-size' : '.2em',
				onComplete : function(){
					h1.css({'font-size' : '5em'});
					
					h1.text(1);
					sonidos.BEEP[0].play()
					TweenLite.to(h1,1,{
						'font-size' : '.2em',
						onComplete : function(){

							$('.counter').hide();
							empezar();
						},
						ease:Power0.easeNone
					});
				},
				ease:Power0.easeNone
			});
		},
		ease:Power0.easeNone
	});
}

(function(){

	if(!!location.hostname.match(/localhost/))
		app_id = app_id_prueba;

	return inicia();
		  		
});



var config = {
	pantalla : {
		m : 4/3
	}
}

TweenLite.selector = $;
$().ready(function(){
	banners = !!location.href.replace(/[^?]*\?/g,'').match("banners=true");

$.getJSON('json/devolverPlantillas.json',function(json){
	$('body').data().plantillas=json;
	preparado = true;
	inicia();
});

});

/*})();*/

function crearFruta(id,tipo,left,noClick){

	left || (left=Math.ceil(Math.random()*80)+'%');

	var fruta = $('<div>');
	fruta.id = id;
	fruta.name = frutas_name[tipo];
	fruta.raiz = tipo;


	var relativo = $('<div>'),
		svg = despliegue.dibujar({
			plantilla : "fruta",
			datos : {
				id : 'fruta_'+id,
				clase : "fruta mycenter "+tipo
			}
		}),
		burbuja = despliegue.dibujar({
			plantilla : 'burbujaneo',
			datos : {
				id : 'burbuja_'+id
			}
		}),
		destello = despliegue.dibujar({
			plantilla : 'burbujaneo_estalla',
			datos : {
				id : 'destello_'+id
			}
		});

	var tipo = (enArreglo(tipo,tipos.buenas)?'50':enArreglo(tipo,tipos.malas)?'menos7':'tiempo');
	
	var adicionante ='';


	var puntos = despliegue.dibujar({
			plantilla : "puntos",
			datos : {
				id : 'destello_'+id,
				clase: 'puntos my_center d'+tipo+adicionante
			}
		});
	

	fruta.attr('id',id)
		.addClass('fruta_contenedor')
		.append(relativo)
		.css({
			left: left
		});

    
	
	relativo.addClass('relativo')
		.append(svg)
		.append(burbuja)
		.append(destello);

	if(puntos)
		relativo.append(puntos);

	fruta.tipo = tipo;

	var burbuja1=$(fruta.find('.neoburbuja_click')),
			burbuja2=$(fruta.find('.burbuja_romper'));

	burbuja1.on('click touchstart',function(evt){

		if(noClick)
			return;

		evt.stopPropagation();
        evt.preventDefault();

		if(estalladas)
			return;

		if(clicks[fruta.id])
			return;
		clicks[fruta.id]=true;

		contadoresFrutas[fruta.tipo][fruta.name] || (contadoresFrutas[fruta.tipo][fruta.name]=0);

		contadoresFrutas[fruta.tipo][fruta.name]++;

		var mifruta = $(fruta.find('.fruta,.no_burbuja')),
			puntos =  $(fruta.find('.puntos'))


		var mInicial = puntuacion,
			mFinal = mInicial,
			tiempo = true,
			del = 1;



		if(fruta.tipo == '50'){
			mFinal += 50;
			tiempo = false;
		}

		if(fruta.tipo == 'menos7'){
			mFinal -= 7;
			del *= (7/50);
			tiempo = false;
		}

		puntuacion = mFinal;

		reventar(fruta,function(){
			fruta.puntuar(mifruta,puntos,mInicial,mFinal,tiempo,del);
		});
		sonidos[fruta.tipo][Math.floor(Math.random()*sonidos[fruta.tipo].length)].play();

		llave++;

		if(fruta.tipo=='50'){
			racha++;
			$('#racha').text("Racha: "+racha);
		}

		if(fruta.tipo=='menos7'){
			if(racha>=9)
				sonidos.FINRACHA[0].play();

			if(racha>0){
				rachas.push(racha);
				if(racha>mayorRacha)
					mayorRacha = racha;
			}

			racha = 0;
			$('#racha').text("Racha: "+racha);
			return;
		}

		if(fruta.tipo=='tiempo'){

			llave--;

			if(sirena.instancia){
				sirena.instancia.stop();
				sirenaPlaying = false;
				
			}


			lineaTiempo.to('#timer_c',.2,{
				opacity: 0,
				ease:Power0.easeNone
			},lineaTiempo.time());
			lineaTiempo.to('#timer_c',.2,{
				opacity: 1,
				ease:Power0.easeNone
			},lineaTiempo.time()+.2);
			lineaTiempo.to('#timer_c',.2,{
				opacity: 0,
				ease:Power0.easeNone
			},lineaTiempo.time()+.4);
			lineaTiempo.to('#timer_c',.2,{
				opacity: 1,
				ease:Power0.easeNone
			},lineaTiempo.time()+.6);
			lineaTiempo.to('#timer_c',.2,{
				opacity: 0,
				ease:Power0.easeNone
			},lineaTiempo.time()+.8);
			lineaTiempo.to('#timer_c',.2,{
				opacity: 1,
				ease:Power0.easeNone
			},lineaTiempo.time()+1);
			return;
		}

		if(racha!=0 && racha%9!=0 && racha%12!=0 && racha%3 == 0){
			sonidos.RACHA3[0].play();
			contadoresFrutas.RACHAS.RACHA3++;
		}

		if(racha!=0 && racha%12!=0 && racha%9 == 0){
			sonidos.RACHA9[0].play();
			contadoresFrutas.RACHAS.RACHA9++;
		}

		if(racha!=0 && racha%12 == 0){
			sonidos.RACHA12[0].play();
			contadoresFrutas.RACHAS.RACHA12++;
		}

	});

	

	fruta.puntuar = function(mifruta,puntos,mInicial,mFinal,tiempo,del){

		

		if(!tiempo){
			TweenLite.killTweensOf(marcador);
			TweenLite.to(marcador,del,{ 
				ease: Power0.easeNone, 
				puntos: mFinal,
				onUpdate: function(){
					$('.timer_c').text(Math.round(marcador.puntos)+' pts')
				}
			});
		}else{
			tiempoTotal += 5;
			marcador.agregado += 5;
			counter.extra += 5;
		}

		TweenLite.to(mifruta,.05,{ 
			ease: Power1.easeInOut, 
			opacity: '0'
		});

		var width = fruta.width();

		TweenLite.to(puntos,.3,{ 
			/*ease: Power1.easeOut,*/
			width: width*4,
			height: width*4,
			ease: Power1.easeInOut,
			onComplete: function(){
				TweenLite.to(fruta,.3,{ 
					ease: Power1.easeInOut, 
					opacity: '0',
					onComplete: function(){
						fruta.remove();
					}
				})
			}
		});
	}

	fruta.animar = function(tiempo,tipox,tipoy,inicial){
		inicial || (inicial=0);
		tiempo || (tiempo=6);
		tipox || (tipox=animacionesX[Math.floor(Math.random()*animacionesX.length)]);
		tipoy || (tipoy=animacionesY[Math.floor(Math.random()*animacionesY.length)]);

		tiempo = (tiempo * alturaInicial)/483;

		if(fruta.tipo=='tiempo')
			tiempo *= .75;

		tiempo += (Math.random()-.5)*.2*tiempo;

		lineaTiempo.to(fruta,tiempo*.2,{
		    ease: tipoy,
		    top: '80%',
		    opacity:1
		},inicial);

		inicial += tiempo*.2;

		lineaTiempo.to(fruta,tiempo*.8,{
		    ease: tipoy,
		    top: '15%'
		},inicial);

		inicial += tiempo*.8;

		lineaTiempo.to(fruta,tiempo*.2,{
		    opacity: 0,
		    top: '5%',
		    onComplete: function(){
		    	fruta.remove();
		    }
		},inicial);

	}

	return fruta;
}




function random(){
	var rnd = Math.random();
	if(rnd>=.35)
   		return tipos.buenas[Math.floor(Math.random()*tipos.buenas.length)];
	return tipos.malas[Math.floor(Math.random()*tipos.malas.length)];
}

function generarBurbujas(min,max,tiempo,botellas){
	var numero = Math.round(Math.random()*(max-min))+min;
	generarBotellas(botellas,tiempo);

	var inic = tiempo;
	tiempo += botellas*bonificacionBotellas;

	for(var a = 0;a<numero;a++){
		introducirEnLineaDeTiempo(random(),tiempo,inic)
	}

}

function generarBotellas(num,tiempo){
	if(num<1)
		return;
   var botella = tipos.tiempo[Math.floor(Math.random()*tipos.tiempo.length)];
   introducirEnLineaDeTiempo(botella,tiempo);

   generarBotellas(--num,tiempo);
}

var tiempos = [];

function introducirEnLineaDeTiempo(obj,tiempo,inic){
	inic || (inic = tiempo);
   	time = Math.round((Math.random()*tiempo)*1000);

   	

   	var rd = Math.random();

   	var seguir = false;


   	if(time < inic*1000/2 && rd<=.3)
   		seguir = true;
   		
   	if(time >= inic*1000/2 && time < inic*1000 && rd>.3 && rd <=.7)
   		seguir = true;
   	if(time > inic*1000 && rd>.7)
   		seguir = true;
   	
   	if(!seguir)
   		return introducirEnLineaDeTiempo(obj,tiempo,inic);
   	
   	if(!objetos[time]){
   		objetos[time]=[];
   		tiempos.push(time);
   	}

   	bitacora[obj] || (bitacora[obj]={
   		tiempos : [],
   		contador : 0
   	});

   	bitacora[obj].contador++;

   	bitacora[obj].tiempos.push(time);
   	objetos[time].push(obj)
}

var tiempoInicial,
	tiempoTotal = 30,
	estalladas = false,
	lineaTiempo,
	deley=0;

function iniciarTiempos(){

	tiempoInicial = new Date().getTime();
	estalladas = false;
	lineaTiempo = new TimelineLite({paused:true});
	deley = 0;

	tiempos.sort(function(a,b){
		return a-b;
	})

	for(var a in tiempos){
		enLinea(tiempos[a]);
	}
}

var g=0;
function nuevaFruta(fruta_name,tiempo){
  var fruta= crearFruta('fr_'+g++, fruta_name || random() )
  $('.tablero.referencia').append(fruta)
     
     var delay = Math.round(Math.random()*.09),
     inicial = ((tiempo+delay)/1000);

     lineaTiempo.to(counter,0,{
     	xar:0,
     	onComplete: function(){
     		
       		fruta.animar(getVelocidad(inicial),null,Power0.easeNone,inicial)
     	}
     },inicial)
     
};

var unaVez=0;

function estallarTodas(){

	if(unaVez>0)
		return;

	unaVez++;

	estalladas = true;
	try{
		sonidos.FINAL[0].play()
	


	reventar($('.fruta_contenedor:not(.mensaje)'),function(){
		$('.fruta_contenedor:not(.mensaje)').fadeOut({
			complete:function(){
				$(this).remove();
			},
			duration:1000
		});
	});

	}catch(e){

	}

	var imagen,
	gty=1000;

	function llamada(){

		if(racha>0){
			rachas.push(racha);
			if(racha>mayorRacha)
				mayorRacha = racha;
			racha = 0;
		};

		var toServer = {}

		toServer.user = user;
		toServer.llave 	=  llave;
		toServer.counter = counter;
		toServer.marcador = marcador;
		toServer.frutas  = contadoresFrutas;
		toServer.puntos  = puntuacion;
		toServer.mayorRacha 	= mayorRacha;
		toServer.rachas 	=  rachas;
		toServer.bitacora = bitacora;
		toServer.tiempo = new Date().getTime();

		puntuacion += contadoresFrutas.RACHAS.RACHA3*7;
		puntuacion += contadoresFrutas.RACHAS.RACHA9*18;
		puntuacion += contadoresFrutas.RACHAS.RACHA12*30;

		lineaTiempo.progress(1);
		$('.timer_c').text(Math.round(puntuacion)+' pts')
		crearTablaResultados();

		$('.header_timerYusuario').addClass('tablafinal')

		if(racha>0){
			rachas.push(racha);
			if(racha>mayorRacha)
				mayorRacha = racha;
			racha = 0;
		}

		setTimeout(function(){
			$('.ptsfin').text(puntuacion+' PTS')
			$('.rachafin').text('Mejor racha: '+mayorRacha)
			$('.volverJugar').click(function(){
				location.reload();
			});
		},0);

		
	}

	setTimeout(llamada,gty)
	



	

}



function crearTablaResultados(){
	lineaTabla = new TimelineLite({paused:true});

	var buenas = {
		pts_unidad : 50,
		pts : 'PTS',
		x : 'x',
		cantidad : 0,
		name : 'Frutas',
		items : [],
		clase : 'positivo',
		total : 0
	};

	var malas = {
		pts_unidad : -7,
		pts : 'PTS',
		x : 'x',
		cantidad : 0,
		name : 'Frutas',
		items : [],
		clase : 'negativo',
		total : 0
	};

	var rachas = {
		pts : 'PTS',
		x : '',
		name : 'Frutas',
		items : [],
		clase : 'positivo',
		total : 0,
		total_title: 'Total' 
	};

	for(var fruta in contadoresFrutas['50']){
		var numero = contadoresFrutas['50'][fruta],
			total = numero * 50;
			buenas.total += total;
			buenas.cantidad += numero;
		buenas.items.push({
			pts_unidad : 50,
			pts : 'PTS',
			x : 'x',
			cantidad : numero,
			name : fruta,
			clase : 'positivo',
			total : total,
		});
	}

	for(var fruta in contadoresFrutas['menos7']){
		var numero = contadoresFrutas['menos7'][fruta],
			total = numero * -7;
			malas.total += total;
			malas.cantidad += numero;
		malas.items.push({
			pts_unidad : -7,
			pts : 'PTS',
			x : 'x',
			cantidad : numero,
			name : fruta,
			clase : 'negativo',
			total : total
		});
	}

	for(var fruta in contadoresFrutas['RACHAS']){
		var numero = contadoresFrutas['RACHAS'][fruta],
			tipo = (fruta=='RACHA3'?'Rachas de 3':(fruta=='RACHA9'?'Rachas de 9':'Rachas de 12')),
			unidad = (fruta=='RACHA3'?7:(fruta=='RACHA9'?18:30)),
			total = numero * unidad;
			rachas.total += total;
		rachas.items.push({
			pts_unidad : unidad,
			pts : 'PTS',
			x : 'x',
			cantidad : numero,
			name : fruta,
			clase : 'positivo',
			total : total,
		});
	}


	var datos = {
		marcadores : [
			buenas,
			malas,
			rachas
		],
		total : buenas.total + malas.total + rachas.total
	}

		despliegue.dibujar({
    	    'plantilla': 'puntosFinal',
    	    'datos': datos,
    	    'destino': ".timer",
    	    'posicion': 'replaceWith'
    	});

}

function reventar(fruta,callback){


	callback || (callback =function(){});

	var burbuja1=$(fruta.find('.neoburbuja')),
			burbuja2=$(fruta.find('.neoburbuja_estalla'));

	TweenLite.killTweensOf(fruta);
		
		TweenLite.to(fruta,0,{
			ease: Power1.easeInOut,
			'z-index':1, 
			opacity : 1
		})

		TweenLite.to(burbuja1,.25,{ 
			ease: Power1.easeInOut, 
			width: '156.25%',
			height: '156.25%',
			onComplete: function(){
				burbuja1.hide();
				burbuja2.show();
				TweenLite.to(burbuja1,.1,{ 
					ease: Power1.easeInOut, 
					opacity: '0',
					onComplete: function(){
						burbuja2.hide();
						
						callback();
					}
				});
			}
		});
}

var counter = { ar: 45, extra: 0 ,xar:100};
function empezar(){

	alturaInicial = $('.tablero.referencia').height();

	$(window).resize(function(){
		alturaInicial = $('.tablero.referencia').height();
	});

	var min = 120,
		max = 130;
	if($d.navegador()=='web'){
		min = 120;
		max = 130;
		mobile = false;
	}

	generarBurbujas(min,max,30,3)
	iniciarTiempos()
	animarTiempo();
	lineaTiempo.play();
	setTimeout(function(){
		if(!marcador.agregado)
			estallarTodas();
		setTimeout(function(){
			if(new Date().getTime()-tiempoInicial >=tiempoTotal*1000)
				estallarTodas();
			else
				setTimeout(function(){
					if(new Date().getTime()-tiempoInicial >=tiempoTotal*1000)
						estallarTodas();
					
				},1500)
		},marcador.agregado*1000)
	},30000);
	setTimeout(function(){
		estallarTodas();
	},45000);
}	

function animarTiempo(){
	$('#timer_c,.timer_c,#racha').show();

	lineaTiempo.to(counter,counter.ar,{
		ar: 0,
		onUpdate: function(){
			
			var delta = new Date().getTime()-tiempoInicial;

	    	if(delta>tiempoTotal*1000){
	    		
	    		estallarTodas();
				return;
			}

			var seg_undos = Math.round(45-(delta/1000))-15+counter.extra;
			$('#timer_c').text(seg_undos+' segundos');

			if(seg_undos<6)
				iniciarSirena();
		},
	    ease:Power0.easeNone
	},0)
}

function enLinea(t){
	lineaTiempo.to(counter,0,{
		xar: 0, 
	    onUpdate: function () {
	    },
	    onComplete: function(){
	    	if(estalladas)
	    		return;
	    	for(var b in objetos[t]){
    			nuevaFruta(objetos[t][b],t);
    		}
	    },
	    ease:Power0.easeNone
	},(t/1000));
	deley = t;
}

function getVelocidad(inicial){
	var f = config.tiempo_max,
		i = config.tiempo_min,
		t = 30;

	if(mobile){
		f = config.cel_max;
		i = config.cel_min;
	}

	if(inicial>t){
		f = i,
		i = config.tiempo_hurry;
		inicial-=30;
	}
	
	return f-(inicial/t)*(f-i);
}

var sirenaPlaying = false;
var sirena = sonidos.SIRENA[0];
function iniciarSirena(){
	if(sirenaPlaying || (sirena.instancia && sirena.instancia.playState == "playSucceeded"))
		return;
	sirenaPlaying = true;
	sirena.play()
}

function recargar(){
	location.href = 'index.html'
}

function agregarLetra(id,tipo,p,top){
  var a=crearFruta(id,tipo,p,true)
  top || (top='15%');
  $('.tablero.referencia').append(a)
  a.css({opacity:0,top:top})
  a.addClass('mensaje')
  return a;
}

