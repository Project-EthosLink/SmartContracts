//SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract SocialTokens is ERC1155URIStorage, ERC1155Holder {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;
    uint public EthosLink;
    address owner;

    struct SocialToken {
        uint tokenID;
        address creator;
        string URI;
        bool isLaunched;
        uint launchingPrice;
        uint totalAmount;
        uint currentlyListedAmount;
        uint resaleRoyaltyPercentage;
    }

    struct SocialTokenHolder {
        uint tokenID;
        address holder;
        uint holdingAmount;
        uint listedAmount;
        uint priceByHolder;
        uint priceAtHolderBought;
    }

    mapping(uint => mapping(address => SocialTokenHolder))
        public socialTokenHolders;
    mapping(uint => SocialToken) public socialTokens;

    event SocialTokenMinted(
        uint id,
        address owner,
        uint amount,
        uint resaleRoyaltyPercentage
    );
    event SocialTokenLaunched(uint id, address owner, uint price);
    event SocialTokenBought(
        uint id,
        address owner,
        address buyer,
        uint amount,
        uint price
    );
    event SocialTokenUnlisted(uint id, address owner, uint amount);
    event SocialTokenListed(uint id, address owner, uint amount, uint price);

    constructor() ERC1155("") {
        owner = msg.sender;
        EthosLink = tokenIds.current();
    }

    function getCurrentTokenId() public view returns (uint) {
        return tokenIds.current();
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, ERC1155Receiver) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function mintSocialToken(
        uint amount,
        string memory URI,
        uint resaleRoyaltyPercentage
    ) public {
        tokenIds.increment();
        uint256 _id = tokenIds.current();
        _mint(msg.sender, _id, amount, "");
        socialTokens[_id] = SocialToken(
            _id,
            msg.sender,
            URI,
            false,
            0,
            amount,
            0,
            resaleRoyaltyPercentage
        );
        emit SocialTokenMinted(
            _id,
            msg.sender,
            amount,
            resaleRoyaltyPercentage
        );
    }

    function launchSocialToken(uint _id, uint _price) public {
        require(
            socialTokens[_id].creator == msg.sender,
            "You are not the creator of this token"
        );
        require(
            socialTokens[_id].isLaunched == false,
            "This token is already launched"
        );
        socialTokens[_id].isLaunched = true;
        socialTokens[_id].launchingPrice = _price;
        socialTokens[_id].currentlyListedAmount = socialTokens[_id].totalAmount;
        socialTokenHolders[_id][msg.sender] = SocialTokenHolder(
            _id,
            msg.sender,
            0,
            socialTokens[_id].totalAmount,
            _price,
            0
        );
        _safeTransferFrom(
            msg.sender,
            address(this),
            _id,
            socialTokens[_id].totalAmount,
            ""
        );
        emit SocialTokenLaunched(_id, msg.sender, _price);
    }

    function buySocialToken(
        uint _id,
        uint _amount,
        address _seller
    ) public payable {
        require(
            socialTokens[_id].isLaunched == true,
            "This token is not launched"
        );
        require(
            socialTokenHolders[_id][_seller].listedAmount >= _amount,
            "Seller does not have enough tokens"
        );
        require(
            balanceOf(msg.sender, EthosLink) >=
                socialTokenHolders[_id][_seller].priceByHolder * _amount
        );
        if (socialTokenHolders[_id][msg.sender].tokenID != _id) {
            socialTokenHolders[_id][msg.sender] = SocialTokenHolder(
                _id,
                msg.sender,
                _amount,
                0,
                0,
                socialTokenHolders[_id][_seller].priceByHolder
            );
        } else {
            socialTokenHolders[_id][msg.sender].holdingAmount += _amount;
        }
        socialTokens[_id].currentlyListedAmount -= _amount;
        socialTokenHolders[_id][_seller].listedAmount -= _amount;
        _safeTransferFrom(address(this), msg.sender, _id, _amount, "");
        _safeTransferFrom(
            msg.sender,
            _seller,
            EthosLink,
            socialTokenHolders[_id][_seller].priceByHolder * _amount,
            ""
        );
        if (msg.sender != socialTokens[_id].creator) {
            uint royalty = ((socialTokenHolders[_id][_seller].priceByHolder *
                _amount) * socialTokens[_id].resaleRoyaltyPercentage) / 100;
            _safeTransferFrom(
                _seller,
                socialTokens[_id].creator,
                EthosLink,
                royalty,
                ""
            );
        }
        emit SocialTokenBought(
            _id,
            _seller,
            msg.sender,
            _amount,
            socialTokenHolders[_id][_seller].priceByHolder
        );
    }

    function listTokens(uint _amount, uint _id, uint _price) public {
        require(
            socialTokenHolders[_id][msg.sender].holdingAmount >= _amount,
            "You do not have enough tokens"
        );
        _safeTransferFrom(msg.sender, address(this), _id, _amount, "");
        socialTokenHolders[_id][msg.sender].holdingAmount -= _amount;
        socialTokenHolders[_id][msg.sender].listedAmount += _amount;
        socialTokenHolders[_id][msg.sender].priceByHolder = _price;
        socialTokens[_id].currentlyListedAmount += _amount;
        emit SocialTokenListed(_id, msg.sender, _amount, _price);
    }

    function withdrawTokens(uint _amount, uint _id) public {
        require(
            socialTokenHolders[_id][msg.sender].listedAmount >= _amount,
            "You do not have tokens listed"
        );
        _safeTransferFrom(address(this), msg.sender, _id, _amount, "");
        socialTokenHolders[_id][msg.sender].listedAmount -= _amount;
        socialTokens[_id].currentlyListedAmount -= _amount;
        emit SocialTokenUnlisted(_id, msg.sender, _amount);
    }
}
