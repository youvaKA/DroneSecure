# DroneSecure Frontend

Interface utilisateur React pour la DApp DroneSecure.

## Installation

```bash
cd frontend
npm install
```

## Configuration

Avant de lancer le frontend, assurez-vous que:

1. Le contrat intelligent est déployé sur un réseau (local Hardhat ou testnet)
2. Mettez à jour l'adresse du contrat dans `src/App.jsx`:

```javascript
const CONTRACT_ADDRESS = '0xVOTRE_ADRESSE_DE_CONTRAT'
```

## Démarrage

### Développement local

1. Démarrez un nœud Hardhat local (dans le répertoire racine):
```bash
npm run node
```

2. Déployez le contrat:
```bash
npm run deploy:local
```

3. Copiez l'adresse du contrat déployé

4. Démarrez le frontend:
```bash
cd frontend
npm run dev
```

5. Ouvrez http://localhost:3000 dans votre navigateur

## Configuration MetaMask

Pour se connecter au réseau local Hardhat:

1. Ouvrez MetaMask
2. Ajoutez un réseau personnalisé:
   - Nom: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Symbole: ETH

3. Importez un compte de test depuis Hardhat (utilisez une des clés privées affichées au démarrage du nœud)

## Fonctionnalités

- **Connexion Wallet**: Connexion avec MetaMask
- **Créer Mission**: Créer une nouvelle mission de drone avec niveau de ressource
- **Voir Missions**: Afficher toutes vos missions actives
- **Échanger Ressources**: Échanger 3 tokens Standard contre 1 token Urgence Médicale
- **Statistiques**: Voir le nombre de missions actives et le statut du cooldown

## Build pour Production

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`.

## Technologies

- React 18
- Vite
- ethers.js 6
- CSS moderne
