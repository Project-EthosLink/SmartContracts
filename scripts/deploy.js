const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const token = await ethers.deployContract("SocialTokens");
  await token.waitForDeployment();
  console.log("SocialTokens deployed to:", token.target);
  await sleep(4000);

  //verify contract
  await hre.run("verify:verify", {
    address: token.target,
    constructorArguments: [],
  });
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
