import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import CreateMission from './components/CreateMission'
import MissionList from './components/MissionList'
import SwapResources from './components/SwapResources'
import CONTRACT_ABI from './utils/DroneSecure.abi.json'

// Default contract address for local Hardhat network
// Update this after deploying to your network
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

const ResourceLevel = {
  None: 0,
  Standard: 1,
  Express: 2,
  MedicalUrgency: 3
}

function App() {
  const [account, setAccount] = useState(null)
  const [contract, setContract] = useState(null)
  const [provider, setProvider] = useState(null)
  const [missions, setMissions] = useState([])
  const [userStats, setUserStats] = useState({
    missionCount: 0,
    canCreate: false,
    cooldownRemaining: 0
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setError(null)
      if (!window.ethereum) {
        setError('MetaMask non installé ! Installez MetaMask pour utiliser cette DApp.')
        return
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      
      const _provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await _provider.getSigner()
      const _contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      setAccount(accounts[0])
      setProvider(_provider)
      setContract(_contract)

      await loadUserData(_contract, accounts[0])
      await loadMissions(_contract, accounts[0])
    } catch (err) {
      console.error('Erreur de connexion:', err)
      setError('Erreur de connexion au portefeuille: ' + err.message)
    }
  }

  // Load user statistics
  const loadUserData = async (_contract, userAddress) => {
    try {
      const missionCount = await _contract.getUserMissionCount(userAddress)
      const canCreate = await _contract.canCreateMission(userAddress)
      const cooldownRemaining = await _contract.cooldownRemaining(userAddress)

      setUserStats({
        missionCount: Number(missionCount),
        canCreate,
        cooldownRemaining: Number(cooldownRemaining)
      })
    } catch (err) {
      console.error('Erreur de chargement des données utilisateur:', err)
    }
  }

  // Load user's missions
  const loadMissions = async (_contract, userAddress) => {
    try {
      setLoading(true)
      const missionCount = await _contract.getUserMissionCount(userAddress)
      const _missions = []

      // Get all missions owned by user
      // Since we don't have a direct getter, we'll try token IDs sequentially
      // This is a simplified approach - in production, you'd use events or indexing
      const maxTokens = 100 // Reasonable limit for demo
      for (let i = 0; i < maxTokens; i++) {
        try {
          const owner = await _contract.ownerOf(i)
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            const mission = await _contract.getMission(i)
            _missions.push({
              tokenId: Number(mission.tokenId),
              level: Number(mission.level),
              ipfsCID: mission.ipfsCID,
              createdAt: new Date(Number(mission.createdAt) * 1000),
              lastTransferAt: new Date(Number(mission.lastTransferAt) * 1000),
              lockedUntil: new Date(Number(mission.lockedUntil) * 1000),
              creator: mission.creator,
              previousOwners: mission.previousOwners,
              isTransferable: await _contract.isTransferable(i)
            })
          }
        } catch (err) {
          // Token doesn't exist, continue
          if (err.message.includes('ERC721NonexistentToken')) {
            continue
          }
        }
      }

      setMissions(_missions)
    } catch (err) {
      console.error('Erreur de chargement des missions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Refresh data
  const refreshData = async () => {
    if (contract && account) {
      await loadUserData(contract, account)
      await loadMissions(contract, account)
    }
  }

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          if (contract) {
            loadUserData(contract, accounts[0])
            loadMissions(contract, accounts[0])
          }
        } else {
          setAccount(null)
          setContract(null)
          setProvider(null)
        }
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged')
      }
    }
  }, [contract])

  return (
    <div className="App">
      {/* Header */}
      <div className="header">
        <h1>🛸 DroneSecure</h1>
        <p>Gestion Décentralisée de l'Espace Aérien</p>
      </div>

      {/* Connect Wallet Section */}
      <div className="connect-section">
        {!account ? (
          <button className="btn" onClick={connectWallet}>
            Connecter MetaMask
          </button>
        ) : (
          <div className="address-display">
            <strong>Connecté:</strong>
            <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error">
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {/* Main Content */}
      {account && contract && (
        <>
          {/* User Stats */}
          <div className="card" style={{ maxWidth: '1200px', margin: '0 auto 30px' }}>
            <h2>📊 Statistiques</h2>
            <div className="stats">
              <div className="stat-item">
                <div className="stat-value">{userStats.missionCount}</div>
                <div className="stat-label">Missions Actives</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{4 - userStats.missionCount}</div>
                <div className="stat-label">Places Restantes</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {userStats.canCreate ? '✅' : '🕐'}
                </div>
                <div className="stat-label">
                  {userStats.canCreate 
                    ? 'Prêt' 
                    : `Cooldown: ${Math.ceil(userStats.cooldownRemaining / 60)}m`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="main-content">
            {/* Create Mission */}
            <CreateMission 
              contract={contract}
              canCreate={userStats.canCreate}
              onSuccess={refreshData}
              ResourceLevel={ResourceLevel}
            />

            {/* Mission List */}
            <MissionList 
              missions={missions}
              loading={loading}
              onRefresh={refreshData}
              ResourceLevel={ResourceLevel}
            />

            {/* Swap Resources */}
            <SwapResources 
              contract={contract}
              missions={missions.filter(m => m.level === ResourceLevel.Standard)}
              onSuccess={refreshData}
              ResourceLevel={ResourceLevel}
            />
          </div>
        </>
      )}

      {/* Footer */}
      <div className="footer">
        <p>
          DroneSecure © 2026 | 
          <a href="https://github.com/youvaKA/DroneSecure" target="_blank" rel="noopener noreferrer">
            {' '}GitHub
          </a>
        </p>
      </div>
    </div>
  )
}

export default App
