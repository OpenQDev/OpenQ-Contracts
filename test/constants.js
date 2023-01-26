const { ethers } = require('hardhat');

const Constants = {
	VERSION_1: 1,
	ATOMIC_CONTRACT: 0,
	ONGOING_CONTRACT: 1,
	TIERED_PERCENTAGE_CONTRACT: 2,
	TIERED_FIXED_CONTRACT: 3,
	mockOpenQId: 'mockOpenQId',
	mockId: 'mockId',
	bountyId: 'bountyId',
	organization: 'mockOrganization',
	funderUuid: 'mock-funder-uuid',
	mockClaimantAsset: 'https://github.com/OpenQDev/OpenQ-Frontend/pull/398',
	thirtyDays: 2765000,
	alternativeName: 'alternativeName',
	alternativeLogo: 'alternativeLogo',
	volume: 100
};

let abiCoder = new ethers.utils.AbiCoder;

const atomicBountyInitOperation_fundingGoal = (tokenAddress) => {
	const atomicBountyAbiEncodedParams = abiCoder.encode(
		['bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'], 
		[true, tokenAddress, Constants.volume, false, false, false, Constants.mockOpenQId, Constants.alternativeName, Constants.alternativeLogo]
	);
	const atomicBountyInitOperationComplete = [Constants.ATOMIC_CONTRACT, atomicBountyAbiEncodedParams];
	return atomicBountyInitOperationComplete;
};

const atomicBountyInitOperation_permissioned = (tokenAddress) => {
	const atomicBountyAbiEncodedParams = abiCoder.encode(
		['bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'], 
		[true, tokenAddress, Constants.volume, true, true, true, Constants.mockOpenQId, Constants.alternativeName, Constants.alternativeLogo]
	);
	const atomicBountyInitOperationComplete = [Constants.ATOMIC_CONTRACT, atomicBountyAbiEncodedParams];
	return atomicBountyInitOperationComplete;
};

const atomicBountyInitOperation_noFundingGoal = () => {
	const atomicBountyAbiEncodedParams = abiCoder.encode(
		['bool', 'address', 'uint256', 'bool', 'bool', 'bool', 'string', 'string', 'string'], 
		[false, ethers.constants.AddressZero, 0, true, true, true, Constants.mockOpenQId, Constants.alternativeName, Constants.alternativeLogo]
	);
	const atomicBountyInitOperationComplete = [Constants.ATOMIC_CONTRACT, atomicBountyAbiEncodedParams];
	return atomicBountyInitOperationComplete;
};

const ongoingBountyInitOperationBuilder = (tokenAddress) => {
	const abiEncodedParams = abiCoder.encode(
		['address','uint256','bool','address','uint256','bool','bool','bool','string','string','string'],
		[tokenAddress, Constants.volume, true, tokenAddress, 100, false, false, false, Constants.mockOpenQId, Constants.alternativeName, Constants.alternativeLogo]
	);
	const ongoingBountyInitOperationComplete = [Constants.ONGOING_CONTRACT, abiEncodedParams];
	return ongoingBountyInitOperationComplete;
};

const tieredBountyInitOperationBuilder = (tokenAddress) => {
	const tieredAbiEncodedParams = abiCoder.encode(
		['uint256[]','bool','address','uint256','bool','bool','bool','string','string','string'],
		[[60, 30, 10], true, tokenAddress, Constants.volume, true, true, true, Constants.mockOpenQId, Constants.alternativeName, Constants.alternativeLogo]
	);
	const tieredPercentageBountyInitOperationComplete = [Constants.TIERED_PERCENTAGE_CONTRACT, tieredAbiEncodedParams];
	return tieredPercentageBountyInitOperationComplete;
};

const tieredBountyInitOperation_not100 = (tokenAddress) => {
	const tieredAbiEncodedParamsNot100 = abiCoder.encode(
		['uint256[]','bool','address','uint256','bool','bool','bool','string','string','string'],
		[[60, 30, 10, 90], true, tokenAddress, Constants.volume, true, true, true, Constants.mockOpenQId, Constants.alternativeName, Constants.alternativeLogo]
	);
	const tieredPercentageBountyInitOperationComplete = [Constants.TIERED_PERCENTAGE_CONTRACT, tieredAbiEncodedParamsNot100];
	return tieredPercentageBountyInitOperationComplete;
};

const tieredFixedBountyInitOperationBuilder = (tokenAddress) => {
	const abiEncodedParamsTieredFixedBounty = abiCoder.encode(
		['uint256[]','address','bool','bool','bool','string','string','string'],
		[[80, 20],tokenAddress,true,true,true,Constants.mockOpenQId,Constants.alternativeName,Constants.alternativeLogo]
	);
	const tieredPercentageBountyInitOperationComplete = [Constants.TIERED_FIXED_CONTRACT, abiEncodedParamsTieredFixedBounty];
	return tieredPercentageBountyInitOperationComplete;
};

module.exports = { 
	Constants, 
	atomicBountyInitOperation_fundingGoal, 
	atomicBountyInitOperation_noFundingGoal, 
	atomicBountyInitOperation_permissioned,
	ongoingBountyInitOperationBuilder,
	tieredBountyInitOperationBuilder,
	tieredFixedBountyInitOperationBuilder,
	tieredBountyInitOperation_not100
};