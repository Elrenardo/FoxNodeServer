/*
	Titre  : Worker Serveur Core
	par    : Teysseire Guillaume
	Version: 4
	le     : 22/06/2014
	update : 20/11/2014
*/
//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
var PUBLIC_PATH      = "./www/";
var CLIENT_JS        = '../www_app/app.js';
var CLIENT_CONFIG_JS = '../config/configWeb.js';

//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//Fonction pour le processus principal unique
//--------------------------------------------------------------------------------
exports.workerMasterUnique = function( config )
{
	var fonc_client = require( CLIENT_JS );

	if( fonc_client.workerMasterUnique != undefined )
		fonc_client.workerMasterUnique( config );
}

//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//Fonction pour les programmes extérieur au MasterUnique
//--------------------------------------------------------------------------------
exports.workerMaster = function( config )
{
	var fonc_client = require( CLIENT_JS );

	if( fonc_client.workerMaster != undefined )
		fonc_client.workerMaster( config );
}

//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//Fonction pour les Workers
//--------------------------------------------------------------------------------
exports.workerSlave = function( config )
{
	//console.log("Slave: "+config.cluster.worker.process.pid );
	//Dependence serveur
	config.param_web = require( CLIENT_CONFIG_JS );

	config.fs        = require('fs');
	config.app       = require('express')();
	config.http      = require('http').Server( config.app );
	config.io        = require('socket.io')( config.http );

	config.htmlWebDefault = PUBLIC_PATH + config.param_web.htmlIndex;
	config.path_root      = __dirname.substring(0, __dirname.length-4);

	//--------------------------------------------------------
	//--------------------------------------------------------
	//fonction client app.js
	var fonc_client = require( CLIENT_JS );
	fonc_client.workerInit( config );
	
	//--------------------------------------------------------
	//--------------------------------------------------------
	//Connexion en mode Socket
	config.usersConnect = 0;
	config.io.on('connection', function(socket)
	{
		fonc_client.config       = config;
		fonc_client.socket       = socket;
		fonc_client.id           = makeId( 20 );
		fonc_client.local_memory = {};

  		socketClient( fonc_client );
	});

	//--------------------------------------------------------
	//--------------------------------------------------------

	//renvoi au format JSON les addresses serveur et le nombre de connecte
	config.app.get('/worker.json', function(req, res)
	{
	  	config.redis_pub.llen("INFOworker",function( err, nb_worker)
		{
			if(err)
				process.exit(1);//fin programme
			config.redis_pub.lrange("INFOworker", 0, nb_worker,function( err, values)
			{
				if(err)
					process.exit(1);//fin programme
				
				var ret = {};
				var compte = 0;
				var nbUsers = function( val, res )
				{
					config.redis_pub.get( val,function( err, value)
					{
						if(err)
							process.exit(1);//fin programme
						compte++;
						ret[ val ] = value;
						if( compte == nb_worker )
							res.end( JSON.stringify( ret ) );
					});
				}
				//chargement du nombre de joueur connecte
				for( var i=0; i < values.length; i++ )
				{
					ret[ values[i] ] = '?';
					nbUsers( values[i], res );
				}
			});
		});
	});

	//rendu Web Default
	config.app.get('/*', function(req, res)
	{
		var file = req.url;
		var path = PUBLIC_PATH + file;

		var path = path.split("?");//pas de variable

		//test si le fichier existe
		if(config.fs.existsSync( path[0] ))
		{
			res.sendFile( path[0],{'root': config.path_root });
			return;
		}
	  	//default affichage
		res.status(404).send('Not found');
	});

	//--------------------------------------------------------
	//--------------------------------------------------------
	//ecoute sur le port
	var port = config.param_web.port + config.cluster.worker.id-1;//-1 pour commencé a conté de 0
	config.http.listen( port, function()
	{
  		console.log('Worker "'+config.cluster.worker.id+' "listening on: '+port);
	});

	//--------------------------------------------------------
	//--------------------------------------------------------
	//sauvegarde des infos de ce worker
	config.ip = config.param_web.addressPublic+":"+port;

	//si server n'est pas un ghost on ajoute les infos
	if( config.param_web.serverGhost == false )
		config.redis_pub.rpush("INFOworker", config.ip);
	//nombre users connecte a 0
	config.redis_pub.set( config.ip, 0);
}

//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//gestion des sockets TCP et mémoire REDIS 
//--------------------------------------------------------------------------------
function socketClient( fonc_client )
{
	//gestion du nombre max de Users
	if( fonc_client.config.param_web.maxUsers != undefined )
	if( fonc_client.config.usersConnect == config.param_web.maxUsers )
	{
		fonc_client.socket.disconnect();
		return;
	}
	fonc_client.config.usersConnect++;
	fonc_client.config.redis_pub.incr( fonc_client.config.ip );

	//--------------------------------------------------------
	//--------------------------------------------------------
	//client fonction
	//s'abonne a un flux de la mémoire
	fonc_client.publish = function( channel, message_tab )
	{
		var send     = {};
		send.channel = channel;
		send.data    = message_tab;
		this.config.redis_pub.publish( 'msg', JSON.stringify( send ) );
	}
	fonc_client.set = function( id, data_tab )
	{
		this.config.redis_pub.set( id , JSON.stringify( data_tab) );
	}
	fonc_client.get = function( id, callback )
	{
		this.config.redis_pub.get( id,function( err, value)
  		{
  			if(err)
  				process.exit(1);//fin programme
  			callback( JSON.parse( value ) );
  		});
	}
	fonc_client.redis = function()
	{
		return this.config.redis_pub;
	}

	//gestion deconnexion
	fonc_client.socket.on('disconnect', function()
	{
		//fonction deco
		fonc_client.disconnect();
		//mise a jour mémoire nombre joueur
		fonc_client.config.redis_pub.decr( fonc_client.config.ip );
		//deconnexion de redis SUB
		sub.unsubscribe();
    	sub.quit();
  	});

  	//PING
  	fonc_client.socket.on('PING', function()
	{
		fonc_client.socket.emit('PONG');
  	});

	//--------------------------------------------------------
	//--------------------------------------------------------
	//Redis Subscribes
	var sub = fonc_client.config.redis.createClient( fonc_client.config.redis_port, fonc_client.config.redis_host );
	sub.subscribe('msg');

	//--------------------------------------------------------
	//--------------------------------------------------------
	//reception des messages
	sub.on("message", function(channel, message)
	{
		//console.log( channel );
		var msg = JSON.parse(message);
	   fonc_client.getRedisEvent( msg.channel, msg.data );
	});

  	//--------------------------------------------------------
	//--------------------------------------------------------
	//Fonction client
	fonc_client.newClient();
}


//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//Génére un ID
//--------------------------------------------------------------------------------
function makeId( size )
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < size; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
