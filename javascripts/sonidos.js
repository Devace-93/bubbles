

var enArreglo = function(cadena,arreglo){
    return !!~$.inArray(cadena,arreglo);
}

function Sonido(soundID,options) {
    this.options = options;
    this.id = soundID;
    this.ready=false;
    this.registered=createjs.Sound.registerSound(rutas.sonidos[soundID], soundID);
    var esto = this;

    this.play=function playSound(options) {
        options || (options=this.options);
        function play(){
            esto.instancia = this.instancia=createjs.Sound.play(soundID,options);
        }
        if(createjs.sounds[soundID])
           play();
       else{
           createjs.pendingSounds[soundID] || (createjs.pendingSounds[soundID]=[]);
           createjs.pendingSounds[soundID].push(play);
        }
    }
}

createjs.sounds={};
createjs.pendingSounds={}
createjs.Sound.addEventListener("fileload", handleFileLoad);

var sl=0,sonidosListos = false;

var eventos =[],
    fallidos = [];

var audioListo = false;

function handleFileLoad(event) {
    console.log('fired')
    var id = event.id;

    eventos.push(event.id)


    createjs.sounds[id] = true;
    sl++;

    if(enArreglo('BEEP',eventos) && audioListo){
        console.log('fr')
        audioListo = false;
        /*if(inicia)
            inicia();*/
    }

    if(!createjs.pendingSounds[id])
        return;
    for(var p in createjs.pendingSounds[id]){
        createjs.pendingSounds[id][p]();
    }
    delete createjs.pendingSounds[id];
    
}

var sonidos = {};

try{

    sonidos = {
        '50': [new Sonido('MAS2',{delay:500})],
        tiempo: [new Sonido('TIEMPO',{delay:500})],
        menos7: [new Sonido('MENOS',{delay:500})],
        RACHA3: [new Sonido('RACHA3',{delay:500})],
        RACHA9: [new Sonido('RACHA9',{delay:500})],
        RACHA12: [new Sonido('RACHA12',{delay:500})],
        FINRACHA: [new Sonido('FINRACHA',{delay:500})],
        BEEP : [new Sonido('BEEP',{delay:500})],
        SIRENA : [new Sonido('SIRENA',{delay:500,loop:2})],
        FINAL : [new Sonido('FINAL',{delay:500})],
        FINAL2 : [new Sonido('WOW',{delay:500})]
    };

}catch(e){
    sonidos = {
        '50':     [createAuda(rutas.sonidos['MAS2'],{delay:500})],
        tiempo:   [createAuda(rutas.sonidos['TIEMPO'],{delay:500})],
        menos7:   [createAuda(rutas.sonidos['MENOS'],{delay:500})],
        RACHA3:   [createAuda(rutas.sonidos['RACHA3'],{delay:500})],
        RACHA9:   [createAuda(rutas.sonidos['RACHA9'],{delay:500})],
        RACHA12:  [createAuda(rutas.sonidos['RACHA12'],{delay:500})],
        FINRACHA: [createAuda(rutas.sonidos['FINRACHA'],{delay:500})],
        BEEP :    [createAuda(rutas.sonidos['BEEP'],{delay:500})],
        SIRENA :  [createAuda(rutas.sonidos['SIRENA'],{delay:500,loop:2})],
        FINAL :   [createAuda(rutas.sonidos['FINAL'],{delay:500})],
        FINAL2 :   [createAuda(rutas.sonidos['WOW'],{delay:500})]
    };
    /*if(inicia)
        inicia();*/
}

function createAuda(src,options){

    if(!src)
        return {play:function(){}};



    options || (options={});

    options.delay || (options.delay=0);
    options.loop || (options.loop=1);

    try{
        var auda = {
                data : new Audio(),
                play : function(moptions){

                    moptions || (moptions = {});

                    var delay = moptions.delay || options.delay || 0,
                        loop = moptions.loop || options.loop || 1;

                    if( moptions.loop===0 || options === 0 )
                        loop = 0;

                    console.log(loop)

                   if( loop<1 )
                        return;

                    var esto = this;

                    esto.data.onended = function(){
                        esto.play({
                            loop : --loop,
                            delay: 0
                        });
                    }

                    setTimeout(function(){
                        esto.data.play()
                    },delay);
                }
        }

        auda.data.src = src;

        return auda;
    }catch(e){
        return {play:function(){}};
    }
}






