var dir = "http://jumexfrutzzo.com/burbujas/index.html";

function  compartir_activar(id,puntos,racha) {


    // $('.tw_').data('social',tw);

    $(id).off();
    $(id).on('click', function() {
        /*var fb = {
            "type": "facebook2",
            "app_id": app_id,
            "image": "http://jumexfrutzzo.com/burbujas/img/share2.png",
            "url": dir,
            "redirect_uri": dir,
            "name": "Hice " + puntos + " puntos y mi mayor racha fue de "+racha,
            "text": "¿Cuántos podrás hacer tú?",
            "caption": "¡Participa! http://jumexfrutzzo.com/burbujas"
        }
        $(id).data('social', fb);
        $(this).jqSocialSharer();*/
        FB.ui(
        {
          method: 'feed',
          name: 'Explosión de burbujas de Frutzzo',
          link: 'http://jumexfrutzzo.com/burbujas/index.html',
          picture: 'http://jumexfrutzzo.com/burbujas/img/share2.png',
          caption: 'http://jumexfrutzzo.com/burbujas',
          description: 'Hice '+puntos+' puntos y mi mejor racha fue de '+racha+'.\n ¿Puedes superarme?',
          message: ''
        },
         function (response) {
           if (response && response.post_id) {
       
             } else {

             }
         }
        );
    });
}

var gtfh=false;
function  compartir_special(id,imagen) {


    // $('.tw_').data('social',tw);

    $(id).css('opacity',1);

    $('.volverJugar').css('opacity',1);

    $(id).off();
    $(id).on('click', function() {
        toImagen(imagen);
          
        
       
    });
}


function toImagen(imagen){
   FB.ui(
        {
          method: 'feed',
          link: 'http://princesa.mvsentretenimiento.net:4000/'+imagen,
          display:'dialog'
        },
         function (response) {
           if (response && response.post_id) {
       
             } else {

             }
         }
        );
}


