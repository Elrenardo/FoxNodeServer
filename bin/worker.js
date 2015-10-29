/*
	Titre  : Worker Serveur Core
	par    : Teysseire Guillaume
	Version: 3
	le     : 22/06/2014
	update : 30/06/2014
*/
//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
var PUBLIC_PATH      = "./public/";
var CLIENT_JS        = '../private/app.js';
var CLIENT_CONFIG_JS = '../configWeb.js';
//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
/* Fonction pour le programme principal*/
exports.workerMasterUnique = function( config )
{
	var fonc_client = require( CLIENT_JS );

	if( fonc_client.workerMasterUnique != undefined )
		fonc_client.workerMasterUnique( config );
}

//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
/* Fonction pour les programmes extérieur au MasterUnique*/
exports.workerMaster = function( config )
{
	var fonc_client = require( CLIENT_JS );

	if( fonc_client.workerMaster != undefined )
		fonc_client.workerMaster( config );
}

//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
/* Fonction pour les Workers */
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

	//--------------------------------------------------------
	//--------------------------------------------------------
	//fonction client app.j
	var fonc_client = require( CLIENT_JS );
	fonc_client.workerInit( config );
	
	//--------------------------------------------------------
	//--------------------------------------------------------
	//Connexion en mode Socket
	config.usersConnect = 0;
	config.io.on('connection', function(socket)
	{
  		socketClient( config, fonc_client, socket );
	});

	//--------------------------------------------------------
	//--------------------------------------------------------

	//renvoi le code pour que le client ce conenct avec Socket.io
	config.app.get('/client_balancing.js', function(req, res)
	{
	  res.sendfile("./bin/client_balancing.js");
	});

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
			res.sendfile( path[0] );
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

//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------
//gestion des socket TCP et mémoire REDIS 
function socketClient( config, fonc_client, socket )
{
	//gestion du nombre max de Users
	if( config.param_web.maxUsers != undefined )
	if( config.usersConnect == config.param_web.maxUsers )
	{
		socket.disconnect();
		return;
	}
	config.usersConnect++;
	config.redis_pub.incr( config.ip);

	//--------------------------------------------------------
	//--------------------------------------------------------
	//Redis Subscribes
	var sub = config.redis.createClient( config.redis_port, config.redis_host );
	sub.subscribe('msg');

	//--------------------------------------------------------
	//--------------------------------------------------------
	//client fonction
	//s'abonne a un flux de la mémoire
	fonc_client.RedisPublishJson = function( channel, message_tab )
	{
		var send = {};
		send.channel = channel;
		send.data    = message_tab;
		config.redis_pub.publish( 'msg', JSON.stringify( send ) );
	}
	fonc_client.setRedisJson = function( id, data_tab )
	{
		config.redis_pub.set( id , JSON.stringify( data_tab) );
	}
	fonc_client.getRedisJson = function( id, callback )
	{
		config.redis_pub.get( id,function( err, value)
  		{
  			if(err)
  				process.exit(1);//fin programme
  			callback( JSON.parse( value ) );
  		});
	}
	fonc_client.redis = function()
	{
		return config.redis_pub;
	}
	//--------------------------------------------------------
	//--------------------------------------------------------
	//mémoire local
	var local_memory = {};

	//--------------------------------------------------------
	//--------------------------------------------------------
	//reception des messages
	sub.on("message", function(channel, message)
	{
		var msg = JSON.parse(message);
	   fonc_client.getRedisEvent( config, socket, local_memory, msg.channel, msg.data );
	});

	//--------------------------------------------------------
	//--------------------------------------------------------
	//gestion deconnexion
	socket.on('disconnect', function()
	{
		//fonction deco
		fonc_client.disconnect( config, local_memory );
		//mise a jour mémoire nombre joueur
		config.redis_pub.decr( config.ip );
		//deconnexion de redis SUB
		sub.unsubscribe();
    	sub.quit();
  	});
  	//PING
  	socket.on('PING', function()
	{
		socket.emit('PONG');
  	});

  	//--------------------------------------------------------
	//--------------------------------------------------------
	//Fonction client
	fonc_client.newClient( config, socket, local_memory );
}

