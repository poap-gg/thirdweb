// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AirdropTokens is ERC1155, Ownable {
    using Strings for uint256;

    // Contract name
    string public name;
    
    // Counter for token IDs
    uint256 private _tokenId;

    // Mapping from token ID to its metadata URI
    mapping(uint256 => string) private _tokenURIs;
    
    // Token transfer and market states
    bool public transfersEnabled;
    bool public marketEnabled;
    
    // Events
    event TokenCreated(uint256 indexed tokenId, string uri);
    event TransferStateUpdated(bool enabled);
    event MarketStateUpdated(bool enabled);
    event NameUpdated(string oldName, string newName);
    event TokensBurned(address indexed burner, uint256 indexed tokenId, uint256 amount);
    event TokensBatchBurned(address indexed burner, uint256[] tokenIds, uint256[] amounts);
    
    constructor(
        string memory _baseUri,
        string memory _name,
        address _initialOwner
    ) ERC1155(_baseUri) Ownable(_initialOwner) {
        name = _name;
        transfersEnabled = false;
        marketEnabled = false;
        _tokenId = 0;
    }
    
    // Function to update the contract name
    function setName(string memory _newName) external onlyOwner {
        require(bytes(_newName).length > 0, "Name cannot be empty");
        string memory oldName = name;
        name = _newName;
        emit NameUpdated(oldName, _newName);
    }
    
    // Modifier to check if transfers are enabled
    modifier whenTransfersEnabled() {
        require(transfersEnabled || msg.sender == owner(), "Transfers are disabled");
        _;
    }
    
    // Modifier to check if marketplace is enabled
    modifier whenMarketEnabled() {
        require(marketEnabled || msg.sender == owner(), "Market is disabled");
        _;
    }
    
    // Create a new token with auto-incrementing ID
    function createToken(string memory _uri) external onlyOwner returns (uint256) {
        _tokenURIs[_tokenId] = _uri;
        emit TokenCreated(_tokenId, _uri);

        _tokenId++;

        return _tokenId;
    }
    
    // Mint a single token to an address
    function mintToken(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes memory data
    ) external onlyOwner {
        require(tokenId < _tokenId, "Token ID does not exist");
        _mint(to, tokenId, amount, data);
    }
    
    // Bulk mint tokens to multiple addresses
    function bulkMintTokens(
        address[] calldata to,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        bytes memory data
    ) external onlyOwner {
        require(
            to.length == tokenIds.length && tokenIds.length == amounts.length,
            "Arrays length mismatch"
        );
        
        for (uint256 i = 0; i < to.length; i++) {
            require(tokenIds[i] < _tokenId, "Token ID does not exist");
            _mint(to[i], tokenIds[i], amounts[i], data);
        }
    }
    
    // Token holder burn function
    function burn(uint256 tokenId, uint256 amount) external {
        require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        _burn(msg.sender, tokenId, amount);
        emit TokensBurned(msg.sender, tokenId, amount);
    }
    
    // Token holder batch burn function
    function batchBurn(uint256[] memory tokenIds, uint256[] memory amounts) external {
        require(tokenIds.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(balanceOf(msg.sender, tokenIds[i]) >= amounts[i], "Insufficient balance");
        }
        
        _burnBatch(msg.sender, tokenIds, amounts);
        emit TokensBatchBurned(msg.sender, tokenIds, amounts);
    }
    
    // Contract owner burn function - can burn from any address
    function burnFrom(
        address from,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner {
        require(balanceOf(from, tokenId) >= amount, "Insufficient balance");
        _burn(from, tokenId, amount);
        emit TokensBurned(from, tokenId, amount);
    }
    
    // Contract owner batch burn function - can burn from any address
    function batchBurnFrom(
        address from,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyOwner {
        require(tokenIds.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(balanceOf(from, tokenIds[i]) >= amounts[i], "Insufficient balance");
        }
        
        _burnBatch(from, tokenIds, amounts);
        emit TokensBatchBurned(from, tokenIds, amounts);
    }
    
    // Toggle transfer state
    function setTransfersEnabled(bool _enabled) external onlyOwner {
        transfersEnabled = _enabled;
        emit TransferStateUpdated(_enabled);
    }
    
    // Toggle market state
    function setMarketEnabled(bool _enabled) external onlyOwner {
        marketEnabled = _enabled;
        emit MarketStateUpdated(_enabled);
    }
    
    // Override to check transfer state
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override whenTransfersEnabled {
        super.safeTransferFrom(from, to, id, amount, data);
    }
    
    // Override to check transfer state
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override whenTransfersEnabled {
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }
    
    // Override uri function to return token-specific URI
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(tokenId < _tokenId, "URI query for nonexistent token");
        return string(abi.encodePacked(super.uri(tokenId), _tokenURIs[tokenId]));
    }
}