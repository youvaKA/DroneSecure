// DroneSecure - Web3 Application
// Main JavaScript file for interacting with the DroneSecure smart contract

// Contract ABI (Application Binary Interface)
const CONTRACT_ABI = [
    "function createMission(uint8 level, string memory ipfsCID) public returns (uint256)",
    "function swapResources(uint256[] memory tokenIds, string memory ipfsCID) public returns (uint256)",
    "function transferFrom(address from, address to, uint256 tokenId) public",
    "function getMission(uint256 tokenId) public view returns (tuple(uint256 tokenId, uint8 level, string ipfsCID, uint256 createdAt, uint256 lastTransferAt, uint256 lockedUntil, address creator, address[] previousOwners))",
    "function getUserMissionCount(address user) public view returns (uint256)",
    "function canCreateMission(address user) public view returns (bool)",
    "function cooldownRemaining(address user) public view returns (uint256)",
    "function isTransferable(uint256 tokenId) public view returns (bool)",
    "function getPreviousOwners(uint256 tokenId) public view returns (address[])",
    "function getLastTransferAt(uint256 tokenId) public view returns (uint256)",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function balanceOf(address owner) public view returns (uint256)",
    "event MissionCreated(uint256 indexed tokenId, address indexed owner, uint8 level, string ipfsCID)",
    "event MissionTransferred(uint256 indexed tokenId, address indexed from, address indexed to)",
    "event ResourceSwapped(address indexed user, uint256[] burnedTokenIds, uint256 newTokenId)"
];

// Global variables
let provider;
let signer;
let contract;
let userAddress;
let userMissions = [];
let ipfsUploader;

// Contract address - Will be set after deployment
// For local testing, deploy the contract and update this address
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

// Level names mapping
const LEVEL_NAMES = {
    1: "Standard",
    2: "Express",
    3: "Urgence Médicale"
};

// Initialize the application
async function init() {
    // Initialize IPFS uploader
    if (typeof IPFSUploader !== 'undefined') {
        ipfsUploader = new IPFSUploader();
    }
    
    // Setup tab navigation
    setupTabs();
    
    // Setup form handlers
    setupForms();
    
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
        // Listen for network changes
        window.ethereum.on('chainChanged', () => window.location.reload());
    } else {
        showAlert('MetaMask n\'est pas installé. Veuillez installer MetaMask pour utiliser cette application.', 'error');
    }
}

// Connect wallet
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            showAlert('MetaMask n\'est pas installé!', 'error');
            return;
        }

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Setup provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = accounts[0];
        
        // Get network info
        const network = await provider.getNetwork();
        
        // Initialize contract
        if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "YOUR_CONTRACT_ADDRESS_HERE") {
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            // Update UI
            updateWalletUI();
            showAppContent();
            await loadDashboard();
            
            showAlert('Wallet connecté avec succès!', 'success');
        } else {
            showAlert('Veuillez déployer le contrat et mettre à jour CONTRACT_ADDRESS dans app.js', 'warning');
            updateWalletUI();
            showAppContent();
            document.getElementById('contractAddress').textContent = 'Non configuré';
            document.getElementById('networkName').textContent = network.name;
        }
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showAlert('Erreur lors de la connexion: ' + error.message, 'error');
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected wallet
        showConnectMessage();
        showAlert('Wallet déconnecté', 'info');
    } else {
        // User switched accounts
        window.location.reload();
    }
}

// Update wallet UI
function updateWalletUI() {
    const walletAddressEl = document.getElementById('walletAddress');
    const walletInfoEl = document.getElementById('walletInfo');
    const connectBtn = document.getElementById('connectWallet');
    
    if (userAddress) {
        walletAddressEl.textContent = formatAddress(userAddress);
        walletInfoEl.classList.remove('hidden');
        connectBtn.style.display = 'none';
    }
}

// Show app content
function showAppContent() {
    document.getElementById('connectMessage').classList.add('hidden');
    document.getElementById('appContent').classList.remove('hidden');
}

