# 🎯 DroneSecure - Définition du Cas d'Usage

## Document de Présentation du Projet

**Projet Web3 - Développement d'une DApp basée sur la Blockchain**

---

## 1. Introduction

### 1.1. Contexte Général

L'essor rapide des drones commerciaux pour la livraison urbaine pose des défis majeurs en termes de :
- **Gestion du trafic aérien** : Coordination de centaines de drones simultanés
- **Sécurité publique** : Prévention des collisions et accidents
- **Priorisation** : Urgences médicales vs livraisons commerciales
- **Traçabilité** : Responsabilité en cas d'incident
- **Transparence** : Vérification des autorisations par les citoyens et régulateurs

### 1.2. Problématique

Les systèmes centralisés traditionnels présentent des limitations :
- ❌ Point de défaillance unique (serveur central)
- ❌ Risque de manipulation des données
- ❌ Manque de transparence pour le public
- ❌ Dépendance à une autorité unique
- ❌ Coûts d'infrastructure élevés

### 1.3. Solution Proposée

**DroneSecure** : Une application décentralisée (DApp) utilisant la blockchain Ethereum pour gérer de manière transparente, sécurisée et automatisée les autorisations de vol des drones en milieu urbain.

---

## 2. Justification de l'Utilisation de la Blockchain

### 2.1. Pourquoi le Web3 ?

| Besoin | Solution Blockchain | Bénéfice |
|--------|-------------------|----------|
| **Transparence** | Toutes les missions enregistrées publiquement | Vérification par citoyens et autorités |
| **Immuabilité** | Historique non modifiable | Boîte noire pour enquêtes |
| **Décentralisation** | Pas d'autorité unique | Résistance à la censure |
| **Automatisation** | Smart Contracts | Règles appliquées sans intervention humaine |
| **Traçabilité** | Ownership tracking on-chain | Responsabilité claire |
| **Intégrité** | IPFS + Hash cryptographique | Plans de vol non falsifiables |

### 2.2. Comparaison Centralisé vs Décentralisé

#### Système Centralisé (Traditionnel)
```
[Drone] → [Serveur Central] ← [Régulateur]
                ↓
        [Base de Données]
        
✗ Point de défaillance unique
✗ Autorité peut manipuler les données
✗ Pas de transparence publique
✗ Coûts serveur élevés
```

#### Système Décentralisé (DroneSecure)
```
[Drone] ↘
         → [Smart Contract] ← [IPFS]
[Drone] ↗        ↓
            [Blockchain]
               ↓
    [Tous peuvent vérifier]

✓ Résilient
✓ Immuable
✓ Transparent
✓ Coûts partagés
```

---

## 3. Description du Cas d'Usage

### 3.1. Scénario d'Utilisation Typique

#### Acteur : Entreprise de Livraison Express

**Étape 1 : Création de Mission**
```
Entreprise FastDrone veut livrer un colis urgent
↓
Appelle createMission(Express, ipfsCID)
↓
Smart Contract vérifie :
  - L'entreprise a moins de 4 missions actives ✓
  - Cooldown de 5 minutes respecté ✓
  - IPFS CID valide ✓
↓
NFT Mission créé, verrouillé pour 10 minutes
```

**Étape 2 : Vol de la Mission**
```
Drone décolle (phase critique de 10 minutes)
↓
Mission ne peut pas être transférée pendant cette période
↓
Après 10 minutes, mission peut être réassignée si besoin
```

**Étape 3 : Transfert (Optionnel)**
```
FastDrone transfère mission à un sous-traitant
↓
Smart Contract :
  - Vérifie que 10 minutes écoulées ✓
  - Vérifie que destinataire < 4 missions ✓
  - Ajoute FastDrone aux previousOwners
  - Met à jour lastTransferAt
↓
Sous-traitant devient propriétaire
```

#### Acteur : Service d'Urgence Médicale

**Scénario Critique**
```
Hôpital a besoin d'urgence de sang type O-
↓
Crée 3 missions Standard avec cooldowns
↓
Appelle swapResources([id1, id2, id3], ipfsCID)
↓
Les 3 missions Standard sont brûlées
↓
Une mission MedicalUrgency est créée (priorité maximale)
↓
Peut préempter d'autres missions en vol (logique externe)
```

### 3.2. Acteurs du Système

#### 1. Opérateurs de Drones Commerciaux
**Profil** : Amazon, DHL, UPS, startups de livraison
**Besoins** :
- Créer des missions Standard/Express
- Transférer missions entre pilotes
- Consulter l'historique
**Contraintes** :
- Maximum 4 missions simultanées
- Cooldown de 5 minutes entre créations

