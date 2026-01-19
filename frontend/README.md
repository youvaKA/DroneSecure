# DroneSecure - Interface Web

Interface web complète pour interagir avec le smart contract DroneSecure.

## 🎯 Fonctionnalités

### ✅ Connexion Wallet
- Connexion avec MetaMask
- Affichage de l'adresse et du nombre de missions
- Détection automatique des changements de compte

### 📊 Tableau de Bord
- Vue d'ensemble des missions actives
- Statut du cooldown
- Capacité de création de nouvelles missions
- Informations du contrat et réseau

### ➕ Création de Missions
- Interface intuitive pour créer des missions
- Sélection du niveau de ressource (Standard, Express, Urgence Médicale)
- Intégration IPFS
- Validation des contraintes (cooldown, limite de 4 missions)

### 🗂️ Gestion des Missions
- Visualisation de toutes vos missions actives
- Filtrage par niveau de ressource
- Détails complets de chaque mission
- Affichage du statut de transfert (verrouillé/transférable)
- Liens directs vers IPFS

### 🔄 Échange de Ressources
- Interface pour échanger 3 missions Standard contre 1 Urgence Médicale
- Sélection visuelle des missions à échanger
- Validation automatique

### 📤 Transfert de Missions
- Transfert de missions vers d'autres adresses
- Vérification du statut de verrouillage
- Affichage des informations de la mission avant transfert

## 🚀 Installation et Utilisation

### Prérequis

- Node.js >= 16.x
- MetaMask installé dans votre navigateur
- Contrat DroneSecure déployé sur un réseau Ethereum

### Étape 1: Déployer le Smart Contract

```bash
# À la racine du projet DroneSecure
npm install
npm run compile

# Démarrer un nœud Hardhat local
npm run node

# Dans un autre terminal, déployer le contrat
npm run deploy:local
```

Notez l'adresse du contrat déployé qui sera affichée dans la console.

### Étape 2: Configurer l'Interface Web

1. Ouvrez le fichier `frontend/src/app.js`
2. Remplacez `YOUR_CONTRACT_ADDRESS_HERE` par l'adresse du contrat déployé:

```javascript
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Exemple
```

### Étape 3: Lancer l'Interface Web

Vous avez plusieurs options pour lancer l'interface:

#### Option A: Serveur HTTP Simple avec Python

```bash
cd frontend/public
python3 -m http.server 8000
```

Ouvrez votre navigateur à `http://localhost:8000`

#### Option B: Serveur HTTP Simple avec Node.js

```bash
# Installer http-server globalement
npm install -g http-server

# Lancer depuis le dossier frontend/public
cd frontend/public
http-server -p 8000
```

Ouvrez votre navigateur à `http://localhost:8000`

#### Option C: Live Server (VS Code)

Si vous utilisez VS Code:
1. Installez l'extension "Live Server"
2. Faites un clic droit sur `frontend/public/index.html`
3. Sélectionnez "Open with Live Server"

### Étape 4: Connecter MetaMask

1. Assurez-vous que MetaMask est connecté au même réseau que celui où le contrat est déployé
2. Pour un réseau Hardhat local:
   - Réseau: Localhost 8545
   - Chain ID: 31337
3. Cliquez sur "Connecter Wallet" dans l'interface
4. Approuvez la connexion dans MetaMask

## 📖 Guide d'Utilisation

### Créer une Mission

1. Allez dans l'onglet "Créer Mission"
2. Sélectionnez le niveau de ressource
3. Entrez un nom pour la mission
4. Entrez le CID IPFS des métadonnées
5. Cliquez sur "Créer Mission"
6. Confirmez la transaction dans MetaMask

### Visualiser vos Missions

1. Allez dans l'onglet "Mes Missions"
2. Cliquez sur "Actualiser" pour mettre à jour la liste
3. Utilisez le filtre pour afficher uniquement certains niveaux
4. Cliquez sur "Détails" pour voir toutes les informations d'une mission

### Échanger des Ressources

1. Allez dans l'onglet "Échanger Ressources"
2. Sélectionnez exactement 3 missions Standard
3. Entrez le CID IPFS pour la nouvelle mission Urgence Médicale
4. Cliquez sur "Échanger 3 → 1"
5. Confirmez la transaction dans MetaMask

### Transférer une Mission

1. Allez dans l'onglet "Transférer"
2. Sélectionnez la mission à transférer
3. Vérifiez que la mission est transférable (pas verrouillée)
4. Entrez l'adresse du destinataire
5. Cliquez sur "Transférer Mission"
6. Confirmez la transaction dans MetaMask

## 🔧 Configuration Avancée

### Réseaux Supportés

L'interface fonctionne sur tous les réseaux Ethereum compatibles EVM:
- Hardhat Local (pour développement)
- Sepolia (testnet recommandé)
- Goerli
- Mainnet (production)

### Personnalisation

Vous pouvez personnaliser l'interface en modifiant:
- `styles.css` - Pour changer l'apparence
- `app.js` - Pour modifier la logique

## 🐛 Dépannage

### Problème: "MetaMask n'est pas installé"
**Solution:** Installez MetaMask depuis https://metamask.io

### Problème: "Erreur lors de la connexion"
**Solution:** 
- Vérifiez que MetaMask est déverrouillé
- Vérifiez que vous êtes sur le bon réseau
- Actualisez la page et réessayez

### Problème: "Contrat non initialisé"
**Solution:**
- Vérifiez que CONTRACT_ADDRESS dans app.js est correct
- Vérifiez que le contrat est déployé sur le réseau actuel
- Vérifiez l'adresse du contrat dans la console du navigateur

### Problème: "Cooldown actif"
**Solution:** Attendez 5 minutes depuis votre dernière création de mission

### Problème: "Limite atteinte"
**Solution:** Vous avez déjà 4 missions actives. Transférez ou échangez-en avant d'en créer de nouvelles

### Problème: "Mission verrouillée"
**Solution:** Attendez 10 minutes après la création d'une mission avant de la transférer

## 📱 Responsive Design

L'interface est entièrement responsive et fonctionne sur:
- 💻 Desktop
- 📱 Mobile
- 📱 Tablette

## 🔐 Sécurité

- ✅ Toutes les transactions sont signées par l'utilisateur via MetaMask
- ✅ Aucune clé privée n'est stockée ou manipulée
- ✅ Validation côté client avant l'envoi des transactions
- ✅ Gestion des erreurs et messages clairs

## 📚 Technologies Utilisées

- **HTML5** - Structure
- **CSS3** - Style et animations
- **JavaScript (ES6+)** - Logique applicative
- **Ethers.js v5.7.2** - Interaction Web3
- **MetaMask** - Wallet provider

## 🎨 Capture d'Écran

[Les captures d'écran seront ajoutées après le premier lancement]

## 📄 Licence

MIT License - Voir le fichier LICENSE à la racine du projet

## 👥 Support

Pour toute question ou problème:
- Ouvrez une issue sur GitHub
- Consultez la documentation principale dans README.md
- Consultez les documents techniques (RAPPORT_TECHNIQUE.md, CAS_USAGE.md)

## 🚀 Prochaines Fonctionnalités

- [ ] Upload direct de fichiers vers IPFS via Pinata
- [ ] Graphiques et statistiques avancées
- [ ] Historique des transactions
- [ ] Notifications en temps réel via WebSocket
- [ ] Mode sombre
- [ ] Support multilingue
- [ ] Intégration avec d'autres wallets (WalletConnect)
