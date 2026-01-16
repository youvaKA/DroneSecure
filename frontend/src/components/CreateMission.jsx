import { useState } from 'react'

function CreateMission({ contract, canCreate, onSuccess, ResourceLevel }) {
  const [level, setLevel] = useState(1)
  const [ipfsCID, setIpfsCID] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!ipfsCID.trim()) {
      setError('Le CID IPFS est requis')
      return
    }

    try {
      setLoading(true)
      const tx = await contract.createMission(level, ipfsCID)
      await tx.wait()

      setSuccess(`Mission créée avec succès ! Niveau: ${getLevelName(level)}`)
      setIpfsCID('')
      
      setTimeout(() => {
        onSuccess()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      console.error('Erreur de création:', err)
      
      let errorMessage = 'Erreur lors de la création de la mission'
      if (err.message.includes('Maximum missions limit reached')) {
        errorMessage = 'Limite de 4 missions atteinte'
      } else if (err.message.includes('Cooldown period not elapsed')) {
        errorMessage = 'Cooldown de 5 minutes non écoulé'
      } else if (err.message.includes('user rejected')) {
        errorMessage = 'Transaction rejetée par l\'utilisateur'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getLevelName = (lvl) => {
    const names = ['None', 'Standard', 'Express', 'Urgence Médicale']
    return names[lvl] || 'Unknown'
  }

  return (
    <div className="card">
      <h2>➕ Créer une Mission</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Niveau de Ressource</label>
          <select 
            value={level} 
            onChange={(e) => setLevel(Number(e.target.value))}
            disabled={loading}
          >
            <option value={ResourceLevel.Standard}>Standard (1)</option>
            <option value={ResourceLevel.Express}>Express (2)</option>
            <option value={ResourceLevel.MedicalUrgency}>Urgence Médicale (3)</option>
          </select>
        </div>

        <div className="form-group">
          <label>IPFS CID</label>
          <input
            type="text"
            value={ipfsCID}
            onChange={(e) => setIpfsCID(e.target.value)}
            placeholder="QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            disabled={loading}
          />
          <small style={{ color: '#666', fontSize: '0.9rem' }}>
            Hash IPFS contenant les métadonnées de la mission
          </small>
        </div>

        <button 
          type="submit" 
          className="btn" 
          disabled={loading || !canCreate}
        >
          {loading ? 'Création en cours...' : 'Créer la Mission'}
        </button>

        {!canCreate && (
          <div className="info" style={{ marginTop: '15px' }}>
            <strong>Note:</strong> Vous devez attendre 5 minutes entre chaque création 
            ou avoir moins de 4 missions actives.
          </div>
        )}
      </form>
    </div>
  )
}

export default CreateMission