#### 2. Services d'Urgence
**Profil** : SAMU, pompiers, hôpitaux
**Besoins** :
- Missions MedicalUrgency prioritaires
- Upgrade via swap (3 Standard → 1 Medical)
**Privilèges** :
- Priorité dans l'espace aérien (logique hors contrat)

#### 3. Régulateurs Aériens
**Profil** : DGAC (France), FAA (USA), autorités locales
**Besoins** :
- Consulter toutes les missions
- Vérifier conformité
- Enquêter sur incidents
**Actions** :
- Lecture seule du contrat
- Accès aux métadonnées IPFS

#### 4. Citoyens
**Profil** : Résidents urbains
**Besoins** :
- Vérifier autorisations de vol
- Rapporter violations
**Actions** :
- Consultation publique des missions
- Vérification des CIDs IPFS

---

## 4. Architecture du Système

### 4.1. Composants Principaux

```
┌─────────────────────────────────────────────────────┐
│                   Utilisateurs                       │
│  Opérateurs | Services Urgence | Régulateurs        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│              Interface Frontend (React)              │
│          Web3 Wallet (MetaMask, WalletConnect)       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│           Smart Contract DroneSecure.sol             │
│  ┌───────────────────────────────────────────┐      │
│  │ • createMission()                         │      │
│  │ • swapResources()                         │      │
│  │ • transferFrom()                          │      │
│  │ • getMission()                            │      │
│  │ • getPreviousOwners()                     │      │
│  └───────────────────────────────────────────┘      │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ↓                           ↓
┌─────────────────┐         ┌─────────────────┐
│   Blockchain    │         │      IPFS       │
│    Ethereum     │         │   (Métadonnées) │
│                 │         │                 │
│ • Ownership     │         │ • Plans de vol  │
│ • Timestamps    │         │ • Documents     │
│ • History       │         │ • Images        │
└─────────────────┘         └─────────────────┘
```

### 4.2. Flux de Données

#### Création de Mission
```
1. Utilisateur remplit formulaire (frontend)
2. Upload métadonnées sur IPFS → Récupère CID
3. Appel createMission(level, CID) via Web3
4. Transaction envoyée à Ethereum
5. Smart Contract valide et mint NFT
6. Event MissionCreated émis
7. Frontend met à jour UI
```

#### Consultation de Mission
```
1. Utilisateur demande info mission #42
2. Appel getMission(42) (lecture seule, pas de gas)
3. Smart Contract retourne struct Mission
4. Frontend fetch métadonnées depuis IPFS via CID
5. Affichage complet (on-chain + off-chain)
```

---

## 5. Implémentation des Contraintes Métiers

### 5.1. Tokenisation des Ressources

#### Système de Niveaux

| Niveau | Nom | Priorité | Use Case | Coût Création |
|--------|-----|----------|----------|---------------|
| 1 | Standard | Basse | Livraison standard | 1 mission |
| 2 | Express | Moyenne | Livraison express | 1 mission |
| 3 | MedicalUrgency | Haute | Urgence médicale | 3 missions Standard |

**Caractéristiques** :
- Chaque mission est un NFT ERC-721 unique
- Niveau défini à la création, immuable
- Possibilité d'upgrade via swap (3→1)

### 5.2. Échanges de Tokens

#### Mécanisme de Swap

```solidity
swapResources([tokenId1, tokenId2, tokenId3], newIpfsCID)
```

**Règles** :
- ✅ Exactement 3 tokens Standard requis
- ✅ Utilisateur doit être propriétaire des 3
- ✅ Les 3 sont brûlés (burned)
- ✅ 1 nouveau token MedicalUrgency créé
- ✅ Nouveau token a un lock de 10 minutes

**Cas d'Usage** :
```
Scénario : Hôpital reçoit appel pour transplantation urgente

Avant Swap :
┌─────────────────────────────────────┐
│ Mission #1: Standard (livraison)    │
│ Mission #2: Standard (livraison)    │
│ Mission #3: Standard (livraison)    │
└─────────────────────────────────────┘

Après Swap :
┌─────────────────────────────────────┐
│ Mission #4: MedicalUrgency (organe) │
│   Priorité maximale garantie        │
└─────────────────────────────────────┘
```

### 5.3. Limites de Possession

**Règle** : Maximum 4 missions actives par adresse

**Justification** :
- Empêche monopolisation de l'espace aérien
- Force rotation des autorisations
- Équité entre opérateurs

**Implémentation** :
```solidity
require(userMissionCount[msg.sender] < 4, "Maximum missions limit reached");
```

**Contournement** : Impossible sans créer de nouvelles adresses (coût en gas)

### 5.4. Contraintes Temporelles

#### Cooldown de 5 Minutes

**Objectif** : Éviter le spam de créations