// Show connect message
function showConnectMessage() {
    document.getElementById('connectMessage').classList.remove('hidden');
    document.getElementById('appContent').classList.add('hidden');
}

// Load dashboard data
async function loadDashboard() {
    try {
        if (!contract) return;
        
        // Get user mission count
        const missionCount = await contract.getUserMissionCount(userAddress);
        document.getElementById('dashMissionCount').textContent = missionCount.toString();
        document.getElementById('userMissionCount').textContent = missionCount.toString() + ' missions';
        
        // Get cooldown info
        const cooldownRemaining = await contract.cooldownRemaining(userAddress);
        const cooldownText = cooldownRemaining.toNumber() === 0 ? 'Prêt' : formatTime(cooldownRemaining.toNumber());
        document.getElementById('dashCooldown').textContent = cooldownText;
        
        // Check if can create mission
        const canCreate = await contract.canCreateMission(userAddress);
        document.getElementById('dashCanCreate').textContent = canCreate ? 'Oui' : 'Non';
        
        // Load all missions to count urgent ones
        await loadUserMissions();
        const urgentCount = userMissions.filter(m => m.level === 3).length;
        document.getElementById('dashUrgentCount').textContent = urgentCount.toString();
        
        // Update contract info
        document.getElementById('contractAddress').textContent = formatAddress(CONTRACT_ADDRESS);
        const network = await provider.getNetwork();
        document.getElementById('networkName').textContent = network.name;
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Erreur lors du chargement du tableau de bord', 'error');
    }
}

// Load user missions
async function loadUserMissions() {
    try {
        if (!contract) return;
        
        userMissions = [];
        
        // Get user balance (number of tokens owned)
        const balance = await contract.balanceOf(userAddress);
        
        if (balance.toNumber() === 0) {
            return;
        }
        
        // For simplicity, we'll iterate through a reasonable range of token IDs
        // In production, you'd want to use events or a better indexing method
        const maxTokenId = 1000;
        for (let tokenId = 0; tokenId < maxTokenId; tokenId++) {
            try {
                const owner = await contract.ownerOf(tokenId);
                if (owner.toLowerCase() === userAddress.toLowerCase()) {
                    const mission = await contract.getMission(tokenId);
                    const isTransferable = await contract.isTransferable(tokenId);
                    
                    userMissions.push({
                        tokenId: mission.tokenId.toNumber(),
                        level: mission.level,
                        ipfsCID: mission.ipfsCID,
                        createdAt: mission.createdAt.toNumber(),
                        lastTransferAt: mission.lastTransferAt.toNumber(),
                        lockedUntil: mission.lockedUntil.toNumber(),
                        creator: mission.creator,
                        previousOwners: mission.previousOwners,
                        isTransferable: isTransferable
                    });
                }
            } catch (error) {
                // Token doesn't exist or error reading it, skip
                if (userMissions.length >= balance.toNumber()) {
                    break;
                }
            }
        }
        
    } catch (error) {
        console.error('Error loading missions:', error);
    }
}

