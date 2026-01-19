const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("\n🔍 Listing all missions on the blockchain...\n");
  
  const DroneSecure = await hre.ethers.getContractAt("DroneSecure", CONTRACT_ADDRESS);
  
  // Get all accounts
  const [owner, addr1, addr2] = await hre.ethers.getSigners();
  
  console.log("📋 Checking missions for accounts:");
  console.log("Account #0:", owner.address);
  console.log("Account #1:", addr1.address);
  console.log("Account #2:", addr2.address);
  console.log("\n" + "=".repeat(80) + "\n");
  
  let totalMissions = 0;
  
  // Check first 20 token IDs
  for (let tokenId = 0; tokenId < 20; tokenId++) {
    try {
      const owner = await DroneSecure.ownerOf(tokenId);
      const mission = await DroneSecure.getMission(tokenId);
      const isTransferable = await DroneSecure.isTransferable(tokenId);
      
      totalMissions++;
      
      const levelNames = ["None", "Standard", "Express", "Urgence Médicale"];
      
      console.log(`🚁 Mission #${tokenId}`);
      console.log(`   Owner: ${owner}`);
      console.log(`   Level: ${levelNames[mission.level]} (${mission.level})`);
      console.log(`   IPFS CID: ${mission.ipfsCID}`);
      console.log(`   Creator: ${mission.creator}`);
      console.log(`   Created At: ${new Date(Number(mission.createdAt) * 1000).toLocaleString()}`);
      console.log(`   Transferable: ${isTransferable ? "✅ Yes" : "🔒 No"}`);
      console.log(`   Previous Owners: ${mission.previousOwners.length}`);
      console.log("");
      
    } catch (error) {
      // Token doesn't exist, skip silently
      if (totalMissions > 0 && tokenId > totalMissions + 5) {
        // Stop searching after 5 consecutive non-existent tokens
        break;
      }
    }
  }
  
  console.log("=".repeat(80));
  console.log(`\n✅ Total missions found: ${totalMissions}\n`);
  
  // Check mission count per account
  console.log("📊 Mission count per account:");
  console.log(`   Account #0: ${await DroneSecure.getUserMissionCount(owner.address)}`);
  console.log(`   Account #1: ${await DroneSecure.getUserMissionCount(addr1.address)}`);
  console.log(`   Account #2: ${await DroneSecure.getUserMissionCount(addr2.address)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
