function bigNumberToEtherFloat(bigNumber) {
	return parseFloat(ethers.utils.formatEther(bigNumber));
}

module.exports = { bigNumberToEtherFloat };