// Display missions
function displayMissions(missions = null) {
    const missionsList = document.getElementById('missionsList');
    const missionsToDisplay = missions || userMissions;
    
    if (missionsToDisplay.length === 0) {
        missionsList.innerHTML = `
            <div class="empty-state">
                <h3>Aucune mission</h3>
                <p>Vous n'avez pas encore de missions actives.</p>
            </div>
        `;
        return;
    }
    
    missionsList.innerHTML = missionsToDisplay.map(mission => `
        <div class="mission-card">
            <span class="mission-level level-${mission.level}">${LEVEL_NAMES[mission.level]}</span>
            <h4>Mission #${mission.tokenId}</h4>
            
            <div class="mission-detail">
                <span class="mission-detail-label">IPFS CID:</span>
                <span class="mission-detail-value">${mission.ipfsCID.substring(0, 15)}...</span>
            </div>
            
            <div class="mission-detail">
                <span class="mission-detail-label">Créée le:</span>
                <span class="mission-detail-value">${formatDate(mission.createdAt)}</span>
            </div>
            
            <div class="mission-detail">
                <span class="mission-detail-label">Créateur:</span>
                <span class="mission-detail-value">${formatAddress(mission.creator)}</span>
            </div>
            
            <div class="mission-detail">
                <span class="mission-detail-label">Transferts:</span>
                <span class="mission-detail-value">${mission.previousOwners.length}</span>
            </div>
            
            <span class="transferable-badge ${mission.isTransferable ? 'transferable' : 'locked'}">
                ${mission.isTransferable ? '✓ Transférable' : '🔒 Verrouillé'}
            </span>
            
            <div class="mission-actions">
                <button class="btn btn-primary btn-sm" onclick="viewMissionDetails(${mission.tokenId})">
                    📄 Détails
                </button>
                <button class="btn btn-secondary btn-sm" onclick="openIPFS('${mission.ipfsCID}')">
                    🔗 IPFS
                </button>
            </div>
        </div>
    `).join('');
}

// View mission details
async function viewMissionDetails(tokenId) {
    try {
        const mission = userMissions.find(m => m.tokenId === tokenId);
        if (!mission) {
            showAlert('Mission non trouvée', 'error');
            return;
        }
        
        const ownersText = mission.previousOwners.length > 0 
            ? mission.previousOwners.map(addr => formatAddress(addr)).join(', ')
            : 'Aucun transfert précédent';
        
        const lockTime = mission.lockedUntil > Date.now() / 1000 
            ? formatDate(mission.lockedUntil)
            : 'Déverrouillé';
        
        const details = `
📋 Mission #${mission.tokenId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Niveau: ${LEVEL_NAMES[mission.level]}
🔗 IPFS CID: ${mission.ipfsCID}
📅 Créée le: ${formatDate(mission.createdAt)}
👤 Créateur: ${formatAddress(mission.creator)}
🔄 Dernier transfert: ${formatDate(mission.lastTransferAt)}
🔒 Verrouillé jusqu'à: ${lockTime}
📜 Anciens propriétaires: ${ownersText}
${mission.isTransferable ? '✅ Transférable maintenant' : '⏳ Transfert verrouillé'}
        `;
        
        alert(details);
        
    } catch (error) {
        console.error('Error viewing mission details:', error);
        showAlert('Erreur lors de l\'affichage des détails', 'error');
    }
}

// Open IPFS link
function openIPFS(cid) {
    window.open(`https://ipfs.io/ipfs/${cid}`, '_blank');
}

// Create mission
async function createMission(level, ipfsCID) {
    try {
        if (!contract) {
            showAlert('Contrat non initialisé', 'error');
            return;
        }
        
        showAlert('Création de la mission en cours...', 'info');
        
        const tx = await contract.createMission(level, ipfsCID);
        showAlert('Transaction envoyée. En attente de confirmation...', 'info');
        
        await tx.wait();
        showAlert('Mission créée avec succès! 🎉', 'success');
        
        // Reload data
        await loadDashboard();
        await loadUserMissions();
        displayMissions();
        
        // Clear form
        document.getElementById('createMissionForm').reset();
        
    } catch (error) {
        console.error('Error creating mission:', error);
        let errorMessage = 'Erreur lors de la création de la mission';
        
        if (error.message.includes('Cooldown')) {
            errorMessage = 'Cooldown actif. Attendez 5 minutes.';
        } else if (error.message.includes('Maximum missions')) {
            errorMessage = 'Limite atteinte: maximum 4 missions actives.';
        } else if (error.message.includes('user rejected')) {
            errorMessage = 'Transaction annulée par l\'utilisateur.';
        }
        
        showAlert(errorMessage, 'error');
    }
}

