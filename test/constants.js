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

const ongoingBountyInitOperationBuilder_noFundingGoal = (tokenAddress) => {
	const abiEncodedParams = abiCoder.encode(
		['address','uint256','bool','address','uint256','bool','bool','bool','string','string','string'],
		[tokenAddress, Constants.volume, false, ethers.constants.AddressZero, 0, false, false, false, Constants.mockOpenQId, Constants.alternativeName, Constants.alternativeLogo]
	);
	const ongoingBountyInitOperationComplete = [Constants.ONGOING_CONTRACT, abiEncodedParams];
	return ongoingBountyInitOperationComplete;
};

const tieredFixedBountyInitOperationBuilder = (tokenAddress) => {
	const abiEncodedParamsTieredFixedBounty = abiCoder.encode(
		['uint256[]','address','bool','bool','bool','string','string','string'],
		[[80, 20],tokenAddress,true,true,true,Constants.mockOpenQId,Constants.alternativeName,Constants.alternativeLogo]
	);
	const tieredPercentageBountyInitOperationComplete = [Constants.TIERED_FIXED_CONTRACT, abiEncodedParamsTieredFixedBounty];
	return tieredPercentageBountyInitOperationComplete;
};

const tieredFixedBountyInitOperationBuilder_permissionless = (tokenAddress) => {
	const abiEncodedParamsTieredFixedBounty = abiCoder.encode(
		['uint256[]','address','bool','bool','bool','string','string','string'],
		[[80, 20],tokenAddress,false,false,false,Constants.mockOpenQId,Constants.alternativeName,Constants.alternativeLogo]
	);
	const tieredFixedBountyInitOperationComplete = [Constants.TIERED_FIXED_CONTRACT, abiEncodedParamsTieredFixedBounty];
	return tieredFixedBountyInitOperationComplete;
};

const setInvoiceCompleteData_tiered = (tier, invoiceComplete) => {
	return abiCoder.encode(
		['uint256', 'bool'],
		[tier, invoiceComplete]
	);
};

const setSupportingDocumentsComplete_tiered = (tier, supportingDocumentsComplete) => {
	const encoded = abiCoder.encode(
		['uint256', 'bool'],
		[tier, supportingDocumentsComplete]
	);

	return encoded;
};

const setSupportingDocumentsComplete_atomic = (supportingDocumentsComplete) => {
	const encoded = abiCoder.encode(
		['bool'],
		[supportingDocumentsComplete]
	);

	return encoded;
};

const setInvoiceCompleteData_atomic = (invoiceComplete) => {
	const encoded = abiCoder.encode(
		['bool'],
		[invoiceComplete]
	);

	return encoded;
};

module.exports = { 
	Constants, 
	atomicBountyInitOperation_fundingGoal, 
	atomicBountyInitOperation_noFundingGoal, 
	atomicBountyInitOperation_permissioned,
	ongoingBountyInitOperationBuilder,
	tieredFixedBountyInitOperationBuilder,
	setInvoiceCompleteData_tiered,
	setSupportingDocumentsComplete_tiered,
	setInvoiceCompleteData_atomic,
	setSupportingDocumentsComplete_atomic,
	tieredFixedBountyInitOperationBuilder_permissionless,
	ongoingBountyInitOperationBuilder_noFundingGoal,
};