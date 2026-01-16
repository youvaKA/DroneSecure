const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DroneSecure", function () {
  let droneSecure;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  
  const IPFS_CID_1 = "QmP7hdxcUCjC5aM6ZgcRvSgMPP9HjL1F9Zr2xVZ1MqQ8Lh";
  const IPFS_CID_2 = "QmT8hdxcUCjC5aM6ZgcRvSgMPP9HjL1F9Zr2xVZ1MqQ8Li";
  const IPFS_CID_3 = "QmX9hdxcUCjC5aM6ZgcRvSgMPP9HjL1F9Zr2xVZ1MqQ8Lj";
  
  const ResourceLevel = {
    None: 0,
    Standard: 1,
    Express: 2,
    MedicalUrgency: 3
  };

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    const DroneSecure = await ethers.getContractFactory("DroneSecure");
    droneSecure = await DroneSecure.deploy();
    await droneSecure.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await droneSecure.name()).to.equal("DroneSecure Mission");
      expect(await droneSecure.symbol()).to.equal("DSM");
    });

    it("Should set the right owner", async function () {
      expect(await droneSecure.owner()).to.equal(owner.address);
    });

    it("Should have correct constants", async function () {
      expect(await droneSecure.MAX_MISSIONS_PER_USER()).to.equal(4);
      expect(await droneSecure.COOLDOWN_PERIOD()).to.equal(300); // 5 minutes
      expect(await droneSecure.LOCK_PERIOD()).to.equal(600); // 10 minutes
      expect(await droneSecure.SWAP_RATIO()).to.equal(3);
    });
  });

  describe("Mission Creation", function () {
    it("Should create a mission successfully", async function () {
      await expect(droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1))
        .to.emit(droneSecure, "MissionCreated")
        .withArgs(0, addr1.address, ResourceLevel.Standard, IPFS_CID_1);
      
      const mission = await droneSecure.getMission(0);
      expect(mission.level).to.equal(ResourceLevel.Standard);
      expect(mission.ipfsCID).to.equal(IPFS_CID_1);
      expect(mission.creator).to.equal(addr1.address);
      
      expect(await droneSecure.ownerOf(0)).to.equal(addr1.address);
      expect(await droneSecure.userMissionCount(addr1.address)).to.equal(1);
    });

    it("Should create missions with different resource levels", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      await time.increase(300); // Wait for cooldown
      await droneSecure.connect(addr1).createMission(ResourceLevel.Express, IPFS_CID_2);
      await time.increase(300);
      await droneSecure.connect(addr1).createMission(ResourceLevel.MedicalUrgency, IPFS_CID_3);
      
      expect((await droneSecure.getMission(0)).level).to.equal(ResourceLevel.Standard);
      expect((await droneSecure.getMission(1)).level).to.equal(ResourceLevel.Express);
      expect((await droneSecure.getMission(2)).level).to.equal(ResourceLevel.MedicalUrgency);
    });

    it("Should fail to create mission with invalid resource level", async function () {
      await expect(
        droneSecure.connect(addr1).createMission(ResourceLevel.None, IPFS_CID_1)
      ).to.be.revertedWith("Invalid resource level");
    });

    it("Should fail to create mission with empty IPFS CID", async function () {
      await expect(
        droneSecure.connect(addr1).createMission(ResourceLevel.Standard, "")
      ).to.be.revertedWith("IPFS CID cannot be empty");
    });
  });

  describe("Mission Limit (4 missions max)", function () {
    it("Should allow creating up to 4 missions", async function () {
      for (let i = 0; i < 4; i++) {
        await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
        await time.increase(300); // Wait for cooldown
      }
      
      expect(await droneSecure.userMissionCount(addr1.address)).to.equal(4);
    });

    it("Should fail to create more than 4 missions", async function () {
      for (let i = 0; i < 4; i++) {
        await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
        await time.increase(300);
      }
      
      await expect(
        droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1)
      ).to.be.revertedWith("Maximum missions limit reached");
    });

    it("Should allow creating new mission after transferring one", async function () {
      // Create 4 missions
      for (let i = 0; i < 4; i++) {
        await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
        await time.increase(300);
      }
      
      // Wait for lock period and transfer one
      await time.increase(600);
      await droneSecure.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      
      expect(await droneSecure.userMissionCount(addr1.address)).to.equal(3);
      
      // Should be able to create another mission
      await time.increase(300);
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      expect(await droneSecure.userMissionCount(addr1.address)).to.equal(4);
    });
  });

  describe("Cooldown Period (5 minutes)", function () {
    it("Should fail to create two missions consecutively", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      await expect(
        droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_2)
      ).to.be.revertedWith("Cooldown period not elapsed");
    });

    it("Should allow creating mission after cooldown period", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      await time.increase(300); // 5 minutes
      
      await expect(
        droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_2)
      ).to.emit(droneSecure, "MissionCreated");
    });

    it("Should return correct cooldown remaining time", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      let remaining = await droneSecure.cooldownRemaining(addr1.address);
      expect(remaining).to.be.closeTo(300, 5); // Around 300 seconds
      
      await time.increase(150);
      remaining = await droneSecure.cooldownRemaining(addr1.address);
      expect(remaining).to.be.closeTo(150, 5);
      
      await time.increase(150);
      remaining = await droneSecure.cooldownRemaining(addr1.address);
      expect(remaining).to.equal(0);
    });

    it("Should check if user can create mission", async function () {
      expect(await droneSecure.canCreateMission(addr1.address)).to.be.true;
      
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      expect(await droneSecure.canCreateMission(addr1.address)).to.be.false;
      
      await time.increase(300);
      expect(await droneSecure.canCreateMission(addr1.address)).to.be.true;
    });
  });

  describe("Transfer Lock (10 minutes)", function () {
    it("Should fail to transfer mission within lock period", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      await expect(
        droneSecure.connect(addr1).transferFrom(addr1.address, addr2.address, 0)
      ).to.be.revertedWith("Token is locked for 10 minutes after creation");
    });

    it("Should allow transfer after lock period", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      await time.increase(600); // 10 minutes
      
      await expect(
        droneSecure.connect(addr1).transferFrom(addr1.address, addr2.address, 0)
      ).to.not.be.reverted;
      
      expect(await droneSecure.ownerOf(0)).to.equal(addr2.address);
      expect(await droneSecure.userMissionCount(addr1.address)).to.equal(0);
      expect(await droneSecure.userMissionCount(addr2.address)).to.equal(1);
    });

    it("Should check if token is transferable", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      expect(await droneSecure.isTransferable(0)).to.be.false;
      
      await time.increase(600);
      expect(await droneSecure.isTransferable(0)).to.be.true;
    });

    it("Should fail transfer if recipient exceeds mission limit", async function () {
      // addr2 creates 4 missions
      for (let i = 0; i < 4; i++) {
        await droneSecure.connect(addr2).createMission(ResourceLevel.Standard, IPFS_CID_1);
        await time.increase(300);
      }
      
      // addr1 creates 1 mission
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      await time.increase(600);
      
      // Transfer should fail because addr2 already has 4 missions
      await expect(
        droneSecure.connect(addr1).transferFrom(addr1.address, addr2.address, 4)
      ).to.be.revertedWith("Recipient mission limit reached");
    });
  });

  describe("Resource Swap (3 Standard → 1 Medical Urgency)", function () {
    beforeEach(async function () {
      // Create 3 Standard missions
      for (let i = 0; i < 3; i++) {
        await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
        await time.increase(300);
      }
    });

    it("Should swap 3 Standard tokens for 1 Medical Urgency token", async function () {
      expect(await droneSecure.userMissionCount(addr1.address)).to.equal(3);
      
      await expect(
        droneSecure.connect(addr1).swapResources([0, 1, 2], IPFS_CID_3)
      ).to.emit(droneSecure, "ResourceSwapped")
        .withArgs(addr1.address, [0, 1, 2], 3);
      
      expect(await droneSecure.userMissionCount(addr1.address)).to.equal(1);
      
      const newMission = await droneSecure.getMission(3);
      expect(newMission.level).to.equal(ResourceLevel.MedicalUrgency);
      expect(await droneSecure.ownerOf(3)).to.equal(addr1.address);
      
      // Old tokens should be burned
      await expect(droneSecure.ownerOf(0)).to.be.reverted;
      await expect(droneSecure.ownerOf(1)).to.be.reverted;
      await expect(droneSecure.ownerOf(2)).to.be.reverted;
    });

    it("Should fail swap with wrong number of tokens", async function () {
      await expect(
        droneSecure.connect(addr1).swapResources([0, 1], IPFS_CID_3)
      ).to.be.revertedWith("Must provide exactly 3 tokens");
      
      await expect(
        droneSecure.connect(addr1).swapResources([0, 1, 2, 0], IPFS_CID_3)
      ).to.be.revertedWith("Must provide exactly 3 tokens");
    });

    it("Should fail swap if not owner of tokens", async function () {
      await expect(
        droneSecure.connect(addr2).swapResources([0, 1, 2], IPFS_CID_3)
      ).to.be.revertedWith("Not owner of token");
    });

    it("Should fail swap with non-Standard level tokens", async function () {
      // Create an Express mission
      await droneSecure.connect(addr1).createMission(ResourceLevel.Express, IPFS_CID_2);
      await time.increase(300);
      
      await expect(
        droneSecure.connect(addr1).swapResources([0, 1, 3], IPFS_CID_3)
      ).to.be.revertedWith("Token must be Standard level");
    });

    it("Should apply lock period to swapped token", async function () {
      await droneSecure.connect(addr1).swapResources([0, 1, 2], IPFS_CID_3);
      
      expect(await droneSecure.isTransferable(3)).to.be.false;
      
      await time.increase(600);
      expect(await droneSecure.isTransferable(3)).to.be.true;
    });
  });

  describe("IPFS Integration", function () {
    it("Should store IPFS CID correctly", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      const mission = await droneSecure.getMission(0);
      expect(mission.ipfsCID).to.equal(IPFS_CID_1);
      
      const tokenURI = await droneSecure.tokenURI(0);
      expect(tokenURI).to.equal(IPFS_CID_1);
    });

    it("Should handle different IPFS CIDs", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      await time.increase(300);
      await droneSecure.connect(addr1).createMission(ResourceLevel.Express, IPFS_CID_2);
      
      expect((await droneSecure.getMission(0)).ipfsCID).to.equal(IPFS_CID_1);
      expect((await droneSecure.getMission(1)).ipfsCID).to.equal(IPFS_CID_2);
    });
  });

  describe("Mission Information", function () {
    it("Should return complete mission information", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Express, IPFS_CID_1);
      
      const mission = await droneSecure.getMission(0);
      expect(mission.tokenId).to.equal(0);
      expect(mission.level).to.equal(ResourceLevel.Express);
      expect(mission.ipfsCID).to.equal(IPFS_CID_1);
      expect(mission.creator).to.equal(addr1.address);
      expect(mission.createdAt).to.be.gt(0);
      expect(mission.lockedUntil).to.equal(mission.createdAt + 600n);
    });

    it("Should fail to get non-existent mission", async function () {
      await expect(
        droneSecure.getMission(999)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should return correct user mission count", async function () {
      expect(await droneSecure.getUserMissionCount(addr1.address)).to.equal(0);
      
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      expect(await droneSecure.getUserMissionCount(addr1.address)).to.equal(1);
      
      await time.increase(300);
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_2);
      expect(await droneSecure.getUserMissionCount(addr1.address)).to.equal(2);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple users independently", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      await droneSecure.connect(addr2).createMission(ResourceLevel.Express, IPFS_CID_2);
      
      expect(await droneSecure.userMissionCount(addr1.address)).to.equal(1);
      expect(await droneSecure.userMissionCount(addr2.address)).to.equal(1);
      
      expect(await droneSecure.ownerOf(0)).to.equal(addr1.address);
      expect(await droneSecure.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should not affect cooldown between different users", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      // addr2 should be able to create immediately
      await expect(
        droneSecure.connect(addr2).createMission(ResourceLevel.Standard, IPFS_CID_2)
      ).to.not.be.reverted;
    });

    it("Should correctly track missions across transfers", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      await time.increase(900);
      
      await droneSecure.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      
      expect(await droneSecure.userMissionCount(addr1.address)).to.equal(0);
      expect(await droneSecure.userMissionCount(addr2.address)).to.equal(1);
      
      // addr2 should still see the mission details
      const mission = await droneSecure.getMission(0);
      expect(mission.creator).to.equal(addr1.address); // Original creator unchanged
      expect(await droneSecure.ownerOf(0)).to.equal(addr2.address);
    });
  });

  describe("Previous Owners Tracking", function () {
    it("Should have empty previousOwners on creation", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      const previousOwners = await droneSecure.getPreviousOwners(0);
      expect(previousOwners.length).to.equal(0);
    });

    it("Should track previous owners after transfer", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      await time.increase(600); // Wait for lock period
      
      await droneSecure.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      
      const previousOwners = await droneSecure.getPreviousOwners(0);
      expect(previousOwners.length).to.equal(1);
      expect(previousOwners[0]).to.equal(addr1.address);
    });

    it("Should track multiple previous owners", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      await time.increase(600);
      
      // Transfer from addr1 to addr2
      await droneSecure.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      await time.increase(600);
      
      // Transfer from addr2 to addr3
      await droneSecure.connect(addr2).transferFrom(addr2.address, addr3.address, 0);
      
      const previousOwners = await droneSecure.getPreviousOwners(0);
      expect(previousOwners.length).to.equal(2);
      expect(previousOwners[0]).to.equal(addr1.address);
      expect(previousOwners[1]).to.equal(addr2.address);
    });

    it("Should not track previous owner if transfer fails", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      // Try to transfer before lock period ends (should fail)
      await expect(
        droneSecure.connect(addr1).transferFrom(addr1.address, addr2.address, 0)
      ).to.be.reverted;
      
      const previousOwners = await droneSecure.getPreviousOwners(0);
      expect(previousOwners.length).to.equal(0);
    });

    it("Should fail to get previous owners for non-existent token", async function () {
      await expect(
        droneSecure.getPreviousOwners(999)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Last Transfer Timestamp Tracking", function () {
    it("Should set lastTransferAt to createdAt on creation", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      const mission = await droneSecure.getMission(0);
      expect(mission.lastTransferAt).to.equal(mission.createdAt);
      
      const lastTransferAt = await droneSecure.getLastTransferAt(0);
      expect(lastTransferAt).to.equal(mission.createdAt);
    });

    it("Should update lastTransferAt on transfer", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      const mission = await droneSecure.getMission(0);
      const originalTransferTime = mission.lastTransferAt;
      
      await time.increase(600);
      
      await droneSecure.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      
      const updatedMission = await droneSecure.getMission(0);
      expect(updatedMission.lastTransferAt).to.be.gt(originalTransferTime);
    });

    it("Should track lastTransferAt across multiple transfers", async function () {
      await droneSecure.connect(addr1).createMission(ResourceLevel.Standard, IPFS_CID_1);
      
      await time.increase(600);
      await droneSecure.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      const firstTransferTime = (await droneSecure.getMission(0)).lastTransferAt;
      
      await time.increase(600);
      await droneSecure.connect(addr2).transferFrom(addr2.address, addr3.address, 0);
      const secondTransferTime = (await droneSecure.getMission(0)).lastTransferAt;
      
      expect(secondTransferTime).to.be.gt(firstTransferTime);
    });

    it("Should fail to get lastTransferAt for non-existent token", async function () {
      await expect(
        droneSecure.getLastTransferAt(999)
      ).to.be.revertedWith("Token does not exist");
    });
  });
});
