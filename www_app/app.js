/*
	Titre  : Client Fonction
	par    : Teysseire Guillaume
	Version: 3
	le     : 23/06/2014
	update : 20/11/2014
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
this.local_memory = {};
this.socket
this.config
this.id
*/
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
//
//
//nouveaux Client éxécuté lors de la connexion du client
//--------------------------------------------------------------------------------
exports.newClient = function()
{
	console.log('Nouvelle connexion: '+this.socket.handshake.address+' ID: '+this.id );
	var obj = this;
	this.socket.on('click',function(msg)
	{
		obj.publish('click', msg );
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
exports.disconnect = function()
{
	console.log('Deconnexion client');
}
