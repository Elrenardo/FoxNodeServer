/*
	Titre  : SERVEUR MULTI-USERS
	par    : Teysseire Guillaume
	Version: 1.1
	le     : 22/06/2014
	update : 19/11/2014
*/

var config     = {};

//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//Récupérer les dépendences
//--------------------------------------------------------------------------------
config.param   = require('./config/config.js');
var f_w        = require('./src/worker.js');
config.cluster = require('cluster');
config.redis   = require("redis");


//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//Connexion a Redis
//--------------------------------------------------------------------------------
config.redis_pub = config.redis.createClient( config.param.redis_port, config.param.redis_host );
config.redis_pub.on("error", function (err)
{
	console.log("Error Redis: " + err);
	process.exit(1);//fin programme
});

//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//Création des processus
//--------------------------------------------------------------------------------
if( config.cluster.isMaster )//Si processus master
{
	//Si c'est le premier MASTER
	if( config.param.masterUnique )
	{
		//nettoyage de la mémmoire REDIS
		config.redis_pub.flushall();
		//include la fonction MasterUnique
		f_w.workerMasterUnique( config );
	}

	//Inclure la fonction Master
	f_w.workerMaster( config );

	// Nombre CPUs == undefined = max CPUs
	if( config.param.numCPUs == undefined )
		config.param.numCPUs = require('os').cpus().length;

	// Fork workers.
	for (var i=0; i<config.param.numCPUs; i++)
		config.cluster.fork();

	//si un processuse meurt on le relance
	config.cluster.on('exit', function(worker, code, signal)
	{
		console.log('worker ' + worker.process.pid + ' died');
		console.log('worker %d died (%s). restarting...', worker.process.pid, signal || code);
		cluster.fork();
	});

	//Affichage messages information
	console.log('--Server ON --');
	console.log( 'Start to: '+ new Date().toISOString() );
	console.log('Number run Workers: '+config.param.numCPUs);
}
else//Processus Worker
{
	//Ajout d'un numero de worker
	config.redis_pub.incr("NBworker");

	//Inclure la fonction Slave
	f_w.workerSlave( config );
}
