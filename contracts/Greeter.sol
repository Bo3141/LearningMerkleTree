// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "hardhat/console.sol";

contract Greeter {
    // _______________ Storage _______________
    string private greeting;

    // _______________ Events _______________
    /// @dev Emitted when `greeting` is set as the greeting
    event SetGreeting(string greeting);

    // _______________ Constructor _______________
    /**
     * @notice Sets the greeting to `_greeting`.
     *
     * @param _greeting New greeting.
     */
    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    // _______________ External functions _______________
    /**
     * @notice Sets the greeting to `_greeting`.
     *
     * @param _greeting New greeting.
     */
    function setGreeting(string memory _greeting) external {
        greeting = _greeting;
        emit SetGreeting(_greeting);
    }

    /**
     * @notice Returns the greeting.
     *
     * @return The greeting.
     */
    function greet() external view returns (string memory) {
        return greeting;
    }

    /**
     * @notice Outputs the greeting to console.
     *
     * This is an example of `hardhat/console.sol` usage.
     */
    function consoleGreet() external view {
        console.log("Greeting: '%s'", greeting);
    }
}
