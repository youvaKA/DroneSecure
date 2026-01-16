# 🛸 DroneSecure : Système de Gestion Décentralisée de l'Espace Aérien

## 📋 1. Présentation du Projet

**DroneSecure** est une DApp (Application Décentralisée) visant à réguler le trafic des drones de livraison en milieu urbain. Dans un contexte où le ciel devient encombré, notre solution utilise la blockchain pour garantir la sécurité, la priorité des vols et l'immuabilité des données de mission.

### Justification Web3

- **Transparence :** Les autorisations de vol sont vérifiables par tous (mairies, régulateurs, citoyens).
- **Sécurité :** Aucune autorité centrale ne peut modifier l'historique d'un vol après un incident.
- **Automatisation :** Les règles de priorité (urgences médicales) sont gérées par Smart Contract sans intervention humaine.

---

## 🏗️ 2. Architecture Technique & Stack

- **Smart Contract :** Solidity (Standard ERC-721 pour l'unicité des missions).
- **Framework :** Hardhat (Compilation, déploiement et tests unitaires).
- **Stockage Décentralisé :** IPFS via Pinata (Hébergement des plans de vol et métadonnées).
- **Langages :** Solidity (Backend), JavaScript/React (Frontend), Ethers.js (Interface Web3).

---

## ⚙️ 3. Implémentation des Contraintes Métiers

| Contrainte | Solution Technique | Logique Implémentée |
| :--- | :--- | :--- |
| **Tokenisation** | Niveaux de ressources | 3 niveaux : Standard (1), Express (2), Urgence Médicale (3). |
| **Limite de Possession** | Compteur d'actifs | `require(userMissionCount[msg.sender] < 4)` : Maximum 4 missions actives. |
| **Cooldown (5 min)** | Horodatage d'action | Empêche de créer deux missions consécutives en moins de 5 minutes. |
| **Lock (10 min)** | Verrou de transfert | Le token est bloqué 10 min après création (phase de décollage critique). |
| **Échanges** | Swap de ressources | Possibilité d'échanger 3 tokens Niveau 1 contre 1 token Niveau 3. |
| **IPFS** | Métadonnées JSON | Stockage du CID IPFS dans le contrat pour garantir l'intégrité du plan de vol. |

---

## 📑 4. Structure des Métadonnées (Format JSON IPFS)

Chaque mission est liée à un fichier JSON structuré comme suit :

```json
{
    "name": "Mission_Alpha_2026",
    "type": "Urgence Médicale",
    "value": "Niveau 3",
    "hash": "QmP...plans_de_vol_pdf",
    "previousOwners": ["0xAddress1", "0xAddress2"],
    "createdAt": "1737052800",
    "lastTransferAt": "1737053500",
    "attributes": { "weight": "2kg", "range": "15km" }
}
```

Un exemple complet est disponible dans `examples/mission-metadata.json`.

---

## 🚀 5. Installation et Utilisation

### Prérequis

- Node.js >= 16.x
- npm ou yarn
- MetaMask (pour le frontend)

### Installation

```bash
# Cloner le repository
git clone https://github.com/youvaKA/DroneSecure.git
cd DroneSecure

# Installer les dépendances
npm install
```

### Compilation du Smart Contract

```bash
npm run compile
```

### Tests

```bash
npm test
```

### Déploiement Local

```bash
# Démarrer un nœud Hardhat local
npm run node

# Dans un autre terminal, déployer le contrat
npm run deploy:local
```

### Lancer le Frontend

```bash
# Installer les dépendances du frontend
cd frontend
npm install

# Configurer l'adresse du contrat dans src/App.jsx
# CONTRACT_ADDRESS = 'ADRESSE_DU_CONTRAT_DEPLOYE'

# Démarrer le serveur de développement
npm run dev
```

Le frontend sera disponible sur http://localhost:3000

Pour plus de détails sur le frontend, consultez [frontend/README.md](frontend/README.md)

---

## 📜 6. Fonctionnalités du Smart Contract

### 6.1. Création de Mission

```solidity
function createMission(ResourceLevel level, string memory ipfsCID) public returns (uint256)
```

Crée une nouvelle mission de drone avec un niveau de ressource spécifique et un CID IPFS contenant les métadonnées.

**Paramètres :**
- `level` : Niveau de ressource (Standard=1, Express=2, MedicalUrgency=3)
- `ipfsCID` : Hash IPFS des métadonnées de la mission

**Contraintes :**
- Maximum 4 missions actives par utilisateur
- Cooldown de 5 minutes entre deux créations
- IPFS CID non vide

### 6.2. Échange de Ressources

```solidity
function swapResources(uint256[] memory tokenIds, string memory ipfsCID) public returns (uint256)
```

Échange 3 tokens de niveau Standard contre 1 token de niveau Medical Urgency.

**Paramètres :**
- `tokenIds` : Tableau de 3 tokenIds de niveau Standard
- `ipfsCID` : Hash IPFS pour la nouvelle mission

### 6.3. Transfert de Mission

```solidity
function transferFrom(address from, address to, uint256 tokenId) public
```

Transfère une mission d'un utilisateur à un autre (respecte le lock de 10 minutes).

### 6.4. Fonctions de Consultation

```solidity
function getMission(uint256 tokenId) public view returns (Mission memory)
function getUserMissionCount(address user) public view returns (uint256)
function canCreateMission(address user) public view returns (bool)
function cooldownRemaining(address user) public view returns (uint256)
function isTransferable(uint256 tokenId) public view returns (bool)
function getPreviousOwners(uint256 tokenId) public view returns (address[] memory)
function getLastTransferAt(uint256 tokenId) public view returns (uint256)
```

**Nouvelles fonctions de traçabilité :**
- `getPreviousOwners` : Retourne la liste complète des anciens propriétaires d'une mission
- `getLastTransferAt` : Retourne le timestamp du dernier transfert de la mission

---

## 🧪 7. Tests Unitaires

Le projet inclut une suite de tests complète couvrant :

- ✅ Création de missions avec différents niveaux de ressources
- ✅ Limite de 4 missions actives par utilisateur
- ✅ Cooldown de 5 minutes entre créations
- ✅ Lock de 10 minutes pour les transferts
- ✅ Échange de ressources (3 Standard → 1 Medical Urgency)
- ✅ Intégration IPFS pour les métadonnées
- ✅ Suivi des anciens propriétaires (previousOwners)
- ✅ Suivi des timestamps de transfert (lastTransferAt)
- ✅ Gestion des cas limites et erreurs

Exécutez les tests avec :

```bash
npm test
```

---

## 📊 8. Structure du Projet

```
DroneSecure/
├── contracts/
│   └── DroneSecure.sol           # Smart Contract principal
├── scripts/
│   └── deploy.js                 # Script de déploiement
├── test/
│   └── DroneSecure.test.js       # Tests unitaires
├── examples/
│   └── mission-metadata.json     # Exemple de métadonnées IPFS
├── hardhat.config.js             # Configuration Hardhat
├── package.json
└── README.md
```

---

## 🔐 9. Sécurité

Le contrat implémente plusieurs mécanismes de sécurité :

- **ERC-721 Standard** : Utilisation des contrats OpenZeppelin audités
- **Access Control** : Restrictions sur les transferts et modifications
- **Time Locks** : Prévention des manipulations rapides
- **Validation des Entrées** : Vérifications strictes sur tous les paramètres

---

## 🛣️ 10. Roadmap

- [x] Implémentation du Smart Contract ERC-721
- [x] Système de niveaux de ressources (3 niveaux)
- [x] Contraintes métiers (limite, cooldown, lock)
- [x] Mécanisme d'échange de ressources
- [x] Intégration IPFS
- [x] Suite de tests complète
- [x] Interface frontend React avec Vite
- [x] Intégration ethers.js pour Web3
- [x] Correction du bug d'overflow dans swapResources
- [ ] Intégration Pinata pour upload IPFS
- [ ] Déploiement sur testnet (Sepolia)
- [ ] Tableau de bord de monitoring

---

## 📄 11. Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👥 12. Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

## 📧 13. Contact

Pour toute question ou suggestion, veuillez ouvrir une issue sur GitHub.
