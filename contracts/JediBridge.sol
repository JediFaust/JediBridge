// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./ERC20MintableBurnable.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title MultiChain Bridge Contract
/// @author https://github.com/JediFaust
/// @notice You can use this contract for swap ERC20 tokens between different chains
/// @dev All functions tested successfully and have no errors

contract JediBridge is Ownable {
    

    address private _validator;
    uint256 private _nonce;

    mapping(address => bool) private _tokens;
    mapping(bytes32 => bool) private _isClaimed;
    mapping(uint256 => bool) private _chainIds;

    /// @notice Deploys the contract with the
    /// initial parameter of validator address
    /// @dev Constructor should be used when deploying contract
    /// @param validator Address of validator
    constructor(address validator) {
        _validator = validator;
    }

    /// @notice Event that triggers when swap is initiated
    /// @dev Validator should take information about swap and
    /// generate signature from it
    /// also validator should handle ERC20 token addresses
    /// @param from Address of sender
    /// @param to Address of receiver
    /// @param tokenFrom Address of ERC20 token that is sent
    /// @param amount Amount of token that is sent
    /// @param fromChainId ChainId of sender blockchain
    /// @param toChainId ChainId of receiver blockchain
    /// @param nonce Nonce value to prevent replay attacks
    event SwapInitialized(
        address indexed from,
        address indexed to,
        address tokenFrom,
        uint256 amount,
        uint256 fromChainId,
        uint256 toChainId,
        uint256 nonce
        );

    /// @notice Swaps ERC20 tokens between different chains
    /// burns tokens from sender chain
    /// @dev triggers SwapInitialized event with
    /// information about swap
    /// Tokens should be registered
    /// Chains should be registered before swap
    /// @param to Address of receiver
    /// @param token Address of ERC20 token that is sent
    /// @param amount Amount of token to send
    /// @param toChainId ChainId of reciever blockchain
    /// @return true if swap is successful
    function swap(
        address to,
        address token,
        uint256 amount,
        uint256 toChainId
        ) external returns(bool) {
            require(_tokens[token], "Token is not allowed");
            require(_chainIds[toChainId], "Chain is not allowed");

            ERC20MintableBurnable _token = ERC20MintableBurnable(token);

            // Burn tokens
            _token.burn(msg.sender, amount);
            emit SwapInitialized(msg.sender, to, token, amount, block.chainid, toChainId, _nonce);
            _nonce++;

            return true;
    }

    /// @notice Redeems swapped tokens
    /// mints tokens to receiver chain
    /// @dev signature and nonce should be provided from validator
    /// @param from Address of sender
    /// @param token Address of ERC20 token to redeem
    /// @param amount Amount of token to redeem
    /// @param nonce Nonce value
    /// @param fromChainId ChainId of sender blockchain
    /// @param v Part of signature
    /// @param r Part of signature
    /// @param s Part of signature
    /// @return true if redeem is successful
    function redeem(
        address from,
        address token,
        uint256 amount,
        uint256 nonce,
        uint256 fromChainId,
        uint8 v,
        bytes32 r,
        bytes32 s
        ) external returns(bool) {
            ERC20MintableBurnable _token = ERC20MintableBurnable(token);

            require(
                checkSign(from, msg.sender, token, amount, fromChainId, block.chainid, nonce, v, r, s),
                "Invalid signature");
            _token.mint(msg.sender, amount);

            return true;
    }
    
    /// @notice Checks if signature is valid
    /// @dev internal function
    /// @param from Address of sender
    /// @param to Address of receiver
    /// @param token Address of ERC20 token that is sent
    /// @param amount Amount of token that is sent
    /// @param fromChainId ChainId of sender blockchain
    /// @param toChainId ChainId of receiver blockchain
    /// @param nonce Nonce value to prevent replay attacks
    /// @param v Part of signature
    /// @param r Part of signature
    /// @param s Part of signature
    /// @return true if signature is valid
    function checkSign(
        address from,
        address to,
        address token,
        uint256 amount,
        uint256 fromChainId,
        uint256 toChainId,
        uint256 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
        ) private returns (bool){
            bytes32 message = keccak256(
                    abi.encodePacked(from, to, token, amount, fromChainId, toChainId, nonce)
                );
            
            require(!_isClaimed[message], "Transfer was claimed!");

            address tmpAddr = ecrecover(hashMessage(message), v, r, s);
            if(tmpAddr == _validator) {
                _isClaimed[message] = true;

                return true;
            } else {
                return false;
            }
    }

    /// @notice Hashes message
    /// @dev internal function
    /// @param message Message to hash
    /// @return hash of message as keccak256
    function hashMessage(bytes32 message) private pure returns (bytes32) {
       	bytes memory prefix = "\x19Ethereum Signed Message:\n32";
       	return keccak256(abi.encodePacked(prefix, message));
    }


    /// @notice Adds ERC20 token to list of allowed tokens
    /// @param token Address of ERC20 token
    /// @return true if token is added
    function includeToken(address token) external onlyOwner returns(bool) {
        _tokens[token] = true;

        return true;
    }

    /// @notice Removes ERC20 token from list of allowed tokens
    /// @param token Address of ERC20 token
    /// @return true if token is removed
    function excludeToken(address token) external onlyOwner returns(bool) {
        _tokens[token] = false;

        return true;
    }

    /// @notice Swaps state of chainId between allowed and not allowed
    /// @param chainId ID of chain
    /// @return true if chainId is added or removed
    function updateChainById(uint256 chainId) external onlyOwner returns(bool) {
        _chainIds[chainId] = !_chainIds[chainId];
        
        return _chainIds[chainId];
    }  
}
