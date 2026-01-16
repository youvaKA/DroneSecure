function MissionList({ missions, loading, onRefresh, ResourceLevel }) {
  const getLevelName = (level) => {
    const names = ['None', 'Standard', 'Express', 'Urgence Médicale']
    return names[level] || 'Unknown'
  }

  const getLevelClass = (level) => {
    if (level === ResourceLevel.Standard) return 'standard level-standard'
    if (level === ResourceLevel.Express) return 'express level-express'
    if (level === ResourceLevel.MedicalUrgency) return 'medical level-medical'
    return ''
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📋 Mes Missions</h2>
        <button className="btn btn-small" onClick={onRefresh} disabled={loading}>
          {loading ? '⏳' : '🔄'} Rafraîchir
        </button>
      </div>

      {loading ? (
        <div className="loading">Chargement des missions...</div>
      ) : missions.length === 0 ? (
        <div className="info">
          Aucune mission active. Créez votre première mission !
        </div>
      ) : (
        <div className="mission-list">
          {missions.map((mission) => (
            <div key={mission.tokenId} className={`mission-item ${getLevelClass(mission.level)}`}>
              <div className="mission-header">
                <span className="mission-id">Mission #{mission.tokenId}</span>
                <span className={`mission-level ${getLevelClass(mission.level)}`}>
                  {getLevelName(mission.level)}
                </span>
              </div>

              <div className="mission-details">
                <p><strong>IPFS CID:</strong> <span className="mission-cid">{mission.ipfsCID}</span></p>
                <p><strong>Créée le:</strong> {formatDate(mission.createdAt)}</p>
                <p><strong>Créateur:</strong> {mission.creator.slice(0, 6)}...{mission.creator.slice(-4)}</p>
                <p>
                  <strong>Transférable:</strong>{' '}
                  {mission.isTransferable ? (
                    <span style={{ color: '#4CAF50' }}>✅ Oui</span>
                  ) : (
                    <span style={{ color: '#f44336' }}>
                      🔒 Bloqué jusqu'à {formatDate(mission.lockedUntil)}
                    </span>
                  )}
                </p>
                {mission.previousOwners && mission.previousOwners.length > 0 && (
                  <p>
                    <strong>Anciens propriétaires:</strong> {mission.previousOwners.length}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MissionList