**Fonctionnement** :
```
Mission créée à T
↓
Tentative création à T+2 min → ❌ REVERT
↓
Tentative création à T+5 min → ✅ SUCCESS
```

**Consultation** :
```javascript
const remaining = await contract.cooldownRemaining(userAddress);
console.log(`Patientez encore ${remaining} secondes`);
```

#### Lock de 10 Minutes

**Objectif** : Phase de décollage critique sans changement de propriétaire

**Fonctionnement** :
```
Mission #5 créée à 14:00
↓
lockedUntil = 14:10
↓
Tentative transfert à 14:05 → ❌ "Token is locked"
↓
Tentative transfert à 14:10 → ✅ SUCCESS
```

**Consultation** :
```javascript
const transferable = await contract.isTransferable(tokenId);
```

### 5.5. Utilisation d'IPFS

#### Pourquoi IPFS ?

| Critère | IPFS | Stockage On-Chain | Serveur Central |
|---------|------|-------------------|-----------------|
| Coût | Bas | Très élevé (>$1000/MB) | Moyen |
| Décentralisation | ✅ | ✅ | ❌ |
| Immuabilité | ✅ (via hash) | ✅ | ❌ |
| Scalabilité | ✅ | ❌ | ✅ |
| Censure-resistant | ✅ | ✅ | ❌ |

#### Structure des Métadonnées

```json
{
    "name": "Mission_Alpha_2026",
    "type": "Urgence Médicale",
    "value": "Niveau 3",
    "hash": "QmP...plans_de_vol_pdf",
    "previousOwners": ["0xAddr1", "0xAddr2"],
    "createdAt": "1737052800",
    "lastTransferAt": "1737053500",
    "attributes": {
        "weight": "2kg",
        "range": "15km",
        "departureCity": "Paris",
        "destinationCity": "Lyon",
        "cargo": "Medical supplies"
    },
    "flightPlan": {
        "waypoints": [...],
        "altitude": "120m",
        "speed": "25m/s"
    }
}
```

**Champs Obligatoires** (selon cahier des charges) :
- ✅ `name` : Nom de la mission
- ✅ `type` : Type de ressource
- ✅ `value` : Valeur/niveau
- ✅ `hash` : Hash IPFS du document lié
- ✅ `previousOwners` : Liste des anciens propriétaires
- ✅ `createdAt` : Timestamp de création
- ✅ `lastTransferAt` : Timestamp du dernier transfert

---

## 6. Avantages et Innovation

### 6.1. Pour les Opérateurs

✅ **Transparence** : Voir toutes les missions en temps réel
✅ **Équité** : Même règles pour tous (pas de favoritisme)
✅ **Flexibilité** : Transfert de missions entre pilotes
✅ **Upgrade** : Possibilité de créer missions urgentes via swap

### 6.2. Pour les Autorités

✅ **Auditabilité** : Historique complet immuable
✅ **Conformité** : Règles appliquées automatiquement
✅ **Enquêtes** : previousOwners pour tracer responsabilités
✅ **Monitoring** : Statistiques en temps réel

### 6.3. Pour les Citoyens

✅ **Vérification** : Peuvent checker si un drone a autorisation
✅ **Sécurité** : Limite de 4 missions empêche encombrement
✅ **Priorités** : Urgences médicales clairement identifiées

### 6.4. Innovation Technique

🔹 **Premier système décentralisé de gestion d'espace aérien**
🔹 **Tokenisation de missions avec niveaux de priorité**
🔹 **Mécanisme de swap pour urgences (3→1)**
🔹 **Tracking complet on-chain des transferts de propriété**
🔹 **Hybrid storage (blockchain + IPFS) optimisé pour coûts**

---

## 7. Cas d'Usage Étendus

### 7.1. Livraison de Médicaments

**Contexte** : Pharmacie livre traitements chroniques

**Workflow** :
1. Pharmacie crée mission Standard
2. Drone livre dans rayon de 10km
3. Après livraison, mission transférée à service de maintenance
4. Historique complet préservé pour traçabilité sanitaire

### 7.2. Urgence Médicale

**Contexte** : Accident de voiture, besoin de défibrillateur

**Workflow** :
1. SAMU possède 3 missions Standard pré-créées
2. Appel swap pour créer MedicalUrgency
3. Drone décolle immédiatement (priorité max)
4. Autres drones doivent céder passage (logique externe)
5. Mission archivée après intervention

### 7.3. Livraison Commerciale

**Contexte** : E-commerce livre colis

**Workflow** :
1. Amazon crée mission Express
2. Colis livré en 30 minutes
3. Après 10 minutes de vol, mission peut être réaffectée si problème technique
4. Traçabilité complète pour réclamations client

### 7.4. Surveillance et Inspection

