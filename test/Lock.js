const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Deployment", function () {
  it("Deployment should assign 0 to the EthosLink", async function () {
    const token = await ethers.deployContract("SocialTokens");
    const EthosLink = await token.EthosLink();
    expect(0).to.equal(EthosLink);
  });
});

describe("Minting and Launching", function () {
  it("Minting msg.sender is the creator of the token", async function () {
    const token = await ethers.deployContract("SocialTokens");
    const [owner, addr1] = await ethers.getSigners();
    await token.mintSocialToken(
      ethers.parseEther("10"),
      "karthikeya",
      ethers.parseEther("10")
    );
    const currentTokenId = await token.getCurrentTokenId();
    const tokenMinted = await token.socialTokens(currentTokenId);
    const creator = tokenMinted[1];
    expect(owner.address).to.equal(creator);
  });

  it("Launching sends msg.sender tokens to the Contract and Currently Listed is total amount minted", async function () {
    const token = await ethers.deployContract("SocialTokens");
    const [owner, addr1] = await ethers.getSigners();
    await token.mintSocialToken(
      ethers.parseEther("10"),
      "karthikeya",
      ethers.parseEther("10")
    );
    const currentTokenId = await token.getCurrentTokenId();
    const price = ethers.parseEther("20");
    await token.launchSocialToken(currentTokenId, price);
    const tokenHolder = await token.socialTokenHolders(
      currentTokenId,
      owner.address
    );
    const currentlyListed = ethers.formatEther(tokenHolder[3]);
    expect(ethers.parseEther("10")).to.equal(currentlyListed);
  });
});
