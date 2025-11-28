// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title ItemTradingNFT
 * @dev NFT contract for game items with atomic trading functionality
 * Each item has a unique hash (from game DB) mapped to an NFT tokenId
 */
contract ItemTradingNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Mapping from itemHash (64 char hex from DB) to NFT tokenId
    mapping(bytes32 => uint256) public itemHashToTokenId;
    
    // Mapping from tokenId to itemHash
    mapping(uint256 => bytes32) public tokenIdToItemHash;
    
    // Track if an item has been minted
    mapping(bytes32 => bool) public itemMinted;
    // Prevent replay of off-chain seller signatures used for buyer-initiated trades
    mapping(bytes32 => bool) public usedSignatures;

    // Events for tracking on-chain activities
    event ItemMinted(
        uint256 indexed tokenId,
        bytes32 indexed itemHash,
        address indexed owner,
        string itemName,
        string tier
    );

    event ItemTraded(
        uint256 indexed sellerTokenId,
        uint256 indexed buyerTokenId,
        bytes32 sellerItemHash,
        bytes32 buyerItemHash,
        address indexed seller,
        address buyer,
        uint256 timestamp
    );

    event ItemListed(
        uint256 indexed tokenId,
        bytes32 indexed itemHash,
        address indexed seller,
        uint256 listingId
    );

    event ItemUnlisted(
        uint256 indexed tokenId,
        bytes32 indexed itemHash,
        address indexed seller
    );

    constructor() ERC721("GameItemNFT", "GITEM") {}

    using ECDSA for bytes32;

    /**
     * @dev Mint a new NFT for a game item
     * @param to Address that will own the NFT
     * @param itemHash Unique hash from game database (64 hex chars)
     * @param itemName Human-readable item name
     * @param tier Item rarity tier (Common, Rare, Legendary)
    * @param _tokenURI Metadata URI (could point to IPFS or centralized storage)    
     */
    function mintItem(
        address to,
        bytes32 itemHash,
        string memory itemName,
        string memory tier,
        string memory _tokenURI
    ) public onlyOwner returns (uint256) {
        require(!itemMinted[itemHash], "Item already minted");
        require(to != address(0), "Cannot mint to zero address");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);

        itemHashToTokenId[itemHash] = newTokenId;
        tokenIdToItemHash[newTokenId] = itemHash;
        itemMinted[itemHash] = true;

        emit ItemMinted(newTokenId, itemHash, to, itemName, tier);

        return newTokenId;
    }

    /**
     * @dev Atomic swap of two NFTs between seller and buyer
     * Both items must exist and be owned by respective parties
     * This is called by the contract owner (backend) after DB validation
     * @param sellerItemHash Hash of seller's item
     * @param buyerItemHash Hash of buyer's item
     * @param seller Address of seller
     * @param buyer Address of buyer
     */
    function executeTrade(
        bytes32 sellerItemHash,
        bytes32 buyerItemHash,
        address seller,
        address buyer
    ) public onlyOwner {
        require(seller != address(0) && buyer != address(0), "Invalid addresses");
        require(seller != buyer, "Cannot trade with self");

        uint256 sellerTokenId = itemHashToTokenId[sellerItemHash];
        uint256 buyerTokenId = itemHashToTokenId[buyerItemHash];

        require(sellerTokenId != 0, "Seller item not minted");
        require(buyerTokenId != 0, "Buyer item not minted");
        require(ownerOf(sellerTokenId) == seller, "Seller doesn't own item");
        require(ownerOf(buyerTokenId) == buyer, "Buyer doesn't own item");

        // Perform atomic swap
        _transfer(seller, buyer, sellerTokenId);
        _transfer(buyer, seller, buyerTokenId);

        emit ItemTraded(
            sellerTokenId,
            buyerTokenId,
            sellerItemHash,
            buyerItemHash,
            seller,
            buyer,
            block.timestamp
        );
    }

    /**
     * @dev Buyer-initiated trade where seller provides an off-chain signature approving the specific trade payload.
     * Buyer must call this function (msg.sender == buyer). The contract verifies the seller signature
     * and performs the atomic swap. This lets the buyer submit the on-chain transaction and pay gas.
     * Seller signs: (sellerItemHash, listingId, timestamp, contractAddress) at listing creation time.
     */
    function executeTradeByParticipants(
        bytes32 sellerItemHash,
        bytes32 buyerItemHash,
        address seller,
        address buyer,
        bytes memory sellerSignature,
        uint256 listingId,
        uint256 timestamp
    ) public {
        require(buyer != address(0) && seller != address(0), "Invalid addresses");
        require(buyer == msg.sender, "Only buyer may call this");
        require(seller != buyer, "Cannot trade with self");

        // Recreate the signed message - seller only signs their listing details (not buyer-specific)
        bytes32 message = keccak256(abi.encodePacked(sellerItemHash, listingId, timestamp, address(this)));
        require(!usedSignatures[message], "Signature already used");

        address recovered = message.toEthSignedMessageHash().recover(sellerSignature);
        require(recovered == seller, "Invalid seller signature");

        uint256 sellerTokenId = itemHashToTokenId[sellerItemHash];
        uint256 buyerTokenId = itemHashToTokenId[buyerItemHash];

        require(sellerTokenId != 0, "Seller item not minted");
        require(buyerTokenId != 0, "Buyer item not minted");
        require(ownerOf(sellerTokenId) == seller, "Seller doesn't own item");
        require(ownerOf(buyerTokenId) == buyer, "Buyer doesn't own item");

        // mark signature used before performing transfers
        usedSignatures[message] = true;

        _transfer(seller, buyer, sellerTokenId);
        _transfer(buyer, seller, buyerTokenId);

        emit ItemTraded(
            sellerTokenId,
            buyerTokenId,
            sellerItemHash,
            buyerItemHash,
            seller,
            buyer,
            block.timestamp
        );
    }

    /**
     * @dev Record listing event on-chain (doesn't transfer ownership)
     */
    function recordListing(
        bytes32 itemHash,
        address seller,
        uint256 listingId
    ) public onlyOwner {
        uint256 tokenId = itemHashToTokenId[itemHash];
        require(tokenId != 0, "Item not minted");
        require(ownerOf(tokenId) == seller, "Seller doesn't own item");

        emit ItemListed(tokenId, itemHash, seller, listingId);
    }

    /**
     * @dev Record unlisting event on-chain
     */
    function recordUnlisting(
        bytes32 itemHash,
        address seller
    ) public onlyOwner {
        uint256 tokenId = itemHashToTokenId[itemHash];
        require(tokenId != 0, "Item not minted");
        
        emit ItemUnlisted(tokenId, itemHash, seller);
    }

    /**
     * @dev Check if an item has been minted as NFT
     */
    function isItemMinted(bytes32 itemHash) public view returns (bool) {
        return itemMinted[itemHash];
    }

    /**
     * @dev Get tokenId for an item hash
     */
    function getTokenId(bytes32 itemHash) public view returns (uint256) {
        require(itemMinted[itemHash], "Item not minted");
        return itemHashToTokenId[itemHash];
    }

    /**
     * @dev Get item hash for a tokenId
     */
    function getItemHash(uint256 tokenId) public view returns (bytes32) {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");
        return tokenIdToItemHash[tokenId];
    }

    // Override required by Solidity for ERC721URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // Required override for _burn because both ERC721 and ERC721URIStorage
    // define _burn. ERC721URIStorage:: _burn already clears tokenURI storage,
    // so delegate to the overrides list.
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
