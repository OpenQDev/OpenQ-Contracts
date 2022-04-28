// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

// Third Party
import '@openzeppelin/contracts/utils/Context.sol';

/// @title OnlyOpenQ
/// @author OpenQ
/// @dev Restricts access for method calls to OpenQProxy address
abstract contract OnlyOpenQ is Context {
    /*///////////////////////////////////////////////////////////////
                          INIITIALIZATION
    //////////////////////////////////////////////////////////////*/

    // OpenQProxy address
    address private _openQ;

    /**
		Initializes contract with OpenQProxy address
		@param initalOpenQ The OpenQProxy address
		 */
    function __OnlyOpenQ_init(address initalOpenQ) internal {
        _openQ = initalOpenQ;
    }

    /**
		Getter for the current OpenQProxy address
		 */
    function openQ() public view returns (address) {
        return _openQ;
    }

    /**
		Modifier to restrict access of methods to OpenQProxy address
		 */
    modifier onlyOpenQ() {
        require(_msgSender() == _openQ, 'Method is only callable by OpenQ');
        _;
    }
}
