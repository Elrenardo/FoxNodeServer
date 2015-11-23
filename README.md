# FoxNodeServer
Server Node.js multi processus et ordinateur

![Alt textView Shema](/doc/multi_core.png)

# Installation
-> Serveur Redis pour faire fonctionner le projet.
http://redis.io/
http://grainier.net/how-to-install-redis-in-ubuntu/

->Ajouter au projet:
```
npm install node-cluster
npm install socket.io
npm install redis
npm install express
```

# Configuration

Dossier www: 
```
Document html/css/image pour le serveur disponible en 127.0.0.1:8000 ( par default )
```

Dossier www_app:
```
Création de l'application que utilisera le serveur.
```

Configuration du serveur:
```
./config/config.js
./config/configWeb.js
```


1)Démarrer serveur Redis
2)Lancer le serveur:
```
node server.js
```
