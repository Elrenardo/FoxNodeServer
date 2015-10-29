# FoxNodeServer
Server Node.js multi processus et ordinateur


# Installation
-> Serveur Redis pour faire fonctionner le projet.

http://redis.io/

->Ajouter au projet:
```
npm install node-cluster
npm install socket.io
npm install redis
npm install express
```

# Configuration

Dossier public: 
```
Document html/css/image pour le serveur disponible en 127.0.0.1:8000 ( par default )
```

Dossier private:
```
Création de l'application que utilisera le serveur.
```

Configuration du serveur:
```
./config.js
./configWeb.js
```


Lancer le serveur:
```
node server.js
```
