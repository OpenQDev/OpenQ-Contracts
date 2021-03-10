// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@opengsn/gsn/contracts/BasePaymaster.sol";
import "@0x/contracts-utils/contracts/src/v06/LibBytesV06.sol";

interface IOctobay {
    function getUserClaimAmount(string calldata _githubUserId) external returns (uint amount);
    function deductGasFee(string calldata _githubUserId, uint amount) external;
}

contract OctobayPaymaster is BasePaymaster {

   string public override versionPaymaster = "2.0.0"; // GSN version
  
   IOctobay octobay;
   constructor(address _octobay) public {
      octobay = IOctobay(_octobay);
   }
   
   function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    )
    external override
    returns (bytes memory context, bool rejectOnRecipientRevert){
        string memory githubUserId = string(getBytesParam(relayRequest.request.data, 2));
        require(
            octobay.getUserClaimAmount(githubUserId) >= maxPossibleGas,
            "Not enough funds to pay for gas"
        );
        context = bytes(githubUserId);
        rejectOnRecipientRevert = true;
    }
    
    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external override {
        string memory githubUserId = string(getBytesParam(context, 2));
        octobay.deductGasFee(githubUserId, gasUseWithoutPost);
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