module.exports = {
  skipFiles: ["mocks/", "interfaces/", "libraries/"],
  measureStatementCoverage: true,
  measureFunctionCoverage: true,
  measureModifierCoverage: true,
  configureYulOptimizer: true,
  solcOptimizerDetails: {
    peephole: true,
    inliner: true,
    jumpdestRemover: true,
    orderLiterals: true,
    deduplicate: true,
    cse: true,
    constantOptimizer: true,
    yul: true,
  },
};
