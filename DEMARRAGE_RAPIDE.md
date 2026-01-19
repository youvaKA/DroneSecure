# 🚀 Guide de Démarrage Rapide - DroneSecure Interface Web

## 📝 Résumé

Cette interface web vous permet d'interagir facilement avec le smart contract DroneSecure pour:
- 🛸 Créer des missions de drones
- 📊 Visualiser vos missions
- 🔄 Échanger des ressources
- 📤 Transférer des missions
- 📦 Uploader automatiquement vers IPFS

## 🚀 Démarrage en 5 Minutes

### 1️⃣ Installation

```bash
git clone https://github.com/youvaKA/DroneSecure.git
cd DroneSecure
npm install
```

### 2️⃣ Déployer le Smart Contract

**Terminal 1:**
```bash
npm run node
```
Laissez ce terminal ouvert.

**Terminal 2:**
```bash
npm run deploy:local
```
📝 Copiez l'adresse du contrat affichée (ex: `0x5FbDB2...`)

### 3️⃣ Configurer l'Interface

Ouvrez `frontend/src/app.js` et remplacez:
```javascript
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
```
par:
```javascript
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Votre adresse
```

### 4️⃣ Lancer l'Interface

**Terminal 3:**
```bash
npm start
```

### 5️⃣ Ouvrir dans le Navigateur

Ouvrez http://localhost:8000

### 6️⃣ Configurer MetaMask

1. Ajoutez le réseau Hardhat Local:
   - Nom: **Hardhat Local**
   - RPC URL: **http://127.0.0.1:8545**
   - Chain ID: **31337**
   - Symbole: **ETH**

2. Importez un compte de test (clé privée du Terminal 1):
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

### 7️⃣ Connectez-vous!

Cliquez sur **"Connecter Wallet"** dans l'interface.

## 🎉 C'est Prêt!

Vous pouvez maintenant:
- ✅ Créer des missions
- ✅ Uploader vers IPFS (avec clés Pinata)
- ✅ Gérer vos missions
- ✅ Échanger et transférer

## 📚 Documentation Complète

- **Interface Web:** [GUIDE_INTERFACE_WEB.md](GUIDE_INTERFACE_WEB.md)
- **IPFS/Pinata:** [GUIDE_IPFS_PINATA.md](GUIDE_IPFS_PINATA.md)
- **Smart Contract:** [README.md](README.md)
- **Rapport Technique:** [RAPPORT_TECHNIQUE.md](RAPPORT_TECHNIQUE.md)

## 🔑 Clés Pinata (Optionnel)

Pour utiliser l'upload IPFS automatique:
1. Créez un compte sur [Pinata.cloud](https://www.pinata.cloud/)
2. Générez vos API Keys
3. Entrez-les dans l'interface

Sans clés Pinata, vous pouvez toujours utiliser des CID IPFS existants.

## 🆘 Besoin d'Aide?

- Consultez les guides détaillés
- Ouvrez une issue sur GitHub
- Vérifiez que tous les services sont démarrés

## ⚡ Commandes Utiles

```bash
# Démarrer le nœud Hardhat
npm run node

# Déployer le contrat
npm run deploy:local

# Lancer les tests
npm test

# Compiler le contrat
npm run compile

# Lancer l'interface web
npm start
# ou
npm run frontend
```

## 📸 Capture d'Écran

[La capture d'écran sera ajoutée après le premier lancement]

---

**Bon vol avec DroneSecure! 🛸**
