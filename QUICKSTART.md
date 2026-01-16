# 🚀 Guide de Démarrage Rapide - DroneSecure

Ce guide vous accompagne pas à pas pour lancer DroneSecure en local.

## Prérequis

✅ Node.js 16.x ou supérieur
✅ npm ou yarn
✅ MetaMask installé dans votre navigateur

## Installation Complète en 5 Minutes

### Étape 1: Cloner et Installer

```bash
# Cloner le dépôt
git clone https://github.com/youvaKA/DroneSecure.git
cd DroneSecure

# Installer les dépendances du contrat
npm install

# Installer les dépendances du frontend
cd frontend
npm install
cd ..
```

### Étape 2: Démarrer le Réseau Local

Dans un premier terminal:

```bash
# Démarrer Hardhat Network
npm run node
```

💡 **Gardez ce terminal ouvert** - c'est votre blockchain locale

Vous verrez s'afficher:
- L'URL du réseau: `http://127.0.0.1:8545`
- 20 comptes de test avec leurs clés privées

### Étape 3: Déployer le Contrat

Dans un second terminal:

```bash
# Déployer DroneSecure
npm run deploy:local
```

✅ Le script va:
1. Déployer le contrat sur le réseau local
2. Afficher l'adresse du contrat
3. Créer automatiquement le fichier de configuration pour le frontend

Exemple de sortie:
```
DroneSecure deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

Contract Configuration:
- Max Missions Per User: 4
- Cooldown Period: 300 seconds (5 minutes)
- Lock Period: 600 seconds (10 minutes)
- Swap Ratio: 3 Standard tokens for 1 Medical Urgency

✅ Contract address saved to frontend/src/utils/contract-config.json
```

### Étape 4: Configurer MetaMask

1. **Ouvrir MetaMask** et ajouter un réseau personnalisé:

   - **Nom du réseau**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `1337`
   - **Symbole**: ETH

2. **Importer un compte de test**:
   
   - Copiez une des clés privées affichées par Hardhat (dans le premier terminal)
   - Dans MetaMask: Menu > Importer un compte > Coller la clé privée
   
   💰 Chaque compte de test a 10,000 ETH

### Étape 5: Lancer le Frontend

Dans un troisième terminal:

```bash
cd frontend
npm run dev
```

🌐 Ouvrez votre navigateur sur **http://localhost:3000**

## 🎮 Utilisation

### 1. Connecter votre Wallet

- Cliquez sur "Connecter MetaMask"
- Approuvez la connexion dans MetaMask
- Votre adresse s'affiche

### 2. Créer une Mission

- Choisissez un niveau de ressource:
  - **Standard (1)**: Mission normale
  - **Express (2)**: Livraison prioritaire
  - **Urgence Médicale (3)**: Priorité maximale
- Entrez un CID IPFS (exemple: `QmTest123...`)
- Cliquez sur "Créer la Mission"
- Confirmez la transaction dans MetaMask

### 3. Voir vos Missions

- Toutes vos missions actives apparaissent dans la section "Mes Missions"
- Cliquez sur "🔄 Rafraîchir" pour mettre à jour

### 4. Échanger des Ressources

- Créez au moins 3 missions de niveau **Standard**
- Dans "Échanger des Ressources":
  - Sélectionnez 3 tokens Standard
  - Entrez un CID IPFS pour le nouveau token
  - Cliquez sur "Échanger les Ressources"
- Vous obtenez 1 token **Urgence Médicale** 🚑

## 🔍 Vérifier les Contraintes

### Limite de Missions (4 max)
- Essayez de créer une 5ème mission → ❌ Bloqué

### Cooldown (5 minutes)
- Créez une mission
- Essayez d'en créer une autre immédiatement → ❌ Bloqué
- Attendez 5 minutes → ✅ Autorisé

### Lock de Transfert (10 minutes)
- Les tokens sont bloqués 10 minutes après création
- Le statut "Transférable" montre si le token est déverrouillé

## 🧪 Tester avec les Tests Automatisés

```bash
# Dans le répertoire racine
npm test
```

Vous devriez voir:
```
  40 passing (1s)
```

## 🐛 Résolution de Problèmes

### "MetaMask non installé"
➡️ Installez l'extension MetaMask pour votre navigateur

### "Transaction rejetée"
➡️ Vérifiez que vous avez sélectionné le réseau Hardhat Local dans MetaMask

### "Cooldown period not elapsed"
➡️ Attendez 5 minutes entre deux créations de missions

### "Maximum missions limit reached"
➡️ Vous avez 4 missions actives. Transférez-en une ou utilisez l'échange de ressources

### Le frontend ne se connecte pas au contrat
➡️ Vérifiez que:
1. Le nœud Hardhat tourne (terminal 1)
2. Le contrat est déployé (terminal 2)
3. Le fichier `frontend/src/utils/contract-config.json` existe

## 📚 Pour Aller Plus Loin

- 📖 [README Complet](README.md)
- 🔧 [Documentation Frontend](frontend/README.md)
- 📝 [CHANGELOG](CHANGELOG.md)
- 🎯 [Tests](test/DroneSecure.test.js)

## 🎉 Félicitations !

Vous avez lancé DroneSecure avec succès ! 

Explorez les différentes fonctionnalités et n'hésitez pas à:
- Créer des missions
- Échanger des ressources
- Tester les contraintes métiers
- Consulter les logs blockchain dans le terminal Hardhat

Pour toute question, ouvrez une issue sur GitHub.
