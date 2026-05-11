// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library MathLib {
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    function clamp(uint256 value, uint256 lower, uint256 upper) internal pure returns (uint256) {
        return max(lower, min(value, upper));
    }

    function basisPointsOf(uint256 amount, uint256 bp) internal pure returns (uint256) {
        return (amount * bp) / 10000;
    }

    function subtractBasisPoints(uint256 amount, uint256 bp) internal pure returns (uint256) {
        return amount - basisPointsOf(amount, bp);
    }
}
