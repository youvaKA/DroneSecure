# DroneSecure - Gestion de l'Espace Aérien

## Vue d'ensemble

DroneSecure est une DApp (Application Décentralisée) de gestion des autorisations de vol pour flottes de drones. Elle utilise la blockchain comme une "boîte noire" immuable permettant de vérifier l'historique des priorités en cas de collision.

## Caractéristiques

### Niveaux de Tokens (Drones)

- **N1**: Drones légers (< 1kg) - Priorité: 10
- **N2**: Drones moyens (< 5kg) - Priorité: 100  
- **N3**: Urgence médicale - Priorité: 1000 (prioritaire)

### Contraintes

- **Maximum 4 missions simultanées** par opérateur
- **Historique immuable** de tous les événements de vol stocké sur la blockchain
- **Zones autorisées** : Seules les zones préalablement autorisées permettent des vols

### Échanges de Slots (Sous-traitance)

Le système permet l'échange de slots entre niveaux :
- **2 slots N1 ↔ 1 slot N2** (configurable par zone)
- Échanges bidirectionnels possibles

## Architecture du Smart Contract

### Structures de données principales

```solidity
enum DroneLevel { N1, N2, N3 }
enum MissionStatus { Active, Completed, Cancelled }

struct Mission {
    uint256 missionId;
    address operator;
    DroneLevel level;
    string zone;
    uint256 startTime;
    uint256 endTime;
    MissionStatus status;
    uint256 priority;
}

struct Operator {
    address operatorAddress;
    uint256 activeMissions;
    uint256 n1Slots;
    uint256 n2Slots;
    uint256 n3Slots;
    bool isRegistered;
}

struct FlightHistoryEntry {
    uint256 missionId;
    address operator;
    DroneLevel level;
    string zone;
    uint256 timestamp;
    string eventType;
    string details;
}
```

### Fonctions principales

#### Administration (Owner only)

- `registerOperator(address, n1Slots, n2Slots, n3Slots)` - Enregistrer un nouvel opérateur
- `allocateSlots(address, level, amount)` - Allouer des slots supplémentaires
- `authorizeZone(string zone)` - Autoriser une zone de vol
- `recordCollision(missionId1, missionId2, details)` - Enregistrer une collision

#### Opérateurs

- `startMission(level, zone)` - Démarrer une mission
- `completeMission(missionId)` - Terminer une mission
- `cancelMission(missionId)` - Annuler une mission
- `exchangeN1ForN2(amount)` - Échanger 2 N1 contre 1 N2
- `exchangeN2ForN1(amount)` - Échanger 1 N2 contre 2 N1

#### Consultation

- `getOperator(address)` - Obtenir les informations d'un opérateur
- `getMission(missionId)` - Obtenir les détails d'une mission
- `getFlightHistory(historyId)` - Consulter l'historique de vol
- `getActiveMissions()` - Liste des missions actives
- `getActiveMissionsInZone(zone)` - Missions actives dans une zone
- `getTotalMissions()` - Nombre total de missions
- `getTotalHistoryEntries()` - Nombre total d'entrées d'historique

## Installation

### Prérequis

- Node.js >= 14.0.0
- npm ou yarn

### Installation des dépendances

```bash
npm install
```

## Utilisation

### Compilation

```bash
npm run compile
```

### Tests

Le projet inclut une suite complète de tests couvrant :
- Enregistrement d'opérateurs
- Allocation de slots
- Gestion de missions
- Échanges de slots
- Historique de vol
- Enregistrement de collisions
- Système de priorités
- Contrôle d'accès

```bash
npm test
```

### Déploiement

Sur un réseau local Hardhat :

```bash
# Terminal 1 - Démarrer un nœud local
npm run node

# Terminal 2 - Déployer le contrat
npm run deploy
```

## Exemples d'utilisation

### 1. Enregistrer un opérateur

```javascript
await droneSecure.registerOperator(
  operatorAddress,
  10,  // 10 slots N1
  5,   // 5 slots N2
  2    // 2 slots N3
);
```

### 2. Autoriser une zone

```javascript
await droneSecure.authorizeZone("ZONE_A");
```

### 3. Démarrer une mission

```javascript
// N1 = 0, N2 = 1, N3 = 2
await droneSecure.connect(operator).startMission(
  1,        // Level N2
  "ZONE_A"  // Zone autorisée
);
```

### 4. Échanger des slots

