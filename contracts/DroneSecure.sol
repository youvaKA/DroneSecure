// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DroneSecure
 * @dev Manages airspace authorization for drone fleets with immutable flight history
 * 
 * Token Levels:
 * - N1: Drones < 1kg
 * - N2: Drones < 5kg  
 * - N3: Emergency medical priority
 * 
 * Constraints:
 * - Maximum 4 simultaneous missions per operator
 * - Token exchange: 2 N1 slots ↔ 1 N2 slot (zone-dependent)
 */
contract DroneSecure is Ownable, ReentrancyGuard {
    
    // Drone classification levels
    enum DroneLevel { N1, N2, N3 }
    
    // Mission status
    enum MissionStatus { Active, Completed, Cancelled }
    
    // Mission structure
    struct Mission {
        uint256 missionId;
        address operator;
        DroneLevel level;
        string zone;
        uint256 startTime;
        uint256 endTime;
        MissionStatus status;
        uint256 priority; // Higher for N3
    }
    
    // Operator structure
    struct Operator {
        address operatorAddress;
        uint256 activeMissions;
        uint256 n1Slots;
        uint256 n2Slots;
        uint256 n3Slots;
        bool isRegistered;
    }
    
    // Flight history entry for collision investigation
    struct FlightHistoryEntry {
        uint256 missionId;
        address operator;
        DroneLevel level;
        string zone;
        uint256 timestamp;
        string eventType; // "START", "END", "COLLISION", "PRIORITY_CHANGE"
        string details;
    }
    
    // State variables
    uint256 private missionCounter;
    uint256 private historyCounter;
    
    // Maximum simultaneous missions per operator
    uint256 public constant MAX_MISSIONS_PER_OPERATOR = 4;
    
    // Exchange rate: 2 N1 slots = 1 N2 slot
    uint256 public constant N1_TO_N2_EXCHANGE_RATE = 2;
    
    // Mappings
    mapping(address => Operator) public operators;
    mapping(uint256 => Mission) public missions;
    mapping(uint256 => FlightHistoryEntry) public flightHistory;
    mapping(string => bool) public authorizedZones;
    
    // Arrays for tracking
    uint256[] public activeMissionIds;
    
    // Events
    event OperatorRegistered(address indexed operator, uint256 n1Slots, uint256 n2Slots, uint256 n3Slots);
    event SlotsAllocated(address indexed operator, DroneLevel level, uint256 amount);
    event MissionStarted(uint256 indexed missionId, address indexed operator, DroneLevel level, string zone, uint256 priority);
    event MissionCompleted(uint256 indexed missionId, address indexed operator);
    event MissionCancelled(uint256 indexed missionId, address indexed operator);
    event SlotsExchanged(address indexed operator, uint256 n1SlotsUsed, uint256 n2SlotsReceived);
    event FlightHistoryRecorded(uint256 indexed historyId, uint256 indexed missionId, string eventType);
    event ZoneAuthorized(string zone);
    event CollisionDetected(uint256 indexed missionId1, uint256 indexed missionId2, string zone);
    
    constructor() Ownable(msg.sender) {
        missionCounter = 0;
        historyCounter = 0;
    }
    
    /**
     * @dev Register a new operator with initial slot allocations
     */
    function registerOperator(
        address operatorAddress,
        uint256 n1Slots,
        uint256 n2Slots,
        uint256 n3Slots
    ) external onlyOwner {
        require(!operators[operatorAddress].isRegistered, "Operator already registered");
        
        operators[operatorAddress] = Operator({
            operatorAddress: operatorAddress,
            activeMissions: 0,
            n1Slots: n1Slots,
            n2Slots: n2Slots,
            n3Slots: n3Slots,
            isRegistered: true
        });
        
        emit OperatorRegistered(operatorAddress, n1Slots, n2Slots, n3Slots);
    }
    
    /**
     * @dev Allocate additional slots to an operator
     */
    function allocateSlots(
        address operatorAddress,
        DroneLevel level,
        uint256 amount
    ) external onlyOwner {
        require(operators[operatorAddress].isRegistered, "Operator not registered");
        
        if (level == DroneLevel.N1) {
            operators[operatorAddress].n1Slots += amount;
        } else if (level == DroneLevel.N2) {
            operators[operatorAddress].n2Slots += amount;
        } else if (level == DroneLevel.N3) {
            operators[operatorAddress].n3Slots += amount;
        }
        
        emit SlotsAllocated(operatorAddress, level, amount);
    }
    
    /**
     * @dev Authorize a zone for flight operations
     */
    function authorizeZone(string memory zone) external onlyOwner {
        authorizedZones[zone] = true;
        emit ZoneAuthorized(zone);
    }
    
    /**
     * @dev Start a mission for a drone
     */
    function startMission(
        DroneLevel level,
        string memory zone
    ) external nonReentrant returns (uint256) {
        Operator storage operator = operators[msg.sender];
        
        require(operator.isRegistered, "Operator not registered");
        require(operator.activeMissions < MAX_MISSIONS_PER_OPERATOR, "Maximum missions reached");
        require(authorizedZones[zone], "Zone not authorized");
        
        // Check and consume slots
        if (level == DroneLevel.N1) {
            require(operator.n1Slots > 0, "Insufficient N1 slots");
            operator.n1Slots--;
        } else if (level == DroneLevel.N2) {
            require(operator.n2Slots > 0, "Insufficient N2 slots");
            operator.n2Slots--;
        } else if (level == DroneLevel.N3) {
            require(operator.n3Slots > 0, "Insufficient N3 slots");
            operator.n3Slots--;
        }
        
        missionCounter++;
        uint256 missionId = missionCounter;
        
        // N3 (emergency medical) gets highest priority
        uint256 priority = level == DroneLevel.N3 ? 1000 : (level == DroneLevel.N2 ? 100 : 10);
        
        missions[missionId] = Mission({
            missionId: missionId,
            operator: msg.sender,
            level: level,
            zone: zone,
            startTime: block.timestamp,
            endTime: 0,
            status: MissionStatus.Active,
            priority: priority
        });
        
        operator.activeMissions++;
        activeMissionIds.push(missionId);
        
        // Record in immutable flight history
        _recordFlightHistory(missionId, "START", "Mission started");
        
        emit MissionStarted(missionId, msg.sender, level, zone, priority);
        
        return missionId;
    }
    
    /**
     * @dev Complete a mission
     */
    function completeMission(uint256 missionId) external nonReentrant {
        Mission storage mission = missions[missionId];
        
        require(mission.operator == msg.sender, "Not mission operator");
        require(mission.status == MissionStatus.Active, "Mission not active");
        
        mission.status = MissionStatus.Completed;
        mission.endTime = block.timestamp;
        
        Operator storage operator = operators[msg.sender];
        operator.activeMissions--;
        
        // Return slot to operator
        if (mission.level == DroneLevel.N1) {
            operator.n1Slots++;
        } else if (mission.level == DroneLevel.N2) {
            operator.n2Slots++;
        } else if (mission.level == DroneLevel.N3) {
            operator.n3Slots++;
        }
        
        // Remove from active missions
        _removeActiveMission(missionId);
        
        // Record in immutable flight history
        _recordFlightHistory(missionId, "END", "Mission completed");
        
        emit MissionCompleted(missionId, msg.sender);
    }
    
    /**
     * @dev Cancel a mission
     */
    function cancelMission(uint256 missionId) external nonReentrant {
        Mission storage mission = missions[missionId];
        
        require(mission.operator == msg.sender, "Not mission operator");
        require(mission.status == MissionStatus.Active, "Mission not active");
        
        mission.status = MissionStatus.Cancelled;
        mission.endTime = block.timestamp;
        
        Operator storage operator = operators[msg.sender];
        operator.activeMissions--;
        
        // Return slot to operator
        if (mission.level == DroneLevel.N1) {
            operator.n1Slots++;
        } else if (mission.level == DroneLevel.N2) {
            operator.n2Slots++;
        } else if (mission.level == DroneLevel.N3) {
            operator.n3Slots++;
        }
        
        // Remove from active missions
        _removeActiveMission(missionId);
        
        // Record in immutable flight history
        _recordFlightHistory(missionId, "CANCELLED", "Mission cancelled");
        
        emit MissionCancelled(missionId, msg.sender);
    }
    
    /**
     * @dev Exchange N1 slots for N2 slots (subcontracting)
     * 2 N1 slots = 1 N2 slot
     */
    function exchangeN1ForN2(uint256 n2SlotsDesired) external nonReentrant {
        Operator storage operator = operators[msg.sender];
        
        require(operator.isRegistered, "Operator not registered");
        
        uint256 n1SlotsRequired = n2SlotsDesired * N1_TO_N2_EXCHANGE_RATE;
        require(operator.n1Slots >= n1SlotsRequired, "Insufficient N1 slots");
        
        operator.n1Slots -= n1SlotsRequired;
        operator.n2Slots += n2SlotsDesired;
        
        emit SlotsExchanged(msg.sender, n1SlotsRequired, n2SlotsDesired);
    }
    
    /**
     * @dev Exchange N2 slots for N1 slots (reverse subcontracting)
     * 1 N2 slot = 2 N1 slots
     */
    function exchangeN2ForN1(uint256 n2SlotsToExchange) external nonReentrant {
        Operator storage operator = operators[msg.sender];
        
        require(operator.isRegistered, "Operator not registered");
        require(operator.n2Slots >= n2SlotsToExchange, "Insufficient N2 slots");
        
        uint256 n1SlotsReceived = n2SlotsToExchange * N1_TO_N2_EXCHANGE_RATE;
        
        operator.n2Slots -= n2SlotsToExchange;
        operator.n1Slots += n1SlotsReceived;
        
        emit SlotsExchanged(msg.sender, n1SlotsReceived, n2SlotsToExchange);
    }
    
    /**
     * @dev Record a collision event in immutable history
     */
    function recordCollision(
        uint256 missionId1,
        uint256 missionId2,
        string memory details
    ) external onlyOwner {
        require(missions[missionId1].status == MissionStatus.Active, "Mission 1 not active");
        require(missions[missionId2].status == MissionStatus.Active, "Mission 2 not active");
        require(
            keccak256(bytes(missions[missionId1].zone)) == keccak256(bytes(missions[missionId2].zone)),
            "Missions not in same zone"
        );
        
        _recordFlightHistory(missionId1, "COLLISION", details);
        _recordFlightHistory(missionId2, "COLLISION", details);
        
        emit CollisionDetected(missionId1, missionId2, missions[missionId1].zone);
    }
    
    /**
     * @dev Internal function to record flight history (immutable)
     */
    function _recordFlightHistory(
        uint256 missionId,
        string memory eventType,
        string memory details
    ) internal {
        historyCounter++;
        
        Mission storage mission = missions[missionId];
        
        flightHistory[historyCounter] = FlightHistoryEntry({
            missionId: missionId,
            operator: mission.operator,
            level: mission.level,
            zone: mission.zone,
            timestamp: block.timestamp,
            eventType: eventType,
            details: details
        });
        
        emit FlightHistoryRecorded(historyCounter, missionId, eventType);
    }
    
    /**
     * @dev Internal function to remove a mission from active missions array
     */
    function _removeActiveMission(uint256 missionId) internal {
        for (uint256 i = 0; i < activeMissionIds.length; i++) {
            if (activeMissionIds[i] == missionId) {
                activeMissionIds[i] = activeMissionIds[activeMissionIds.length - 1];
                activeMissionIds.pop();
                break;
            }
        }
    }
    
    // View functions
    
    /**
     * @dev Get operator information
     */
    function getOperator(address operatorAddress) external view returns (
        uint256 activeMissions,
        uint256 n1Slots,
        uint256 n2Slots,
        uint256 n3Slots,
        bool isRegistered
    ) {
        Operator storage operator = operators[operatorAddress];
        return (
            operator.activeMissions,
            operator.n1Slots,
            operator.n2Slots,
            operator.n3Slots,
            operator.isRegistered
        );
    }
    
    /**
     * @dev Get mission details
     */
    function getMission(uint256 missionId) external view returns (
        address operator,
        DroneLevel level,
        string memory zone,
        uint256 startTime,
        uint256 endTime,
        MissionStatus status,
        uint256 priority
    ) {
        Mission storage mission = missions[missionId];
        return (
            mission.operator,
            mission.level,
            mission.zone,
            mission.startTime,
            mission.endTime,
            mission.status,
            mission.priority
        );
    }
    
    /**
     * @dev Get flight history entry
     */
    function getFlightHistory(uint256 historyId) external view returns (
        uint256 missionId,
        address operator,
        DroneLevel level,
        string memory zone,
        uint256 timestamp,
        string memory eventType,
        string memory details
    ) {
        FlightHistoryEntry storage entry = flightHistory[historyId];
        return (
            entry.missionId,
            entry.operator,
            entry.level,
            entry.zone,
            entry.timestamp,
            entry.eventType,
            entry.details
        );
    }
    
    /**
     * @dev Get all active mission IDs
     */
    function getActiveMissions() external view returns (uint256[] memory) {
        return activeMissionIds;
    }
    
    /**
     * @dev Get active missions in a specific zone
     */
    function getActiveMissionsInZone(string memory zone) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count missions in zone
        for (uint256 i = 0; i < activeMissionIds.length; i++) {
            if (keccak256(bytes(missions[activeMissionIds[i]].zone)) == keccak256(bytes(zone))) {
                count++;
            }
        }
        
        // Populate result array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < activeMissionIds.length; i++) {
            if (keccak256(bytes(missions[activeMissionIds[i]].zone)) == keccak256(bytes(zone))) {
                result[index] = activeMissionIds[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get total number of missions
     */
    function getTotalMissions() external view returns (uint256) {
        return missionCounter;
    }
    
    /**
     * @dev Get total number of history entries
     */
    function getTotalHistoryEntries() external view returns (uint256) {
        return historyCounter;
    }
}
