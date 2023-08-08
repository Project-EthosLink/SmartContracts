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

  it("Launching token should transfer total minted amount to the contract", async function () {
    const token = await ethers.deployContract("SocialTokens");
    const [owner, addr1] = await ethers.getSigners();
    await token.mintSocialToken(1000, "karthikeya", 10);
    const currentTokenId = await token.getCurrentTokenId();
    const price = ethers.parseEther("20");
    await token.launchSocialToken(currentTokenId, price);
    const tokenHolder = await token.socialTokenHolders(
      currentTokenId,
      owner.address
    );
    const holdingAmount = tokenHolder[2];
    const inputAmount = ethers.parseEther("0");
    expect(inputAmount).to.eq(holdingAmount);
  });
});

describe("Marketplace", function () {
  it("Buying a social token creates an new mapping and transfers the given amount of token", async function () {
    const token = await ethers.deployContract("SocialTokens");
    const [owner, addr1] = await ethers.getSigners();
    await token.connect(owner).mintSocialToken(1000, "karthikeya", 10);
    const currentTokenId = await token.getCurrentTokenId();
    const price = 2;
    await token.launchSocialToken(currentTokenId, price);
    await token.connect(addr1).getEthosLink();
    await token.connect(addr1).buySocialToken(currentTokenId, 1, owner.address);
    const buyer = await token.socialTokenHolders(currentTokenId, addr1.address);
    const holdingAmount = buyer[2];
    const inputAmount = 1;
    expect(inputAmount).to.eq(holdingAmount);
  });
});

describe("User", function () {
  it("User can get the EthosLink", async function () {
    const token = await ethers.deployContract("SocialTokens");
    const [owner, addr1] = await ethers.getSigners();
    await token.connect(owner).getEthosLink();
    const EthosLink = await token.EthosLink();
    const OwnerBalnace = await token.balanceOf(owner.address, EthosLink);
    const inputAmount = ethers.parseEther("100");
    expect(inputAmount).to.eq(OwnerBalnace);
  });

  it("User are able to list their hodling tokens", async function () {
    const token = await ethers.deployContract("SocialTokens");
    const [owner, addr1] = await ethers.getSigners();
    await token.connect(owner).mintSocialToken(1000, "karthikeya", 10);
    const currentTokenId = await token.getCurrentTokenId();
    const price = 2;
    await token.launchSocialToken(currentTokenId, price);
    await token.connect(addr1).getEthosLink();
    await token.connect(addr1).buySocialToken(currentTokenId, 1, owner.address);
    await token.connect(addr1).listTokens(1, currentTokenId, 10);
    const totalListed = await token.socialTokenHolders(
      currentTokenId,
      addr1.address
    );
    const listedAmount = totalListed[3];
    expect(1).to.eq(listedAmount);
  });

  it("User are able to unlist their hodling tokens", async function () {
    const token = await ethers.deployContract("SocialTokens");
    const [owner, addr1] = await ethers.getSigners();
    await token.connect(owner).mintSocialToken(1000, "karthikeya", 10);
    const currentTokenId = await token.getCurrentTokenId();
    const price = 2;
    await token.launchSocialToken(currentTokenId, price);
    await token.connect(addr1).getEthosLink();
    await token.connect(addr1).buySocialToken(currentTokenId, 1, owner.address);
    await token.connect(addr1).listTokens(1, currentTokenId, 10);
    await token.connect(addr1).withdrawTokens(1, currentTokenId);
    const totalListed = await token.socialTokenHolders(
      currentTokenId,
      addr1.address
    );
    const listedAmount = totalListed[3];
    expect(0).to.eq(listedAmount);
  }
  );
});
