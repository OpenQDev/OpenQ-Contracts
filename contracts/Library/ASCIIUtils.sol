// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/// @title ASCIIUtils
/// @author FlacoJones
/// @notice Utilities used across many contracts
library ASCIIUtils {
    function isAscii(string memory str) internal pure returns (bool) {
        bytes memory b = bytes(str);
        for (uint256 i; i < b.length; i++) {
            uint8 char = uint8(b[i]);
            if (char <= 32 || char > 126) {
                return false;
            }
        }
        return true;
    }

    function convertUint32ToBytes1(uint32 num) internal pure returns (bytes1) {
        bytes4 temp = bytes4(num);
        bytes1 result = temp[0];
        return result;
    }
}
