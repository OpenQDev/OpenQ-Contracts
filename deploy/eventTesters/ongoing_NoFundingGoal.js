const { ethers } = require('hardhat');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.contracts') });

let abiCoder = new ethers.utils.AbiCoder;

const initializationSchema = ['address', 'uint256', 'bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'];
const initializationData = ['0x5FbDB2315678afecb367f032d93F642f64180aa3', '100', false, ethers.constants.AddressZero, 0, true, true, true, 'po', 'po', 'po'];

///---------ONGOING NO FUNDING--------///
const abiEncodedParamsOngoing = abiCoder.encode(initializationSchema, initializationData);
let ongoing_NoFundingGoal = [1, abiEncodedParamsOngoing];

/**
0x0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa30000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000002706f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002706f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002706f000000000000000000000000000000000000000000000000000000000000
 */

/**
0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa3
0000000000000000000000000000000000000000000000000000000000000064
0000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000001
0000000000000000000000000000000000000000000000000000000000000001
0000000000000000000000000000000000000000000000000000000000000001
0000000000000000000000000000000000000000000000000000000000000160
00000000000000000000000000000000000000000000000000000000000001a0
00000000000000000000000000000000000000000000000000000000000001e0
0000000000000000000000000000000000000000000000000000000000000002
706f000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000002
706f000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000002
706f000000000000000000000000000000000000000000000000000000000000
*/

module.exports = ongoing_NoFundingGoal;