```javascript
// Échanger 2 N1 pour obtenir 1 N2
await droneSecure.connect(operator).exchangeN1ForN2(1);

// Échanger 1 N2 pour obtenir 2 N1
await droneSecure.connect(operator).exchangeN2ForN1(1);
```

### 5. Compléter une mission

```javascript
await droneSecure.connect(operator).completeMission(missionId);
```

### 6. Consulter l'historique en cas de collision

```javascript
// L'owner enregistre la collision
await droneSecure.recordCollision(
  missionId1,
  missionId2,
  "Collision détectée aux coordonnées X:123, Y:456"
);

// Consulter l'historique
const history = await droneSecure.getFlightHistory(historyId);
console.log(history.eventType);  // "COLLISION"
console.log(history.details);    // Détails de la collision
```

## Sécurité

### Contrôles d'accès

- **Owner** : Seul le propriétaire du contrat peut :
  - Enregistrer des opérateurs
  - Allouer des slots
  - Autoriser des zones
  - Enregistrer des collisions

- **Opérateurs** : Les opérateurs enregistrés peuvent :
  - Démarrer/terminer/annuler leurs propres missions
  - Échanger leurs slots

### Protection ReentrancyGuard

Toutes les fonctions critiques sont protégées contre les attaques de réentrance.

### Immutabilité de l'historique

L'historique de vol est stocké de manière immuable sur la blockchain, garantissant :
- Traçabilité complète des missions
- Vérification des priorités en cas de collision
- Impossibilité de falsification par des tiers

## Événements émis

- `OperatorRegistered` - Nouvel opérateur enregistré
- `SlotsAllocated` - Slots alloués à un opérateur
- `MissionStarted` - Mission démarrée
- `MissionCompleted` - Mission terminée
- `MissionCancelled` - Mission annulée
- `SlotsExchanged` - Échange de slots effectué
- `FlightHistoryRecorded` - Entrée ajoutée à l'historique
- `ZoneAuthorized` - Zone autorisée
- `CollisionDetected` - Collision détectée entre deux missions

## Cas d'usage

### Scénario 1 : Opération standard

1. L'administrateur enregistre un opérateur avec des slots
2. L'opérateur démarre une mission N1 dans ZONE_A
3. Le drone effectue sa mission
4. L'opérateur termine la mission (le slot est retourné)

### Scénario 2 : Urgence médicale

1. Un opérateur démarre une mission N3 (priorité 1000)
2. En cas de conflit aérien, la priorité N3 est vérifiable sur la blockchain
3. L'historique immuable prouve la priorité de la mission médicale

### Scénario 3 : Sous-traitance

1. L'opérateur A a 4 slots N1 mais besoin d'un slot N2
2. Il échange 2 slots N1 contre 1 slot N2
3. Il peut maintenant démarrer une mission N2

### Scénario 4 : Investigation de collision

1. Deux drones entrent en collision dans ZONE_A
2. L'administrateur enregistre la collision sur la blockchain
3. L'historique immuable permet de vérifier :
   - Les opérateurs impliqués
   - Les niveaux de drones
   - Les priorités respectives
   - Les horodatages exacts

## Structure du projet

```
DroneSecure/
├── contracts/
│   └── DroneSecure.sol       # Smart contract principal
├── test/
│   └── DroneSecure.test.js   # Suite de tests
├── scripts/
│   └── deploy.js             # Script de déploiement
├── hardhat.config.js         # Configuration Hardhat
├── package.json              # Dépendances du projet
├── .gitignore               # Fichiers à ignorer
└── README.md                # Cette documentation
```

## Technologies utilisées

- **Solidity 0.8.20** - Langage du smart contract
- **Hardhat** - Environnement de développement Ethereum
- **OpenZeppelin** - Bibliothèques de contrats sécurisés
- **Chai** - Framework de tests
- **Ethers.js** - Interaction avec Ethereum

## Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## Support

Pour toute question ou problème, veuillez ouvrir une issue sur le dépôt GitHub.

## Roadmap

### Futures améliorations possibles

- [ ] Interface web pour les opérateurs
- [ ] Intégration avec des systèmes GPS
- [ ] Alertes en temps réel pour les conflits potentiels
- [ ] Système de réputation pour les opérateurs
- [ ] Support multi-chaînes
- [ ] Oracles pour vérification automatique des collisions
- [ ] Marketplace de slots entre opérateurs
- [ ] Tarification dynamique basée sur la demande par zone
