// SPDX-License-Identifier: MIT
// Example usage of DroneSecure contract

const hre = require("hardhat");

async function main() {
  // Get signers (accounts)
  const [owner, operator1, operator2] = await hre.ethers.getSigners();

  console.log("=== DroneSecure Usage Example ===\n");

  // Deploy the contract
  console.log("1. Deploying DroneSecure contract...");
  const DroneSecure = await hre.ethers.getContractFactory("DroneSecure");
  const droneSecure = await DroneSecure.deploy();
  await droneSecure.waitForDeployment();
  const contractAddress = await droneSecure.getAddress();
  console.log(`   Contract deployed at: ${contractAddress}\n`);

  // Authorize zones
  console.log("2. Authorizing flight zones...");
  await droneSecure.authorizeZone("ZONE_A");
  await droneSecure.authorizeZone("ZONE_B");
  console.log("   Zones ZONE_A and ZONE_B authorized\n");

  // Register operators
  console.log("3. Registering operators...");
  await droneSecure.registerOperator(
    operator1.address,
    10, // 10 N1 slots
    5,  // 5 N2 slots
    2   // 2 N3 slots
  );
  console.log(`   Operator 1 registered: ${operator1.address}`);
  
  await droneSecure.registerOperator(
    operator2.address,
    8,  // 8 N1 slots
    4,  // 4 N2 slots
    1   // 1 N3 slot
  );
  console.log(`   Operator 2 registered: ${operator2.address}\n`);

  // Start missions
  console.log("4. Starting missions...");
  
  // Operator 1 starts N1 mission
  const tx1 = await droneSecure.connect(operator1).startMission(0, "ZONE_A");
  await tx1.wait();
  console.log("   Operator 1: N1 mission started in ZONE_A (Mission ID: 1)");

  // Operator 1 starts N2 mission
  const tx2 = await droneSecure.connect(operator1).startMission(1, "ZONE_A");
  await tx2.wait();
  console.log("   Operator 1: N2 mission started in ZONE_A (Mission ID: 2)");

  // Operator 2 starts N3 emergency mission (highest priority)
  const tx3 = await droneSecure.connect(operator2).startMission(2, "ZONE_B");
  await tx3.wait();
  console.log("   Operator 2: N3 emergency mission started in ZONE_B (Mission ID: 3)\n");

  // Check operator status
  console.log("5. Checking operator status...");
  const op1Info = await droneSecure.getOperator(operator1.address);
  console.log(`   Operator 1: ${op1Info.activeMissions} active missions, ${op1Info.n1Slots} N1 slots, ${op1Info.n2Slots} N2 slots`);
  
  const op2Info = await droneSecure.getOperator(operator2.address);
  console.log(`   Operator 2: ${op2Info.activeMissions} active missions, ${op2Info.n3Slots} N3 slots\n`);

  // Exchange slots (subcontracting)
  console.log("6. Exchanging slots (2 N1 → 1 N2)...");
  await droneSecure.connect(operator1).exchangeN1ForN2(1);
  const op1AfterExchange = await droneSecure.getOperator(operator1.address);
  console.log(`   Operator 1 after exchange: ${op1AfterExchange.n1Slots} N1 slots, ${op1AfterExchange.n2Slots} N2 slots\n`);

  // Complete a mission
  console.log("7. Completing mission...");
  await droneSecure.connect(operator1).completeMission(1);
  console.log("   Mission 1 completed (slot returned)\n");

  // Check active missions
  console.log("8. Active missions in ZONE_A...");
  const activeMissions = await droneSecure.getActiveMissionsInZone("ZONE_A");
  console.log(`   Active missions in ZONE_A: ${activeMissions.length} (IDs: ${activeMissions.join(", ")})\n`);

  // Check mission details
  console.log("9. Mission details...");
  const mission3 = await droneSecure.getMission(3);
  console.log(`   Mission 3 (Emergency):`);
  console.log(`   - Operator: ${mission3.operator}`);
  console.log(`   - Level: N${mission3.level === 0n ? "1" : mission3.level === 1n ? "2" : "3"}`);
  console.log(`   - Zone: ${mission3.zone}`);
  console.log(`   - Priority: ${mission3.priority} (N3 = highest)\n`);

  // Record a collision scenario
  console.log("10. Simulating collision recording...");
  // Start another mission in ZONE_B
  await droneSecure.connect(operator1).startMission(0, "ZONE_B");
  // Record collision between mission 3 and 4
  await droneSecure.recordCollision(
    3,
    4,
    "Collision detected at coordinates X:48.8566, Y:2.3522 at altitude 50m"
  );
  console.log("    Collision recorded in immutable flight history\n");

  // Check flight history
  console.log("11. Flight history entries...");
  const totalHistory = await droneSecure.getTotalHistoryEntries();
  console.log(`    Total history entries: ${totalHistory}`);
  
  // Get collision history entry
  const historyEntry = await droneSecure.getFlightHistory(5);
  console.log(`    History entry 5:`);
  console.log(`    - Event type: ${historyEntry.eventType}`);
  console.log(`    - Mission ID: ${historyEntry.missionId}`);
  console.log(`    - Details: ${historyEntry.details}\n`);

  console.log("=== Example completed successfully! ===");
  console.log("\nKey takeaways:");
  console.log("✓ Blockchain acts as immutable 'black box' for flight history");
  console.log("✓ Priority system ensures emergency missions (N3) have highest priority");
  console.log("✓ Operators can exchange slots for flexibility (2 N1 ↔ 1 N2)");
  console.log("✓ Maximum 4 simultaneous missions per operator enforced");
  console.log("✓ Collision history is unfalsifiable and verifiable by third parties");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
