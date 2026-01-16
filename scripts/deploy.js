const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

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

  // Save contract address for frontend
  const contractConfig = {
    address: address,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  const configPath = path.join(__dirname, "../frontend/src/utils/contract-config.json");
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(contractConfig, null, 2));
  
  console.log("\n✅ Contract address saved to frontend/src/utils/contract-config.json");
  console.log("\n📝 Next steps:");
  console.log("1. cd frontend");
  console.log("2. npm install");
  console.log("3. npm run dev");
  console.log("\n🌐 Open http://localhost:3000 in your browser");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
