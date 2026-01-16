import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import CreateMission from './components/CreateMission'
import MissionList from './components/MissionList'
import SwapResources from './components/SwapResources'
import CONTRACT_ABI from './utils/DroneSecure.abi.json'

// Default contract address for local Hardhat network
const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

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
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS)
  const [missions, setMissions] = useState([])
  const [userStats, setUserStats] = useState({
    missionCount: 0,
    canCreate: false,
    cooldownRemaining: 0
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load contract address from config on mount
  useEffect(() => {
    const loadContractAddress = async () => {
      try {
        const config = await import('./utils/contract-config.json')
        if (config.default?.address) {
          setContractAddress(config.default.address)
          console.log('Loaded contract address from config:', config.default.address)
        }
      } catch (err) {
        console.log('Using default contract address. Run deployment script to auto-configure.')
      }
    }
    loadContractAddress()
  }, [])

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
      const _contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer)

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
      const _missions = []

      // Get MissionCreated events for this user
      // This is more efficient than iterating through all token IDs
      try {
        const filter = _contract.filters.MissionCreated(null, userAddress)
        const events = await _contract.queryFilter(filter)
        
        // Check ownership of each token from events
        const ownershipChecks = await Promise.all(
          events.map(async (event) => {
            const tokenId = event.args.tokenId
            try {
              const owner = await _contract.ownerOf(tokenId)
              return { tokenId: Number(tokenId), isOwner: owner.toLowerCase() === userAddress.toLowerCase() }
            } catch (err) {
              // Token may have been burned
              return { tokenId: Number(tokenId), isOwner: false }
            }
          })
        )

        // Load full mission data for owned tokens
        const ownedTokenIds = ownershipChecks.filter(check => check.isOwner).map(check => check.tokenId)
        
        const missionDataPromises = ownedTokenIds.map(async (tokenId) => {
          try {
            const mission = await _contract.getMission(tokenId)
            const isTransferable = await _contract.isTransferable(tokenId)
            
            return {
              tokenId: Number(mission.tokenId),
              level: Number(mission.level),
              ipfsCID: mission.ipfsCID,
              createdAt: new Date(Number(mission.createdAt) * 1000),
              lastTransferAt: new Date(Number(mission.lastTransferAt) * 1000),
              lockedUntil: new Date(Number(mission.lockedUntil) * 1000),
              creator: mission.creator,
              previousOwners: mission.previousOwners,
              isTransferable
            }
          } catch (err) {
            console.error(`Error loading mission ${tokenId}:`, err)
            return null
          }
        })

        const missionsData = await Promise.all(missionDataPromises)
        _missions.push(...missionsData.filter(m => m !== null))
      } catch (eventErr) {
        console.warn('Event filtering not available, falling back to sequential scan:', eventErr)
        
        // Fallback: Sequential iteration (less efficient but works everywhere)
        const maxTokens = 100
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