// Swap resources
async function swapResources(tokenIds, ipfsCID) {
    try {
        if (!contract) {
            showAlert('Contrat non initialisé', 'error');
            return;
        }
        
        if (tokenIds.length !== 3) {
            showAlert('Vous devez sélectionner exactement 3 missions Standard', 'error');
            return;
        }
        
        showAlert('Échange en cours...', 'info');
        
        const tx = await contract.swapResources(tokenIds, ipfsCID);
        showAlert('Transaction envoyée. En attente de confirmation...', 'info');
        
        await tx.wait();
        showAlert('Échange réussi! 3 Standard → 1 Urgence Médicale 🎉', 'success');
        
        // Reload data
        await loadDashboard();
        await loadUserMissions();
        loadStandardMissions();
        
        // Clear form
        document.getElementById('swapForm').reset();
        
    } catch (error) {
        console.error('Error swapping resources:', error);
        let errorMessage = 'Erreur lors de l\'échange';
        
        if (error.message.includes('Must provide exactly 3')) {
            errorMessage = 'Vous devez fournir exactement 3 tokens';
        } else if (error.message.includes('Not owner')) {
            errorMessage = 'Vous ne possédez pas tous ces tokens';
        } else if (error.message.includes('Standard level')) {
            errorMessage = 'Tous les tokens doivent être de niveau Standard';
        }
        
        showAlert(errorMessage, 'error');
    }
}

// Transfer mission
async function transferMission(tokenId, toAddress) {
    try {
        if (!contract) {
            showAlert('Contrat non initialisé', 'error');
            return;
        }
        
        if (!ethers.utils.isAddress(toAddress)) {
            showAlert('Adresse invalide', 'error');
            return;
        }
        
        showAlert('Transfert en cours...', 'info');
        
        const tx = await contract.transferFrom(userAddress, toAddress, tokenId);
        showAlert('Transaction envoyée. En attente de confirmation...', 'info');
        
        await tx.wait();
        showAlert('Mission transférée avec succès! 🎉', 'success');
        
        // Reload data
        await loadDashboard();
        await loadUserMissions();
        displayMissions();
        loadTransferMissions();
        
        // Clear form
        document.getElementById('transferForm').reset();
        document.getElementById('transferMissionInfo').classList.add('hidden');
        
    } catch (error) {
        console.error('Error transferring mission:', error);
        let errorMessage = 'Erreur lors du transfert';
        
        if (error.message.includes('locked')) {
            errorMessage = 'Mission verrouillée. Attendez 10 minutes après la création.';
        } else if (error.message.includes('Recipient mission limit')) {
            errorMessage = 'Le destinataire a atteint la limite de 4 missions.';
        }
        
        showAlert(errorMessage, 'error');
    }
}

// Load standard missions for swap
async function loadStandardMissions() {
    const standardMissionsList = document.getElementById('standardMissionsList');
    const standardMissions = userMissions.filter(m => m.level === 1);
    
    if (standardMissions.length === 0) {
        standardMissionsList.innerHTML = `
            <div class="empty-state">
                <p>Vous n'avez pas de missions Standard à échanger.</p>
            </div>
        `;
        return;
    }
    
    standardMissionsList.innerHTML = standardMissions.map(mission => `
        <div class="swap-mission-item" onclick="toggleSwapMission(${mission.tokenId})">
            <input type="checkbox" id="swap_${mission.tokenId}" value="${mission.tokenId}">
            <label for="swap_${mission.tokenId}">
                <strong>Mission #${mission.tokenId}</strong><br>
                <small>${mission.ipfsCID.substring(0, 20)}...</small>
            </label>
        </div>
    `).join('');
}

