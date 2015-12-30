/*
	Titre  : Client Fonction
	par    : Teysseire Guillaume
	Version: 5
	le     : 23/06/2014
	update : 30/12/2015
*/
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//Fonction liée au worker
//--------------------------------------------------------------------------------
//Fonction appelé par le programme Master
exports.workerMasterUnique = function( config )
{
	
}

//fonction appelé par les worker Master
exports.workerMaster = function( config )
{
	
}

//Fonction Init des Worker
exports.workerInit = function( config )
{

}

//===============================================================================
//===============================================================================
//===============================================================================
/*
-- METHODE THIS --
this.publish( channel, message_tab );
this.set( id, data_tab );
this.get( id, callback );
this.redis();
this.config
*/
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//nouveaux Client éxécuté lors de la connexion du client
//--------------------------------------------------------------------------------
exports.newClient = function( client )
{
	console.log('Nouvelle connexion: '+client.socket.handshake.address+' ID: '+client.id );
	client.socket.on('click',function(msg)
	{
		client.publish('click', msg );
	});
}

//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//Event appelé lors de la reception de data du publish redis
//--------------------------------------------------------------------------------
exports.getRedisEvent = function( channel, message_tab )
{
	console.log( 'Reception event: '+channel+' => '+message_tab );
	this.socket.emit( channel, message_tab );
}

//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//Deconnexion
//--------------------------------------------------------------------------------
exports.disconnect = function( client )
{
	console.log('Deconnexion client');
}
