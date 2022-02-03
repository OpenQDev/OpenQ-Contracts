const ethers = require('ethers');

function generateDepositId(address, tokenAddress, timestamp) {
	const abiCoder = new ethers.utils.AbiCoder;
	const abiEncodedParams = abiCoder.encode(['address', 'address', 'uint256'], [address, tokenAddress, timestamp]);
	const depositId = ethers.utils.keccak256(abiEncodedParams);
	return depositId;
}

module.exports = { generateDepositId };