**Contexte** : Inspection d'infrastructure (pont, antenne)

**Workflow** :
1. Entreprise inspection crée mission Standard
2. Drone filme pendant 2 heures
3. Vidéo uploadée sur IPFS, CID ajouté aux métadonnées
4. Rapport d'inspection vérifiable par autorités

---

## 8. Comparaison avec Alternatives

### 8.1. vs Système Centralisé Traditionnel

| Critère | DroneSecure (Blockchain) | Système Central |
|---------|-------------------------|-----------------|
| Transparence | ✅ Publique | ❌ Opaque |
| Résilience | ✅ Décentralisé | ❌ Single point of failure |
| Immuabilité | ✅ Garantie | ❌ Admin peut modifier |
| Coûts infrastructure | ✅ Partagés | ❌ Élevés |
| Latence | ⚠️ 12-15 sec (Ethereum) | ✅ < 1 sec |

### 8.2. vs Solutions Concurrentes Blockchain

| Projet | Blockchain | Focus | Différence avec DroneSecure |
|--------|-----------|-------|----------------------------|
| DronePort | Ethereum | Parking aérien | Pas de priorités médicales |
| AirToken | Polygon | Tokenisation vols | Pas de contraintes temporelles |
| SkyChain | BSC | Livraisons | Pas de tracking previousOwners |

**Avantage DroneSecure** : Seul à combiner tous les éléments (priorités, swaps, tracking, contraintes temporelles)

---

## 9. Roadmap et Évolution

### 9.1. Phase Actuelle (v1.0) ✅

- [x] Smart Contract ERC-721 complet
- [x] Système de niveaux (3 tiers)
- [x] Contraintes métiers (limites, cooldowns, locks)
- [x] Intégration IPFS
- [x] Tests unitaires exhaustifs (70+)
- [x] Documentation complète

### 9.2. Phase 2 (Q2 2026)

- [ ] Interface frontend React
- [ ] Intégration Pinata pour IPFS auto-upload
- [ ] Déploiement testnet Sepolia
- [ ] Dashboard analytics
- [ ] Mobile app (React Native)

### 9.3. Phase 3 (Q3 2026)

- [ ] Oracles Chainlink (vérification GPS)
- [ ] Subgraph pour indexation
- [ ] Notifications push
- [ ] Multi-chain (Polygon, Arbitrum)
- [ ] API REST pour intégrations

### 9.4. Phase 4 (Q4 2026)

- [ ] DAO pour gouvernance
- [ ] NFT staking avec rewards
- [ ] Système de réputation
- [ ] Insurance pool
- [ ] Géofencing on-chain

---

## 10. Conclusion

### 10.1. Résumé

**DroneSecure** propose une solution innovante et nécessaire pour la gestion décentralisée du trafic aérien des drones urbains. En combinant :

✨ **Blockchain Ethereum** pour l'immuabilité et la transparence
✨ **NFTs ERC-721** pour la tokenisation unique des missions
✨ **IPFS** pour le stockage économique des métadonnées
✨ **Smart Contracts** pour l'application automatique des règles

Le projet répond à un **besoin réel et croissant** tout en démontrant une **maîtrise complète des technologies Web3**.

### 10.2. Pertinence

Ce projet est pertinent car :

1. **Cas d'usage émergent** : Les drones urbains vont exploser dans les 5 prochaines années
2. **Problème réel** : Coordination et sécurité de l'espace aérien
3. **Blockchain justifiée** : Transparence et décentralisation essentielles pour la confiance publique
4. **Scalable** : Peut gérer des milliers de missions (via L2)
5. **Extensible** : Roadmap claire vers fonctionnalités avancées

### 10.3. Originalité

**Points distinctifs** :

🔸 **Premier système de gestion d'espace aérien décentralisé complet**
🔸 **Mécanisme de swap innovant (3→1) pour urgences**
🔸 **Tracking exhaustif (previousOwners + timestamps)**
🔸 **Contraintes temporelles intégrées (cooldown + lock)**
🔸 **Hybrid storage optimisé (on-chain + IPFS)**

---

## 11. Contact et Ressources

### 11.1. Repository GitHub

🔗 https://github.com/youvaKA/DroneSecure

### 11.2. Documentation

- **README.md** : Guide d'installation et utilisation
- **RAPPORT_TECHNIQUE.md** : Analyse technique approfondie
- **QUICK_REFERENCE.md** : Référence API développeur

### 11.3. Démo

**Testnet Deployment** : (À venir sur Sepolia)
**Frontend Demo** : (En développement)

---

**Équipe de Développement**
**Date** : Janvier 2026
**Version** : 1.0
**Licence** : MIT

---

*DroneSecure - Le futur de la gestion d'espace aérien est décentralisé* ✈️🔗
