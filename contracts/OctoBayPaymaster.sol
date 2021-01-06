// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@opengsn/gsn/contracts/BasePaymaster.sol";
import "@0x/contracts-utils/contracts/src/v06/LibBytesV06.sol";

interface IOctoBay {
    function getUserClaimAmount(string calldata _githubUser) external returns (uint amount);
    function deductGasFee(string calldata _githubUser, uint amount) external;
}

contract OctoBayPaymaster is BasePaymaster {
   
   string public override versionPaymaster = "2.0.0";    // GSN version
  
   IOctoBay octoBay;
   constructor(address _octoBay) public {
      octoBay = IOctoBay(_octoBay);
   }
   
   function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    )
    external override
    returns (bytes memory context, bool rejectOnRecipientRevert){
        string memory githubUser = string(getBytesParam(relayRequest.request.data, 2));
        require(
            octoBay.getUserClaimAmount(githubUser) >= maxPossibleGas,
            "Not enough funds to pay for gas"
        );
        context = bytes(githubUser);
    }
    
    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external override {
        string memory githubUser = string(getBytesParam(context, 2));
        octoBay.deductGasFee(githubUser, gasUseWithoutPost);
    }
    
    // ------ UTILS -------- //
    
    /**
      * extract parameter from encoded-function block.
      * see: https://solidity.readthedocs.io/en/develop/abi-spec.html#formal-specification-of-the-encoding
      */
     function getParam(bytes memory msgData, uint index) internal pure returns (uint) {
         return LibBytesV06.readUint256(msgData, 4 + index * 32);
     }
     
     /**	
      * extract dynamic-sized (string/bytes) parameter
      * see: https://solidity.readthedocs.io/en/develop/abi-spec.html#use-of-dynamic-types	
      */	
     function getBytesParam(bytes memory msgData, uint index) internal pure returns (bytes memory ret) {	
         uint ofs = getParam(msgData, index) + 4;	
         uint len = LibBytesV06.readUint256(msgData, ofs);	
         ret = LibBytesV06.slice(msgData, ofs + 32, ofs + 32 + len);	
     }
}