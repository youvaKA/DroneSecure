const hre = require("hardhat");

async function main() {
  console.log("Deploying DroneSecure contract...");

  const DroneSecure = await hre.ethers.getContractFactory("DroneSecure");
  const droneSecure = await DroneSecure.deploy();

  await droneSecure.waitForDeployment();

  const address = await droneSecure.getAddress();
  console.log("DroneSecure deployed to:", address);
  
  console.log("\nContract Configuration:");
  console.log("- Max Missions Per User:", await droneSecure.MAX_MISSIONS_PER_USER());
  console.log("- Cooldown Period:", await droneSecure.COOLDOWN_PERIOD(), "seconds (5 minutes)");
  console.log("- Lock Period:", await droneSecure.LOCK_PERIOD(), "seconds (10 minutes)");
  console.log("- Swap Ratio:", await droneSecure.SWAP_RATIO(), "Standard tokens for 1 Medical Urgency");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
