// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.12;

import '@openzeppelin/contracts/utils/Context.sol';

abstract contract OnlyOpenQ is Context {
    /*///////////////////////////////////////////////////////////////
                          INIITIALIZATION
    //////////////////////////////////////////////////////////////*/

    // OpenQProxy address
    address public openQ;

    /**
		Initializes a child contract with _openQ address
		@param _openQ The OpenQProxy address
		 */
    function __OnlyOpenQ_init(address _openQ) internal {
        openQ = _openQ;
    }

    /**
		Modifier to restrict access of methods to OpenQProxy address
		 */
    modifier onlyOpenQ() {
        require(_msgSender() == openQ, 'Method is only callable by OpenQ');
        _;
    }
}