// Upload metadata to IPFS
async function uploadMetadataToIPFS() {
    try {
        // Get Pinata credentials
        const apiKey = document.getElementById('pinataApiKey').value.trim();
        const secretKey = document.getElementById('pinataSecretKey').value.trim();
        
        if (!apiKey || !secretKey) {
            showAlert('Veuillez entrer vos clés API Pinata', 'warning');
            return;
        }
        
        // Set credentials
        ipfsUploader.setCredentials(apiKey, secretKey);
        
        // Get metadata values
        const name = document.getElementById('metaMissionName').value.trim();
        if (!name) {
            showAlert('Le nom de la mission est requis', 'warning');
            return;
        }
        
        const missionType = document.getElementById('metaMissionType').value.trim();
        const level = document.getElementById('missionLevel').value;
        
        // Determine mission value based on level selected
        let missionValue = 'Niveau 1';
        if (level === '2') missionValue = 'Niveau 2';
        if (level === '3') missionValue = 'Niveau 3';
        
        // Show loading status
        const statusEl = document.getElementById('uploadStatus');
        statusEl.textContent = '⏳ Upload en cours...';
        statusEl.className = 'upload-status loading';
        
        // Check if there's a flight plan file to upload first
        const flightPlanFile = document.getElementById('metaFlightPlanFile').files[0];
        let flightPlanHash = '';
        
        if (flightPlanFile) {
            showAlert('Upload du plan de vol vers IPFS...', 'info');
            flightPlanHash = await ipfsUploader.uploadFile(flightPlanFile);
            showAlert('Plan de vol uploadé: ' + flightPlanHash, 'success');
        }
        
        // Create metadata object
        const metadata = ipfsUploader.createMissionMetadata({
            name: name,
            type: missionType || LEVEL_NAMES[level] || 'Standard',
            value: missionValue,
            flightPlanHash: flightPlanHash,
            weight: document.getElementById('metaWeight').value.trim(),
            range: document.getElementById('metaRange').value.trim(),
            departureCity: document.getElementById('metaDeparture').value.trim(),
            destinationCity: document.getElementById('metaDestination').value.trim(),
            estimatedDuration: document.getElementById('metaDuration').value.trim(),
            cargo: document.getElementById('metaCargo').value.trim(),
            priority: level === '3' ? 'high' : level === '2' ? 'medium' : 'normal'
        });
        
        // Upload metadata to IPFS
        showAlert('Upload des métadonnées vers IPFS...', 'info');
        const cid = await ipfsUploader.uploadJSON(metadata);
        
        // Update UI with success
        statusEl.textContent = '✅ Uploadé: ' + cid;
        statusEl.className = 'upload-status success';
        
        // Auto-fill the CID field
        document.getElementById('ipfsCID').value = cid;
        
        showAlert('Métadonnées uploadées avec succès! CID: ' + cid, 'success');
        
        // Scroll to mission creation form
        document.getElementById('createMissionForm').scrollIntoView({ behavior: 'smooth' });
        
        return cid;
        
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        const statusEl = document.getElementById('uploadStatus');
        statusEl.textContent = '❌ Erreur: ' + error.message;
        statusEl.className = 'upload-status error';
        showAlert('Erreur lors de l\'upload: ' + error.message, 'error');
    }
}

// Toggle swap mission selection
function toggleSwapMission(tokenId) {
    const checkbox = document.getElementById(`swap_${tokenId}`);
    const item = checkbox.parentElement;
    
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        item.classList.add('selected');
    } else {
        item.classList.remove('selected');
    }
    
    // Check if exactly 3 are selected
    const selected = document.querySelectorAll('.swap-mission-item input:checked');
    if (selected.length > 3) {
        checkbox.checked = false;
        item.classList.remove('selected');
        showAlert('Maximum 3 missions peuvent être sélectionnées', 'warning');
    }
}

// Load transfer missions
async function loadTransferMissions() {
    const transferTokenIdSelect = document.getElementById('transferTokenId');
    
    if (userMissions.length === 0) {
        transferTokenIdSelect.innerHTML = '<option value="">Aucune mission disponible</option>';
        return;
    }
    
    transferTokenIdSelect.innerHTML = '<option value="">-- Sélectionner une mission --</option>' +
        userMissions.map(mission => `
            <option value="${mission.tokenId}">
                Mission #${mission.tokenId} - ${LEVEL_NAMES[mission.level]} 
                ${mission.isTransferable ? '✓' : '🔒'}
            </option>
        `).join('');
}

