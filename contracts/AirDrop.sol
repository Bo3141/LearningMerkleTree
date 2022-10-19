// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AirDrop {
    // _______________ Storage _______________
    bytes32 public root;
    IERC20 public token;
    uint256 public rewardAmount;

    mapping(address => bool) private rewardIsClaimed;

    // _______________ Events _______________
    /// @dev Emitted when `greeting` is set as the greeting
    event SetGreeting(string greeting);

    // _______________ Constructor _______________
    /**
     * @notice Constructor.
     *
     * @param _root Merkle root
     * @param _token Reawrd token
     * @param _rewardAmount Reward amount 
     */
    constructor(bytes32 _root, IERC20 _token, uint256 _rewardAmount ) {
        root = _root;
        token = _token;
        rewardAmount = _rewardAmount;

    }

    // _______________ External functions _______________

    function claim(bytes32[] memory _proof) public {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_proof, root, leaf) == true, "Invalid proof");
        require(rewardIsClaimed[msg.sender] == false, "Airdrop is already claimed");
        rewardIsClaimed[msg.sender] = true;
        token.transfer(msg.sender, rewardAmount);
    }

}
