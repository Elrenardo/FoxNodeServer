/*
	Titre  : Client balancing
	par    : Teysseire Guillaume
	Version: 1
	le     : 29/06/2014
	update : 29/06/2014
*/

//connexion au serveur avec Socket.io
function SocketIOConnect( url, callback )
{
	var loadWorker = function()
	{
		//connexion socketServer
		var xhr = getXDomainRequest();
		xhr.onload = function()
		{
	        if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0))
	        {
	             var tab = JSON.parse( xhr.responseText );
	             //recherche server le moins chargé
	             var val = url;
	             for( var i in tab )
	             if( tab[ val ] > tab[ i ] )
	             	val = i;
	             //connexion
	             var socket = io.connect( val );
	             callback( socket );
	        }
		};
		//envoi requette
		xhr.open("GET", 'http://'+url+'/worker.json',true);
		xhr.send();
	}
	loadScript( 'http://'+url+'/socket.io/socket.io.js', loadWorker);
}



//private
function getXDomainRequest() {
	var xdr = null;
	
	if (window.XDomainRequest) {
		xdr = new XDomainRequest(); 
	} else if (window.XMLHttpRequest) {
		xdr = new XMLHttpRequest(); 
	} else {
		alert("Votre navigateur ne gère pas l'AJAX cross-domain !");
	}
	return xdr;	
}
function loadScript(url, callback)
{
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    script.onreadystatechange = callback;
    script.onload = callback;

    head.appendChild(script);
}