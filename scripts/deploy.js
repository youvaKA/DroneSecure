const hre = require("hardhat");

async function main() {
  console.log("Deploying DroneSecure contract...");

  const DroneSecure = await hre.ethers.getContractFactory("DroneSecure");
  const droneSecure = await DroneSecure.deploy();

  await droneSecure.waitForDeployment();

  const address = await droneSecure.getAddress();
  console.log(`DroneSecure deployed to: ${address}`);

  // Initial setup
  console.log("\nSetting up initial configuration...");

  // Authorize some example zones
  const zones = ["ZONE_A", "ZONE_B", "ZONE_C"];
  for (const zone of zones) {
    await droneSecure.authorizeZone(zone);
    console.log(`Authorized zone: ${zone}`);
  }

  console.log("\nDeployment complete!");
  console.log("\nContract address:", address);
  console.log("\nNext steps:");
  console.log("1. Register operators using: registerOperator(address, n1Slots, n2Slots, n3Slots)");
  console.log("2. Operators can start missions using: startMission(level, zone)");
  console.log("3. Exchange slots using: exchangeN1ForN2(amount) or exchangeN2ForN1(amount)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
