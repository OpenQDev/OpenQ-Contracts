# OpenQExecutor

A common contract-oriented design pattern is to have a core business logic contract which integrates.

This separation of logic and state allows for an update to logic while using the same old state.

A third set of tasks unrelated to logic - that of administration - is often lumped into this core logic contract.

The trio pattern of logic-storage-executor separates these three task types.

All updates to storage are done by wrappers in the Executor contract, rather than in the core business logic contract.

The same contract that does things like calculate ETH/USD price need not be the same contract that adds oracle jobs.
