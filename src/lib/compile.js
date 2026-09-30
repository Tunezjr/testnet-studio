let solcPromise;

async function loadSolc() {
  if (solcPromise) return solcPromise;
  solcPromise = (async () => {
    const url =
      "https://binaries.soliditylang.org/bin/soljson-v0.8.24+commit.e11b9ed9.js";
    const src = await fetch(url).then((r) => r.text());
    const mod = { exports: {} };
    const fn = new Function("module", "exports", "global", src + "\nreturn module.exports || exports;");
    const soljson = fn(mod, mod.exports, globalThis);
    const factory = await import("https://esm.sh/solc@0.8.24/wrapper");
    return factory.default(soljson);
  })();
  return solcPromise;
}

export async function compileContract(source, contractName) {
  const solc = await loadSolc();
  const input = {
    language: "Solidity",
    sources: { "Contract.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((e) => e.severity === "error");
  if (errors.length) {
    throw new Error(errors.map((e) => e.formattedMessage || e.message).join("\n"));
  }
  const file = output.contracts?.["Contract.sol"];
  if (!file) throw new Error("Compiler returned no contracts");
  const name = file[contractName] ? contractName : Object.keys(file)[0];
  const artifact = file[name];
  const bytecode = artifact.evm?.bytecode?.object;
  if (!bytecode) throw new Error("Empty bytecode");
  return {
    name,
    abi: artifact.abi,
    bytecode: bytecode.startsWith("0x") ? bytecode : `0x${bytecode}`,
  };
}