// Setup tabs
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Load data for specific tabs
            if (targetTab === 'missions') {
                displayMissions();
            } else if (targetTab === 'swap') {
                loadStandardMissions();
            } else if (targetTab === 'transfer') {
                loadTransferMissions();
            }
        });
    });
}

// Setup forms
function setupForms() {
    // Upload metadata button
    document.getElementById('uploadMetadataBtn').addEventListener('click', async () => {
        await uploadMetadataToIPFS();
    });
    
    // Create mission form
    document.getElementById('createMissionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const level = parseInt(document.getElementById('missionLevel').value);
        const ipfsCID = document.getElementById('ipfsCID').value.trim();
        await createMission(level, ipfsCID);
    });
    
    // Swap form
    document.getElementById('swapForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedCheckboxes = document.querySelectorAll('.swap-mission-item input:checked');
        const tokenIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
        const ipfsCID = document.getElementById('swapIpfsCID').value.trim();
        await swapResources(tokenIds, ipfsCID);
    });
    
    // Transfer form
    document.getElementById('transferForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tokenId = parseInt(document.getElementById('transferTokenId').value);
        const toAddress = document.getElementById('transferToAddress').value.trim();
        await transferMission(tokenId, toAddress);
    });
    
    // Transfer token selection
    document.getElementById('transferTokenId').addEventListener('change', async (e) => {
        const tokenId = parseInt(e.target.value);
        if (!tokenId) {
            document.getElementById('transferMissionInfo').classList.add('hidden');
            return;
        }
        
        const mission = userMissions.find(m => m.tokenId === tokenId);
        if (mission) {
            const infoCard = document.getElementById('transferMissionInfo');
            infoCard.innerHTML = `
                <h4>Informations de la Mission</h4>
                <div class="mission-detail">
                    <span class="mission-detail-label">Niveau:</span>
                    <span class="mission-detail-value">${LEVEL_NAMES[mission.level]}</span>
                </div>
                <div class="mission-detail">
                    <span class="mission-detail-label">IPFS CID:</span>
                    <span class="mission-detail-value">${mission.ipfsCID}</span>
                </div>
                <div class="mission-detail">
                    <span class="mission-detail-label">Statut:</span>
                    <span class="mission-detail-value">${mission.isTransferable ? '✓ Transférable' : '🔒 Verrouillé'}</span>
                </div>
            `;
            infoCard.classList.remove('hidden');
        }
    });
    
    // Refresh missions button
    document.getElementById('refreshMissions').addEventListener('click', async () => {
        showAlert('Actualisation...', 'info');
        await loadUserMissions();
        displayMissions();
        showAlert('Missions actualisées', 'success');
    });
    
    // Filter by level
    document.getElementById('filterLevel').addEventListener('change', (e) => {
        const level = e.target.value;
        if (level) {
            const filtered = userMissions.filter(m => m.level === parseInt(level));
            displayMissions(filtered);
        } else {
            displayMissions();
        }
    });
}

// Show alert
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    alertContainer.appendChild(alertDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Format address
function formatAddress(address) {
    if (!address) return '';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('fr-FR');
}

// Format time (seconds to readable format)
function formatTime(seconds) {
    if (seconds === 0) return 'Prêt';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
}

// Show documentation
function showDocumentation() {
    window.open('https://github.com/youvaKA/DroneSecure', '_blank');
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);

// Expose functions globally for onclick handlers
window.connectWallet = connectWallet;
window.viewMissionDetails = viewMissionDetails;
window.openIPFS = openIPFS;
window.toggleSwapMission = toggleSwapMission;
window.showDocumentation = showDocumentation;
window.uploadMetadataToIPFS = uploadMetadataToIPFS;
