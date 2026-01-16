# DroneSecure Quick Reference Guide

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Compile contract (requires network access for first compile)
npm run compile

# Run tests
npm test

# Deploy to local network
npm run node          # Terminal 1
npm run deploy:local  # Terminal 2
```

## 📝 Smart Contract API

### Main Functions

#### `createMission(ResourceLevel level, string memory ipfsCID)`
Create a new drone mission.

**Parameters:**
- `level`: 1 (Standard), 2 (Express), or 3 (Medical Urgency)
- `ipfsCID`: IPFS hash of mission metadata

**Constraints:**
- Max 4 active missions per user
- 5-minute cooldown between creations
- IPFS CID cannot be empty

**Returns:** `uint256` tokenId

**Example:**
```javascript
const tx = await droneSecure.createMission(1, "QmP7hdxc...");
const receipt = await tx.wait();
const tokenId = receipt.events[0].args.tokenId;
```

---

#### `swapResources(uint256[] memory tokenIds, string memory ipfsCID)`
Exchange 3 Standard tokens for 1 Medical Urgency token.

**Parameters:**
- `tokenIds`: Array of exactly 3 Standard level token IDs
- `ipfsCID`: IPFS hash for new mission

**Requirements:**
- Must own all 3 tokens
- All tokens must be Standard level (1)

**Returns:** `uint256` new tokenId

**Example:**
```javascript
const tx = await droneSecure.swapResources([0, 1, 2], "QmX9hdxc...");
```

---

#### `transferFrom(address from, address to, uint256 tokenId)`
Transfer a mission to another address.

**Constraints:**
- Token must be unlocked (10 minutes after creation)
- Recipient cannot exceed 4 mission limit

**Example:**
```javascript
await droneSecure.transferFrom(owner.address, recipient.address, tokenId);
```

---

### View Functions

#### `getMission(uint256 tokenId)`
Get complete mission information.

**Returns:** Mission struct with:
- `tokenId`: Token identifier
- `level`: Resource level (1, 2, or 3)
- `ipfsCID`: IPFS metadata hash
- `createdAt`: Creation timestamp
- `lockedUntil`: Lock expiration timestamp
- `creator`: Original creator address

```javascript
const mission = await droneSecure.getMission(tokenId);
console.log("Level:", mission.level);
console.log("IPFS CID:", mission.ipfsCID);
```

---

#### `getUserMissionCount(address user)`
Get number of active missions for a user.

```javascript
const count = await droneSecure.getUserMissionCount(userAddress);
console.log("Active missions:", count);
```

---

#### `canCreateMission(address user)`
Check if user can create a new mission (cooldown and limit checks).

```javascript
const canCreate = await droneSecure.canCreateMission(userAddress);
if (canCreate) {
  // User can create mission
}
```

---

#### `cooldownRemaining(address user)`
Get remaining cooldown time in seconds.

```javascript
const remaining = await droneSecure.cooldownRemaining(userAddress);
console.log("Wait", remaining, "seconds before next creation");
```

---

#### `isTransferable(uint256 tokenId)`
Check if a token can be transferred (lock expired).

```javascript
const canTransfer = await droneSecure.isTransferable(tokenId);
```

---

## 🎯 Resource Levels

| Level | Value | Name | Use Case |
|:------|:------|:-----|:---------|
| 1 | Standard | Regular delivery | Standard package delivery |
| 2 | Express | Priority delivery | Urgent packages, time-sensitive |
| 3 | MedicalUrgency | Medical emergency | Medical supplies, organ transport |

---

## ⏱️ Time Constraints

| Constraint | Duration | Purpose |
|:-----------|:---------|:--------|
| Cooldown | 5 minutes (300s) | Prevent spam mission creation |
| Lock Period | 10 minutes (600s) | Protect critical takeoff phase |

---

## 📊 Constants

```solidity
MAX_MISSIONS_PER_USER = 4      // Maximum active missions
COOLDOWN_PERIOD = 300          // 5 minutes in seconds
LOCK_PERIOD = 600              // 10 minutes in seconds
SWAP_RATIO = 3                 // 3 Standard for 1 Medical
```

---

## 🔔 Events

### `MissionCreated(uint256 indexed tokenId, address indexed owner, ResourceLevel level, string ipfsCID)`
Emitted when a new mission is created.

```javascript
droneSecure.on("MissionCreated", (tokenId, owner, level, ipfsCID) => {
  console.log(`New mission ${tokenId} created by ${owner}`);
});
```

### `ResourceSwapped(address indexed user, uint256[] burnedTokenIds, uint256 newTokenId)`
Emitted when resources are swapped.

```javascript
droneSecure.on("ResourceSwapped", (user, burned, newId) => {
  console.log(`User ${user} swapped tokens ${burned} for ${newId}`);
});
```

---

## 🗂️ IPFS Metadata Structure

```json
{
  "name": "Mission_Alpha_2026",
  "type": "Urgence Médicale",
  "value": "Niveau 3",
  "hash": "QmP...",
  "previousOwners": ["0xAddress1"],
  "createdAt": "1737052800",
  "lastTransferAt": "1737053500",
  "attributes": {
    "weight": "2kg",
    "range": "15km",
    "priority": "high",
    "departureCity": "Paris",
    "destinationCity": "Lyon"
  },
  "flightPlan": {
    "waypoints": [
      {"lat": 48.8566, "lon": 2.3522}
    ],
    "altitude": "120m",
    "speed": "25m/s"
  }
}
```

---

## ⚠️ Common Errors

### `"Maximum missions limit reached"`
- User has 4 active missions
- Solution: Transfer or burn a mission first

### `"Cooldown period not elapsed"`
- 5 minutes haven't passed since last creation
- Solution: Wait for cooldown to expire

### `"Token is locked for 10 minutes after creation"`
- Trying to transfer within 10-minute lock period
- Solution: Wait for lock to expire

### `"Invalid resource level"`
- Used level 0 (None)
- Solution: Use level 1, 2, or 3

### `"IPFS CID cannot be empty"`
- Empty string passed for ipfsCID
- Solution: Provide valid IPFS hash

### `"Must provide exactly 3 tokens"`
- Swap with wrong number of tokens
- Solution: Provide array of exactly 3 token IDs

### `"Token must be Standard level"`
- Trying to swap non-Standard tokens
- Solution: Only swap level 1 tokens

---

## 🧪 Testing Examples

### Create Mission
```javascript
const tx = await droneSecure.connect(user).createMission(1, "QmTest123");
await tx.wait();
```

### Wait for Cooldown
```javascript
await ethers.provider.send("evm_increaseTime", [300]); // 5 minutes
await ethers.provider.send("evm_mine");
```

### Wait for Lock
```javascript
await ethers.provider.send("evm_increaseTime", [600]); // 10 minutes
await ethers.provider.send("evm_mine");
```

### Check Mission
```javascript
const mission = await droneSecure.getMission(0);
expect(mission.level).to.equal(1);
```

---

## 🔒 Security Best Practices

1. **Always validate IPFS CIDs** before passing to contract
2. **Check cooldown** before attempting creation
3. **Verify ownership** before transfer operations
4. **Monitor events** for real-time mission tracking
5. **Validate recipient** has capacity for transfers
6. **Store private keys securely** - never commit to repo
7. **Use multisig** for contract ownership in production
8. **Audit metadata** before uploading to IPFS

---

## 📞 Support

- GitHub Issues: [Report bugs or request features](https://github.com/youvaKA/DroneSecure/issues)
- Documentation: See [README.md](README.md)
- Validation: See [IMPLEMENTATION_VALIDATION.md](IMPLEMENTATION_VALIDATION.md)
