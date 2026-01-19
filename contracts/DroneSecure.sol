// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DroneSecure
 * @dev Smart Contract pour la gestion décentralisée de l'espace aérien des drones
 * Implémente ERC-721 avec des contraintes métiers spécifiques
 */
contract DroneSecure is ERC721, ERC721URIStorage, Ownable {
    
    // Niveaux de ressources pour les missions
    enum ResourceLevel { 
        None,           // 0 - Pas de niveau
        Standard,       // 1 - Mission standard
        Express,        // 2 - Livraison express
        MedicalUrgency  // 3 - Urgence médicale (priorité maximale)
    }
    
    // Structure représentant une mission de drone
    struct Mission {
        uint256 tokenId;
        ResourceLevel level;
        string ipfsCID;           // Hash IPFS des métadonnées
        uint256 createdAt;        // Timestamp de création
        uint256 lastTransferAt;   // Timestamp du dernier transfert
        uint256 lockedUntil;      // Timestamp jusqu'auquel le transfert est bloqué (10 min)
        address creator;          // Créateur de la mission
        address[] previousOwners; // Liste des anciens propriétaires
    }
    
    // Mappings pour gérer les contraintes
    mapping(uint256 => Mission) public missions;                    // tokenId => Mission
    mapping(address => uint256) public userMissionCount;            // Nombre de missions actives par utilisateur
    mapping(address => uint256) public lastMissionCreation;         // Dernier timestamp de création pour cooldown
    
    // Compteur pour les tokenIds
    uint256 private _nextTokenId;
    
    // Constantes pour les contraintes métiers
    uint256 public constant MAX_MISSIONS_PER_USER = 4;              // Maximum 4 missions actives
    uint256 public constant COOLDOWN_PERIOD = 5 minutes;            // 5 minutes entre deux créations
    uint256 public constant LOCK_PERIOD = 10 minutes;               // 10 minutes de verrouillage après création
    uint256 public constant SWAP_RATIO = 3;                         // 3 tokens niveau 1 pour 1 token niveau 3
    
    // Events
    event MissionCreated(uint256 indexed tokenId, address indexed owner, ResourceLevel level, string ipfsCID);
    event MissionTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event ResourceSwapped(address indexed user, uint256[] burnedTokenIds, uint256 newTokenId);
    
    constructor() ERC721("DroneSecure Mission", "DSM") Ownable(msg.sender) {}
    
    /**
     * @dev Crée une nouvelle mission de drone
     * @param level Niveau de ressource de la mission
     * @param ipfsCID Hash IPFS contenant les métadonnées de la mission
     */
    function createMission(ResourceLevel level, string memory ipfsCID) public returns (uint256) {
        // Vérification du niveau de ressource
        require(level != ResourceLevel.None, "Invalid resource level");
        
        // Vérification de la limite de missions par utilisateur
        require(userMissionCount[msg.sender] < MAX_MISSIONS_PER_USER, "Maximum missions limit reached");
        
        // Vérification du cooldown (5 minutes entre deux créations)
        require(
            block.timestamp >= lastMissionCreation[msg.sender] + COOLDOWN_PERIOD,
            "Cooldown period not elapsed"
        );
        
        // Vérification que l'IPFS CID n'est pas vide
        require(bytes(ipfsCID).length > 0, "IPFS CID cannot be empty");
        
        uint256 tokenId = _nextTokenId++;
        
        // Mint du token NFT
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, ipfsCID);
        
        // Création de la mission avec lock de 10 minutes
        address[] memory emptyOwners = new address[](0);
        missions[tokenId] = Mission({
            tokenId: tokenId,
            level: level,
            ipfsCID: ipfsCID,
            createdAt: block.timestamp,
            lastTransferAt: block.timestamp,
            lockedUntil: block.timestamp + LOCK_PERIOD,
            creator: msg.sender,
            previousOwners: emptyOwners
        });
        
        // Mise à jour des compteurs
        userMissionCount[msg.sender]++;
        lastMissionCreation[msg.sender] = block.timestamp;
        
        emit MissionCreated(tokenId, msg.sender, level, ipfsCID);
        
        return tokenId;
    }
    
    /**
     * @dev Échange 3 tokens de niveau Standard contre 1 token de niveau Medical Urgency
     * @param tokenIds Tableau de 3 tokenIds de niveau Standard à échanger
     * @param ipfsCID Hash IPFS pour la nouvelle mission
     */
    function swapResources(uint256[] memory tokenIds, string memory ipfsCID) public returns (uint256) {
        // Vérification du nombre de tokens
        require(tokenIds.length == SWAP_RATIO, "Must provide exactly 3 tokens");
        
        // Vérification que l'utilisateur possède les 3 tokens et qu'ils sont de niveau Standard
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not owner of token");
            require(missions[tokenIds[i]].level == ResourceLevel.Standard, "Token must be Standard level");
        }
        
        // Burn des 3 tokens Standard
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _burn(tokenIds[i]);
            delete missions[tokenIds[i]];
            // Note: userMissionCount is automatically decremented in _update() when burning
        }
        
        // Création d'un nouveau token de niveau Medical Urgency
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, ipfsCID);
        
        address[] memory emptyOwners = new address[](0);
        missions[tokenId] = Mission({
            tokenId: tokenId,
            level: ResourceLevel.MedicalUrgency,
            ipfsCID: ipfsCID,
            createdAt: block.timestamp,
            lastTransferAt: block.timestamp,
            lockedUntil: block.timestamp + LOCK_PERIOD,
            creator: msg.sender,
            previousOwners: emptyOwners
        });
        
        userMissionCount[msg.sender]++;
        
        emit ResourceSwapped(msg.sender, tokenIds, tokenId);
        
        return tokenId;
    }
    
    /**
     * @dev Vérifie si un token peut être transféré (respecte le lock de 10 minutes)
     */
    function isTransferable(uint256 tokenId) public view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return block.timestamp >= missions[tokenId].lockedUntil;
    }
    
    /**
     * @dev Override de la fonction de transfert pour appliquer le lock de 10 minutes
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Si c'est un transfert (pas un mint ou burn)
        if (from != address(0) && to != address(0)) {
            // Vérification du lock de 10 minutes
            require(
                block.timestamp >= missions[tokenId].lockedUntil,
                "Token is locked for 10 minutes after creation"
            );
            
            // Mise à jour des compteurs
            if (from != to) {
                userMissionCount[from]--;
                userMissionCount[to]++;
                
                // Vérification que le destinataire ne dépasse pas la limite
                require(userMissionCount[to] <= MAX_MISSIONS_PER_USER, "Recipient mission limit reached");
                
                // Ajout du propriétaire actuel à la liste des anciens propriétaires
                missions[tokenId].previousOwners.push(from);
                
                // Mise à jour du timestamp du dernier transfert
                missions[tokenId].lastTransferAt = block.timestamp;
            }
        }
        
        // Si c'est un burn
        if (to == address(0) && from != address(0)) {
            userMissionCount[from]--;
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Retourne les informations d'une mission
     */
    function getMission(uint256 tokenId) public view returns (Mission memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return missions[tokenId];
    }
    
    /**
     * @dev Retourne le nombre de missions actives d'un utilisateur
     */
    function getUserMissionCount(address user) public view returns (uint256) {
        return userMissionCount[user];
    }
    
    /**
     * @dev Vérifie si un utilisateur peut créer une nouvelle mission (cooldown respecté)
     */
    function canCreateMission(address user) public view returns (bool) {
        return block.timestamp >= lastMissionCreation[user] + COOLDOWN_PERIOD &&
               userMissionCount[user] < MAX_MISSIONS_PER_USER;
    }
    
    /**
     * @dev Retourne le temps restant avant de pouvoir créer une nouvelle mission
     */
    function cooldownRemaining(address user) public view returns (uint256) {
        uint256 nextAllowedTime = lastMissionCreation[user] + COOLDOWN_PERIOD;
        if (block.timestamp >= nextAllowedTime) {
            return 0;
        }
        return nextAllowedTime - block.timestamp;
    }
    
    /**
     * @dev Retourne la liste des anciens propriétaires d'une mission
     */
    function getPreviousOwners(uint256 tokenId) public view returns (address[] memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return missions[tokenId].previousOwners;
    }
    
    /**
     * @dev Retourne le timestamp du dernier transfert d'une mission
     */
    function getLastTransferAt(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return missions[tokenId].lastTransferAt;
    }
    
    // Override requis par Solidity
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
