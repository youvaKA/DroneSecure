# 🚀 Guide de Déploiement et Utilisation de l'Interface Web DroneSecure

Ce guide vous explique pas à pas comment déployer le smart contract DroneSecure et utiliser l'interface web complète.

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Déploiement du Smart Contract](#déploiement-du-smart-contract)
4. [Configuration de l'Interface Web](#configuration-de-linterface-web)
5. [Lancement de l'Application](#lancement-de-lapplication)
6. [Guide d'Utilisation](#guide-dutilisation)
7. [Dépannage](#dépannage)

## 🔧 Prérequis

Avant de commencer, assurez-vous d'avoir:

- ✅ **Node.js** version 16.x ou supérieure ([télécharger](https://nodejs.org))
- ✅ **npm** (inclus avec Node.js)
- ✅ **MetaMask** extension de navigateur ([installer](https://metamask.io))
- ✅ **Git** (pour cloner le repository)

Vérifiez vos versions:
```bash
node --version  # Doit être >= 16.x
npm --version   # Doit être >= 8.x
```

## 📦 Installation

### 1. Cloner le Repository

```bash
git clone https://github.com/youvaKA/DroneSecure.git
cd DroneSecure
```

### 2. Installer les Dépendances

```bash
npm install
```

Cette commande installe:
- Hardhat et ses outils
- OpenZeppelin Contracts
- Ethers.js
- React (pour futures extensions)
- Toutes les dépendances nécessaires

## 🔨 Déploiement du Smart Contract

### Option A: Déploiement Local (Recommandé pour Tests)

#### Étape 1: Démarrer un Nœud Hardhat Local

Ouvrez un premier terminal et exécutez:

```bash
npm run node
```

Vous verrez:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

⚠️ **Laissez ce terminal ouvert!** Le nœud doit rester actif.

#### Étape 2: Déployer le Contrat

Ouvrez un **nouveau terminal** dans le même dossier et exécutez:

```bash
npm run deploy:local
```

Vous verrez:
```
DroneSecure deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

📝 **IMPORTANT:** Copiez l'adresse du contrat déployé! Vous en aurez besoin pour la configuration.

### Option B: Déploiement sur Testnet (Sepolia)

#### Configuration

1. Créez un fichier `.env` à la racine du projet:

```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
```

2. Modifiez `hardhat.config.js` pour ajouter le réseau Sepolia (si ce n'est pas déjà fait)

3. Obtenez des ETH Sepolia depuis un faucet:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia

4. Déployez:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## ⚙️ Configuration de l'Interface Web

### Étape 1: Ouvrir le Fichier de Configuration

Ouvrez le fichier `frontend/src/app.js` dans votre éditeur de code.

### Étape 2: Mettre à Jour l'Adresse du Contrat

Trouvez la ligne (environ ligne 17):

```javascript
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
```

Remplacez-la par l'adresse de votre contrat déployé:

```javascript
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Votre adresse
```

### Étape 3: Sauvegarder

Sauvegardez le fichier (`Ctrl+S` ou `Cmd+S`).

## 🌐 Lancement de l'Application

### Méthode 1: Serveur Node.js Intégré (Recommandé)

```bash
npm run frontend
```

ou

```bash
npm start
```

Vous verrez:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛸 DroneSecure Frontend Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Server running at:
   http://localhost:8000
...
```

Ouvrez votre navigateur à **http://localhost:8000**

### Méthode 2: Python HTTP Server

```bash
cd frontend/public
python3 -m http.server 8000
```

Ouvrez votre navigateur à **http://localhost:8000**

### Méthode 3: Live Server (VS Code)

1. Installez l'extension "Live Server" dans VS Code
2. Clic droit sur `frontend/public/index.html`
3. Sélectionnez "Open with Live Server"

## 🔐 Configuration de MetaMask

### Pour Réseau Local (Hardhat)

1. Ouvrez MetaMask
2. Cliquez sur le sélecteur de réseau en haut
3. Cliquez sur "Ajouter un réseau" → "Ajouter un réseau manuellement"
4. Entrez les informations:
   - **Nom du réseau:** Hardhat Local
   - **Nouvelle URL RPC:** http://127.0.0.1:8545
   - **ID de chaîne:** 31337
   - **Symbole de devise:** ETH
5. Cliquez sur "Enregistrer"

### Importer un Compte de Test

1. Dans MetaMask, cliquez sur l'icône du compte
2. Sélectionnez "Importer un compte"
3. Collez une clé privée d'un compte Hardhat (depuis le terminal où vous avez lancé `npm run node`)
4. Par exemple: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

⚠️ **ATTENTION:** N'utilisez JAMAIS ces clés sur le mainnet! Elles sont publiques et pour tests uniquement.

### Pour Sepolia Testnet

1. Dans MetaMask, sélectionnez "Sepolia test network"
2. Si vous ne le voyez pas, activez les réseaux de test dans Paramètres → Avancé → Afficher les réseaux de test

## 📱 Guide d'Utilisation

### 1. Connexion

1. Ouvrez http://localhost:8000 dans votre navigateur
2. Cliquez sur **"Connecter Wallet"**
3. MetaMask s'ouvrira, cliquez sur **"Suivant"** puis **"Connecter"**
4. L'interface affichera votre adresse et votre tableau de bord

### 2. Créer une Mission

1. Cliquez sur l'onglet **"➕ Créer Mission"**
2. Sélectionnez un **niveau de ressource**:
   - Standard (Niveau 1) - Missions normales
   - Express (Niveau 2) - Livraisons rapides
   - Urgence Médicale (Niveau 3) - Priorité maximale
3. Entrez un **nom de mission** (ex: "Mission_Alpha_2026")
4. Entrez un **IPFS CID** - Utilisez l'exemple du projet:
   ```
   QmP7hdxcUCjC5aM6ZgcRvSgMPP9HjL1F9Zr2xVZ1MqQ8Lh
   ```
5. Cliquez sur **"Créer Mission"**
6. Confirmez la transaction dans MetaMask
7. Attendez la confirmation (quelques secondes)

📝 **Note:** Vous pouvez créer jusqu'à 4 missions actives et devez attendre 5 minutes entre chaque création.

### 3. Visualiser vos Missions

1. Cliquez sur l'onglet **"🗂️ Mes Missions"**
2. Toutes vos missions actives s'affichent
3. Utilisez le **filtre par niveau** pour affiner la vue
4. Cliquez sur **"📄 Détails"** pour voir toutes les informations
5. Cliquez sur **"🔗 IPFS"** pour voir les métadonnées sur IPFS

### 4. Échanger des Ressources (Swap)

Pour obtenir une mission Urgence Médicale:

1. Créez d'abord 3 missions **Standard** (niveau 1)
2. Allez dans l'onglet **"🔄 Échanger Ressources"**
3. Cochez **exactement 3 missions Standard**
4. Entrez un **IPFS CID** pour la nouvelle mission
5. Cliquez sur **"Échanger 3 → 1"**
6. Confirmez dans MetaMask
7. Vous recevrez 1 mission Urgence Médicale et perdrez les 3 Standard

### 5. Transférer une Mission

⚠️ **Important:** Les missions sont verrouillées pendant 10 minutes après leur création.

1. Attendez 10 minutes après avoir créé la mission
2. Allez dans l'onglet **"📤 Transférer"**
3. Sélectionnez la mission à transférer (vérifiez qu'elle est ✓ Transférable)
4. Entrez l'**adresse du destinataire** (format 0x...)
5. Cliquez sur **"Transférer Mission"**
6. Confirmez dans MetaMask

## 🧪 Tests

### Exécuter les Tests du Smart Contract

```bash
npm test
```

Vous devriez voir 70+ tests passer:
```
  ✓ Should create a mission with Standard level
  ✓ Should create a mission with Express level
  ✓ Should create a mission with MedicalUrgency level
  ...
  70 passing (3s)
```

## 🐛 Dépannage

### Problème: "MetaMask n'est pas installé"

**Solution:**
- Installez MetaMask: https://metamask.io
- Actualisez la page après l'installation

### Problème: "Contrat non initialisé"

**Solution:**
1. Vérifiez que vous avez déployé le contrat (`npm run deploy:local`)
2. Vérifiez que CONTRACT_ADDRESS dans `frontend/src/app.js` est correct
3. Vérifiez que MetaMask est sur le bon réseau (Hardhat Local pour développement)

### Problème: "Erreur lors de la connexion"

**Solution:**
- Vérifiez que MetaMask est déverrouillé
- Vérifiez que vous êtes sur le bon réseau
- Actualisez la page et réessayez
- Vérifiez la console du navigateur (F12) pour plus de détails

### Problème: "Cooldown actif. Attendez 5 minutes"

**Explication:** Vous avez créé une mission il y a moins de 5 minutes.

**Solution:**
- Attendez que le cooldown expire
- Le tableau de bord affiche le temps restant

### Problème: "Limite atteinte: maximum 4 missions actives"

**Explication:** Vous avez déjà 4 missions actives.

**Solution:**
- Transférez des missions à d'autres adresses
- Ou échangez 3 missions Standard contre 1 Urgence Médicale

### Problème: "Mission verrouillée"

**Explication:** Les missions sont verrouillées pendant 10 minutes après création.

**Solution:**
- Attendez 10 minutes
- L'interface indique si une mission est transférable (✓) ou verrouillée (🔒)

### Problème: "Transaction échouée"

**Solutions possibles:**
- Vérifiez que vous avez assez d'ETH pour les frais de gas
- Sur réseau local: redémarrez le nœud Hardhat (`npm run node`)
- Vérifiez les conditions de la transaction (cooldown, limite, lock, etc.)

### Problème: La liste des missions est vide

**Solution:**
- Cliquez sur "🔄 Actualiser"
- Vérifiez que des missions ont bien été créées
- Vérifiez la console du navigateur (F12) pour des erreurs
- Assurez-vous que CONTRACT_ADDRESS est correct

## 📊 Vérification du Déploiement

### Checklist de Vérification

- [ ] Le nœud Hardhat est en cours d'exécution
- [ ] Le contrat est déployé avec succès
- [ ] CONTRACT_ADDRESS est mis à jour dans app.js
- [ ] Le serveur frontend est lancé
- [ ] MetaMask est installé et configuré
- [ ] Un compte de test est importé dans MetaMask
- [ ] MetaMask est connecté au bon réseau
- [ ] La connexion wallet fonctionne
- [ ] Le tableau de bord affiche les informations
- [ ] Les tests passent tous

### Commandes de Diagnostic

```bash
# Vérifier que Node.js est installé
node --version

# Vérifier que les dépendances sont installées
npm list --depth=0

# Compiler le contrat
npm run compile

# Tester le contrat
npm test

# Vérifier que le serveur frontend démarre
npm run frontend
```

## 🎯 Fonctionnalités de l'Interface

### ✅ Implémenté

- [x] Connexion/Déconnexion wallet MetaMask
- [x] Tableau de bord avec statistiques
- [x] Création de missions (3 niveaux)
- [x] Visualisation de toutes les missions
- [x] Filtrage par niveau
- [x] Détails complets des missions
- [x] Échange de ressources (3 Standard → 1 Urgence)
- [x] Transfert de missions
- [x] Vérification du statut de verrouillage
- [x] Affichage du cooldown
- [x] Liens vers IPFS
- [x] Gestion des erreurs
- [x] Notifications utilisateur
- [x] Design responsive

### 🔮 Améliorations Futures

- [ ] Upload de fichiers vers IPFS via Pinata API
- [ ] Graphiques et statistiques avancées
- [ ] Historique des transactions
- [ ] Notifications en temps réel
- [ ] Mode sombre
- [ ] Support multilingue
- [ ] Intégration WalletConnect

## 📚 Ressources Supplémentaires

- **Documentation du Projet:** README.md
- **Rapport Technique:** RAPPORT_TECHNIQUE.md
- **Cas d'Usage:** CAS_USAGE.md
- **Documentation Frontend:** frontend/README.md
- **Smart Contract:** contracts/DroneSecure.sol
- **Tests:** test/DroneSecure.test.js

## 🎓 Tutoriel Vidéo (À venir)

Un tutoriel vidéo sera créé pour montrer:
1. L'installation complète
2. Le déploiement du contrat
3. La configuration de MetaMask
4. L'utilisation de chaque fonctionnalité
5. Des cas d'usage réels

## 💡 Conseils et Bonnes Pratiques

### Pour le Développement

1. **Utilisez toujours le réseau local** pour les tests
2. **Redémarrez le nœud Hardhat** si vous rencontrez des problèmes
3. **Vérifiez la console du navigateur** pour déboguer
4. **Testez chaque fonctionnalité** après un changement

### Pour la Production

1. **Déployez sur Sepolia** avant le mainnet
2. **Vérifiez le contrat sur Etherscan**
3. **Faites un audit de sécurité**
4. **Testez avec de vrais utilisateurs** sur testnet
5. **Documentez toute configuration spécifique**

## 🎉 Félicitations!

Si vous avez suivi tous les étapes, vous avez maintenant:

✅ Un smart contract DroneSecure déployé
✅ Une interface web fonctionnelle et complète
✅ Une compréhension de la blockchain et du Web3
✅ La capacité de créer, gérer et transférer des missions de drones

**Profitez de DroneSecure! 🛸**

---

Pour toute question ou problème:
- Ouvrez une issue sur GitHub
- Consultez la documentation
- Rejoignez la communauté

© 2026 DroneSecure - Système de Gestion Décentralisée de l'Espace Aérien
