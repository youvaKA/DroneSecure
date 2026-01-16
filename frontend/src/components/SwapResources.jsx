import { useState } from 'react'

function SwapResources({ contract, missions, onSuccess, ResourceLevel }) {
  const [selectedTokens, setSelectedTokens] = useState([])
  const [ipfsCID, setIpfsCID] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleTokenSelect = (tokenId) => {
    if (selectedTokens.includes(tokenId)) {
      setSelectedTokens(selectedTokens.filter(id => id !== tokenId))
    } else if (selectedTokens.length < 3) {
      setSelectedTokens([...selectedTokens, tokenId])
    }
  }

  const handleSwap = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (selectedTokens.length !== 3) {
      setError('Vous devez sélectionner exactement 3 tokens Standard')
      return
    }

    if (!ipfsCID.trim()) {
      setError('Le CID IPFS est requis')
      return
    }

    try {
      setLoading(true)
      const tx = await contract.swapResources(selectedTokens, ipfsCID)
      await tx.wait()

      setSuccess('Échange réussi ! 3 tokens Standard → 1 token Urgence Médicale')
      setSelectedTokens([])
      setIpfsCID('')

      setTimeout(() => {
        onSuccess()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      console.error('Erreur d\'échange:', err)

      let errorMessage = 'Erreur lors de l\'échange des ressources'
      if (err.message.includes('Must provide exactly 3 tokens')) {
        errorMessage = 'Vous devez fournir exactement 3 tokens'
      } else if (err.message.includes('Not owner of token')) {
        errorMessage = 'Vous n\'êtes pas propriétaire de tous ces tokens'
      } else if (err.message.includes('Token must be Standard level')) {
        errorMessage = 'Tous les tokens doivent être de niveau Standard'
      } else if (err.message.includes('user rejected')) {
        errorMessage = 'Transaction rejetée par l\'utilisateur'
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>🔄 Échanger des Ressources</h2>

      <div className="info">
        <strong>Règle d'échange:</strong> 3 tokens Standard → 1 token Urgence Médicale
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {missions.length === 0 ? (
        <div className="info">
          Vous n'avez aucun token Standard disponible pour l'échange.
        </div>
      ) : (
        <form onSubmit={handleSwap}>
          <div className="swap-section">
            <label>Sélectionnez 3 tokens Standard ({selectedTokens.length}/3)</label>
            <div className="token-selector">
              {missions.map((mission) => (
                <div key={mission.tokenId} className="token-checkbox">
                  <input
                    type="checkbox"
                    id={`token-${mission.tokenId}`}
                    checked={selectedTokens.includes(mission.tokenId)}
                    onChange={() => handleTokenSelect(mission.tokenId)}
                    disabled={loading || (!selectedTokens.includes(mission.tokenId) && selectedTokens.length >= 3)}
                  />
                  <label htmlFor={`token-${mission.tokenId}`}>
                    Mission #{mission.tokenId}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>IPFS CID pour le nouveau token</label>
            <input
              type="text"
              value={ipfsCID}
              onChange={(e) => setIpfsCID(e.target.value)}
              placeholder="QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-secondary" 
            disabled={loading || selectedTokens.length !== 3}
          >
            {loading ? 'Échange en cours...' : 'Échanger les Ressources'}
          </button>
        </form>
      )}
    </div>
  )
}

export default SwapResources
