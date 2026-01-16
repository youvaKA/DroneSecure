const { expect } = require("chai");
const hre = require("hardhat");

describe("DroneSecure", function () {
  let droneSecure;
  let owner;
  let operator1;
  let operator2;
  let operator3;

  beforeEach(async function () {
    [owner, operator1, operator2, operator3] = await hre.ethers.getSigners();

    const DroneSecure = await hre.ethers.getContractFactory("DroneSecure");
    droneSecure = await DroneSecure.deploy();
    await droneSecure.waitForDeployment();
  });

  describe("Operator Registration", function () {
    it("Should register a new operator with initial slots", async function () {
      await droneSecure.registerOperator(operator1.address, 10, 5, 2);

      const operatorInfo = await droneSecure.getOperator(operator1.address);
      expect(operatorInfo.activeMissions).to.equal(0);
      expect(operatorInfo.n1Slots).to.equal(10);
      expect(operatorInfo.n2Slots).to.equal(5);
      expect(operatorInfo.n3Slots).to.equal(2);
      expect(operatorInfo.isRegistered).to.be.true;
    });

    it("Should not allow duplicate operator registration", async function () {
      await droneSecure.registerOperator(operator1.address, 10, 5, 2);

      await expect(
        droneSecure.registerOperator(operator1.address, 5, 3, 1)
      ).to.be.revertedWith("Operator already registered");
    });

    it("Should emit OperatorRegistered event", async function () {
      await expect(droneSecure.registerOperator(operator1.address, 10, 5, 2))
        .to.emit(droneSecure, "OperatorRegistered")
        .withArgs(operator1.address, 10, 5, 2);
    });
  });

  describe("Slot Allocation", function () {
    beforeEach(async function () {
      await droneSecure.registerOperator(operator1.address, 10, 5, 2);
    });

    it("Should allocate N1 slots to operator", async function () {
      await droneSecure.allocateSlots(operator1.address, 0, 5); // DroneLevel.N1 = 0

      const operatorInfo = await droneSecure.getOperator(operator1.address);
      expect(operatorInfo.n1Slots).to.equal(15);
    });

    it("Should allocate N2 slots to operator", async function () {
      await droneSecure.allocateSlots(operator1.address, 1, 3); // DroneLevel.N2 = 1

      const operatorInfo = await droneSecure.getOperator(operator1.address);
      expect(operatorInfo.n2Slots).to.equal(8);
    });

    it("Should allocate N3 slots to operator", async function () {
      await droneSecure.allocateSlots(operator1.address, 2, 1); // DroneLevel.N3 = 2

      const operatorInfo = await droneSecure.getOperator(operator1.address);
      expect(operatorInfo.n3Slots).to.equal(3);
    });

    it("Should emit SlotsAllocated event", async function () {
      await expect(droneSecure.allocateSlots(operator1.address, 0, 5))
        .to.emit(droneSecure, "SlotsAllocated")
        .withArgs(operator1.address, 0, 5);
    });
  });

  describe("Zone Authorization", function () {
    it("Should authorize a zone for flight operations", async function () {
      await droneSecure.authorizeZone("ZONE_A");

      const isAuthorized = await droneSecure.authorizedZones("ZONE_A");
      expect(isAuthorized).to.be.true;
    });

    it("Should emit ZoneAuthorized event", async function () {
      await expect(droneSecure.authorizeZone("ZONE_A"))
        .to.emit(droneSecure, "ZoneAuthorized")
        .withArgs("ZONE_A");
    });
  });

  describe("Mission Management", function () {
    beforeEach(async function () {
      await droneSecure.registerOperator(operator1.address, 10, 5, 2);
      await droneSecure.authorizeZone("ZONE_A");
    });

    it("Should start a mission with N1 level", async function () {
      await expect(droneSecure.connect(operator1).startMission(0, "ZONE_A"))
        .to.emit(droneSecure, "MissionStarted");

      const operatorInfo = await droneSecure.getOperator(operator1.address);
      expect(operatorInfo.activeMissions).to.equal(1);
      expect(operatorInfo.n1Slots).to.equal(9);
    });

    it("Should start a mission with N2 level", async function () {
      await droneSecure.connect(operator1).startMission(1, "ZONE_A");

      const operatorInfo = await droneSecure.getOperator(operator1.address);
      expect(operatorInfo.activeMissions).to.equal(1);
      expect(operatorInfo.n2Slots).to.equal(4);
    });

    it("Should start a mission with N3 level (emergency)", async function () {
      await droneSecure.connect(operator1).startMission(2, "ZONE_A");

      const missionInfo = await droneSecure.getMission(1);
      expect(missionInfo.priority).to.equal(1000); // N3 has highest priority
    });

    it("Should not allow mission in unauthorized zone", async function () {
      await expect(
        droneSecure.connect(operator1).startMission(0, "ZONE_B")
      ).to.be.revertedWith("Zone not authorized");
    });

    it("Should not allow unregistered operator to start mission", async function () {
      await expect(
        droneSecure.connect(operator2).startMission(0, "ZONE_A")
      ).to.be.revertedWith("Operator not registered");
    });

    it("Should not allow more than 4 simultaneous missions", async function () {
      // Start 4 missions
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");

      // Try to start 5th mission
      await expect(
        droneSecure.connect(operator1).startMission(0, "ZONE_A")
      ).to.be.revertedWith("Maximum missions reached");
    });

    it("Should complete a mission and return slot", async function () {
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");

      const operatorBefore = await droneSecure.getOperator(operator1.address);
      expect(operatorBefore.activeMissions).to.equal(1);
      expect(operatorBefore.n1Slots).to.equal(9);

      await droneSecure.connect(operator1).completeMission(1);

      const operatorAfter = await droneSecure.getOperator(operator1.address);
      expect(operatorAfter.activeMissions).to.equal(0);
      expect(operatorAfter.n1Slots).to.equal(10);
    });

    it("Should cancel a mission and return slot", async function () {
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");

      await droneSecure.connect(operator1).cancelMission(1);

      const operatorInfo = await droneSecure.getOperator(operator1.address);
      expect(operatorInfo.activeMissions).to.equal(0);
      expect(operatorInfo.n1Slots).to.equal(10);
    });

    it("Should not allow non-operator to complete mission", async function () {
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");

      await expect(
        droneSecure.connect(operator2).completeMission(1)
      ).to.be.revertedWith("Not mission operator");
    });

    it("Should track mission details correctly", async function () {
      await droneSecure.connect(operator1).startMission(1, "ZONE_A");

      const missionInfo = await droneSecure.getMission(1);
      expect(missionInfo.operator).to.equal(operator1.address);
      expect(missionInfo.level).to.equal(1); // N2
      expect(missionInfo.zone).to.equal("ZONE_A");
      expect(missionInfo.status).to.equal(0); // Active
    });
  });

  describe("Slot Exchange (Subcontracting)", function () {
    beforeEach(async function () {
      await droneSecure.registerOperator(operator1.address, 10, 5, 2);
    });

    it("Should exchange 2 N1 slots for 1 N2 slot", async function () {
      await droneSecure.connect(operator1).exchangeN1ForN2(1);

      const operatorInfo = await droneSecure.getOperator(operator1.address);
      expect(operatorInfo.n1Slots).to.equal(8); // 10 - 2
      expect(operatorInfo.n2Slots).to.equal(6); // 5 + 1
    });

    it("Should exchange 4 N1 slots for 2 N2 slots", async function () {
      await droneSecure.connect(operator1).exchangeN1ForN2(2);

      const operatorInfo = await droneSecure.getOperator(operator1.address);
      expect(operatorInfo.n1Slots).to.equal(6); // 10 - 4
      expect(operatorInfo.n2Slots).to.equal(7); // 5 + 2
    });

    it("Should not allow exchange with insufficient N1 slots", async function () {
      await expect(
        droneSecure.connect(operator1).exchangeN1ForN2(6) // Needs 12 N1 slots
      ).to.be.revertedWith("Insufficient N1 slots");
    });

    it("Should exchange 1 N2 slot for 2 N1 slots (reverse)", async function () {
      await droneSecure.connect(operator1).exchangeN2ForN1(1);

      const operatorInfo = await droneSecure.getOperator(operator1.address);
      expect(operatorInfo.n1Slots).to.equal(12); // 10 + 2
      expect(operatorInfo.n2Slots).to.equal(4); // 5 - 1
    });

    it("Should emit SlotsExchanged event", async function () {
      await expect(droneSecure.connect(operator1).exchangeN1ForN2(1))
        .to.emit(droneSecure, "SlotsExchanged")
        .withArgs(operator1.address, 0, 2, 1, 1); // fromLevel=N1(0), fromAmount=2, toLevel=N2(1), toAmount=1
    });
  });

  describe("Flight History (Immutable Black Box)", function () {
    beforeEach(async function () {
      await droneSecure.registerOperator(operator1.address, 10, 5, 2);
      await droneSecure.authorizeZone("ZONE_A");
    });

    it("Should record mission start in flight history", async function () {
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");

      const history = await droneSecure.getFlightHistory(1);
      expect(history.missionId).to.equal(1);
      expect(history.operator).to.equal(operator1.address);
      expect(history.eventType).to.equal("START");
    });

    it("Should record mission completion in flight history", async function () {
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator1).completeMission(1);

      const history = await droneSecure.getFlightHistory(2);
      expect(history.missionId).to.equal(1);
      expect(history.eventType).to.equal("END");
    });

    it("Should record collision in flight history", async function () {
      await droneSecure.registerOperator(operator2.address, 10, 5, 2);

      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator2).startMission(0, "ZONE_A");

      await droneSecure.recordCollision(1, 2, "Collision detected at coordinates X,Y");

      const history1 = await droneSecure.getFlightHistory(3);
      const history2 = await droneSecure.getFlightHistory(4);

      expect(history1.eventType).to.equal("COLLISION");
      expect(history2.eventType).to.equal("COLLISION");
    });

    it("Should emit FlightHistoryRecorded event", async function () {
      await expect(droneSecure.connect(operator1).startMission(0, "ZONE_A"))
        .to.emit(droneSecure, "FlightHistoryRecorded");
    });

    it("Should track total history entries", async function () {
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator1).completeMission(1);

      const totalEntries = await droneSecure.getTotalHistoryEntries();
      expect(totalEntries).to.equal(2);
    });
  });

  describe("Collision Recording", function () {
    beforeEach(async function () {
      await droneSecure.registerOperator(operator1.address, 10, 5, 2);
      await droneSecure.registerOperator(operator2.address, 10, 5, 2);
      await droneSecure.authorizeZone("ZONE_A");
    });

    it("Should record collision between two missions in same zone", async function () {
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator2).startMission(0, "ZONE_A");

      await expect(
        droneSecure.recordCollision(1, 2, "Collision at coordinates")
      ).to.emit(droneSecure, "CollisionDetected");
    });

    it("Should not record collision for missions in different zones", async function () {
      await droneSecure.authorizeZone("ZONE_B");

      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator2).startMission(0, "ZONE_B");

      await expect(
        droneSecure.recordCollision(1, 2, "Collision")
      ).to.be.revertedWith("Missions not in same zone");
    });

    it("Should verify priority in collision history", async function () {
      // Start N3 emergency mission (priority 1000)
      await droneSecure.connect(operator1).startMission(2, "ZONE_A");
      // Start N1 regular mission (priority 10)
      await droneSecure.connect(operator2).startMission(0, "ZONE_A");

      const mission1 = await droneSecure.getMission(1);
      const mission2 = await droneSecure.getMission(2);

      expect(mission1.priority).to.equal(1000); // N3 emergency
      expect(mission2.priority).to.equal(10);   // N1 regular
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await droneSecure.registerOperator(operator1.address, 10, 5, 2);
      await droneSecure.registerOperator(operator2.address, 10, 5, 2);
      await droneSecure.authorizeZone("ZONE_A");
      await droneSecure.authorizeZone("ZONE_B");
    });

    it("Should get all active missions", async function () {
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator2).startMission(0, "ZONE_A");

      const activeMissions = await droneSecure.getActiveMissions();
      expect(activeMissions.length).to.equal(2);
    });

    it("Should get active missions in specific zone", async function () {
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator1).startMission(0, "ZONE_B");
      await droneSecure.connect(operator2).startMission(0, "ZONE_A");

      const zoneAMissions = await droneSecure.getActiveMissionsInZone("ZONE_A");
      expect(zoneAMissions.length).to.equal(2);

      const zoneBMissions = await droneSecure.getActiveMissionsInZone("ZONE_B");
      expect(zoneBMissions.length).to.equal(1);
    });

    it("Should get total number of missions", async function () {
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");

      const total = await droneSecure.getTotalMissions();
      expect(total).to.equal(2);
    });
  });

  describe("Priority System", function () {
    beforeEach(async function () {
      await droneSecure.registerOperator(operator1.address, 10, 5, 2);
      await droneSecure.authorizeZone("ZONE_A");
    });

    it("Should assign correct priority levels", async function () {
      // N1 level
      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      const mission1 = await droneSecure.getMission(1);
      expect(mission1.priority).to.equal(10);

      // N2 level
      await droneSecure.connect(operator1).startMission(1, "ZONE_A");
      const mission2 = await droneSecure.getMission(2);
      expect(mission2.priority).to.equal(100);

      // N3 level (emergency medical)
      await droneSecure.connect(operator1).startMission(2, "ZONE_A");
      const mission3 = await droneSecure.getMission(3);
      expect(mission3.priority).to.equal(1000);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to register operators", async function () {
      await expect(
        droneSecure.connect(operator1).registerOperator(operator2.address, 10, 5, 2)
      ).to.be.reverted;
    });

    it("Should only allow owner to allocate slots", async function () {
      await droneSecure.registerOperator(operator1.address, 10, 5, 2);

      await expect(
        droneSecure.connect(operator1).allocateSlots(operator1.address, 0, 5)
      ).to.be.reverted;
    });

    it("Should only allow owner to authorize zones", async function () {
      await expect(
        droneSecure.connect(operator1).authorizeZone("ZONE_A")
      ).to.be.reverted;
    });

    it("Should only allow owner to record collisions", async function () {
      await droneSecure.registerOperator(operator1.address, 10, 5, 2);
      await droneSecure.registerOperator(operator2.address, 10, 5, 2);
      await droneSecure.authorizeZone("ZONE_A");

      await droneSecure.connect(operator1).startMission(0, "ZONE_A");
      await droneSecure.connect(operator2).startMission(0, "ZONE_A");

      await expect(
        droneSecure.connect(operator1).recordCollision(1, 2, "Collision")
      ).to.be.reverted;
    });
  });
});
