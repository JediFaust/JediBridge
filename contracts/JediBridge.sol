// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./ERC20MintableBurnable.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";



contract JediBridge is Ownable {
    /*
        NatSpec
    */

    address private _validator;
    uint256 private _nonce;

    mapping(address => bool) private _tokens;
    mapping(uint256 => bool) private _chainIds;

    constructor(address validator) {
        _validator = validator;
    }

    event swapInitialized(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 indexed chainId,
        uint256 nonce
        );

    /*
        NatSpec
    */
    function swap(
        address to,
        uint256 val,
        address token,
        uint256 chainId
        ) external returns(bool) {
            require(_tokens[token], "Token is not allowed");
            require(_chainIds[chainId], "Chain is not allowed");

            ERC20MintableBurnable _token = ERC20MintableBurnable(token);

            // Burn tokens
            _token.burn(msg.sender, val);
            emit swapInitialized(msg.sender, to, val, chainId, _nonce);
            _nonce++;

            return true;
    }

    /*
        NatSpec
    */
    function redeem(
        address token,
        uint256 val,
        bytes memory signature
        ) external returns(bool) {
            require(_tokens[token], "Token is not allowed");
            require(_chainIds[block.chainid], "Chain is not allowed");

            bytes32 r;
            bytes32 s;
            uint8 v;

            assembly {
                r := mload(add(signature, 32))
                s := mload(add(signature, 64))
                v := and(mload(add(signature, 65)), 255)
            }

            if (v < 27) v += 27;

            ERC20MintableBurnable _token = ERC20MintableBurnable(token);

            require(checkSign(msg.sender, val, v, r, s), "Invalid signature");
            _token.mint(msg.sender, val);

            return true;
    }

    function checkSign(
        address addr,
        uint256 val,
        uint8 v,
        bytes32 r,
        bytes32 s
        ) public view returns (bool){
            bytes32 message = keccak256(abi.encodePacked(addr, val));
            address tmpAddr = ecrecover(hashMessage(message), v, r, s);
            if(tmpAddr == _validator) {
                return true;
            } else {
                return false;
            }
    }

    function hashMessage(bytes32 message) private pure returns (bytes32) {
       	bytes memory prefix = "\x19Ethereum Signed Message:\n32";
       	return keccak256(abi.encodePacked(prefix, message));
    }


    /*
        NatSpec
    */
    function includeToken(address token) external onlyOwner returns(bool) {
        _tokens[token] = true;

        return true;
    }

    /*
        NatSpec
    */
    function excludeToken(address token) external onlyOwner returns(bool) {
        _tokens[token] = false;

        return true;
    }

    /*
        NatSpec
    */
    function updateChainById(uint256 chainId) external onlyOwner returns(bool) {
        _chainIds[chainId] = !_chainIds[chainId];
        
        return _chainIds[chainId];
    }  
}
