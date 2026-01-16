# DroneSecure

**Gestion de l'Espace Aérien - DApp pour Autorisations de Vol de Flottes de Drones**

## Description

DroneSecure est une application décentralisée (DApp) qui gère les autorisations de vol pour flottes de drones. La blockchain agit comme une "boîte noire" immuable permettant de vérifier et prouver l'historique des priorités en cas de collision.

## Caractéristiques principales

### 🏷️ Niveaux de Tokens

- **N1** : Drones < 1kg (Priorité: 10)
- **N2** : Drones < 5kg (Priorité: 100)
- **N3** : Urgence médicale (Priorité: 1000) - **Prioritaire**

### ⚡ Contraintes

- **Maximum 4 missions simultanées** par opérateur
- Historique de vol **immuable** sur la blockchain
- Zones de vol doivent être **préalablement autorisées**

### 🔄 Échanges de Slots (Sous-traitance)

- **2 slots N1** ↔ **1 slot N2**
- Échanges bidirectionnels selon la zone

### 🛡️ Sécurité & Traçabilité

- Historique **infalsifiable** des vols
- Vérification des **priorités** en cas de collision
- Contrôle d'accès strict (Owner / Opérateurs)
- Protection contre la **réentrance**

## Installation rapide

```bash
# Cloner le dépôt
git clone https://github.com/youvaKA/DroneSecure.git
cd DroneSecure

# Installer les dépendances
npm install

# Compiler le contrat
npm run compile

# Lancer les tests
npm test

# Déployer (réseau local)
npm run deploy
```

## Utilisation

### Enregistrer un opérateur

```javascript
await droneSecure.registerOperator(operatorAddress, 10, 5, 2);
// 10 slots N1, 5 slots N2, 2 slots N3
```

### Démarrer une mission

```javascript
await droneSecure.connect(operator).startMission(1, "ZONE_A");
// Level N2 (0=N1, 1=N2, 2=N3)
```

### Échanger des slots

```javascript
// 2 N1 → 1 N2
await droneSecure.connect(operator).exchangeN1ForN2(1);

// 1 N2 → 2 N1
await droneSecure.connect(operator).exchangeN2ForN1(1);
```

### Enregistrer une collision

```javascript
await droneSecure.recordCollision(missionId1, missionId2, "Details...");
// Enregistrement immuable pour enquête
```

## Documentation complète

Consultez [DOCUMENTATION.md](./DOCUMENTATION.md) pour :
- Architecture détaillée du smart contract
- Guide complet d'utilisation
- Exemples de scénarios
- Référence API complète

## Technologies

- Solidity 0.8.20
- Hardhat
- OpenZeppelin Contracts
- Ethers.js
- Chai (tests)

## Tests

Suite complète de tests couvrant :
- ✅ Enregistrement d'opérateurs
- ✅ Gestion de missions (start/complete/cancel)
- ✅ Échanges de slots
- ✅ Historique de vol immuable
- ✅ Système de priorités
- ✅ Enregistrement de collisions
- ✅ Contrôle d'accès

```bash
npm test
```

## Structure du projet

```
DroneSecure/
├── contracts/          # Smart contracts Solidity
├── test/              # Suite de tests
├── scripts/           # Scripts de déploiement
└── DOCUMENTATION.md   # Documentation complète
```

## Licence

MIT License

## Contact

Pour toute question, ouvrez une issue sur GitHub.
 
