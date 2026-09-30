import { useMemo, useState } from "react";
import { BrowserProvider, ContractFactory, formatEther } from "ethers";
import { TEMPLATES, applyVibe } from "./lib/templates";
import { ZENITH, addressUrl, ensureZenith, txUrl } from "./lib/zenith";
import { compileContract } from "./lib/compile";

export default function App() {
  const [tpl, setTpl] = useState(TEMPLATES[0]);
  const [source, setSource] = useState(TEMPLATES[0].source);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "studio",
      text: "Pick a template, change the Solidity, then compile and launch on Zenith testnet. Ask for a rename, a pause switch, or owner-only if you want a fast edit.",
    },
  ]);
  const [log, setLog] = useState("Ready.");
  const [busy, setBusy] = useState(false);
  const [deployed, setDeployed] = useState("");

  const short = useMemo(
    () => (account ? `${account.slice(0, 6)}…${account.slice(-4)}` : ""),
    [account]
  );

  function pick(next) {
    setTpl(next);
    setSource(next.source);
    setDeployed("");
    setLog(`Loaded ${next.name}.`);
  }

  function vibe() {
    if (!prompt.trim()) return;
    const next = applyVibe(source, prompt.trim());
    setSource(next);
    setMessages((m) => [
      ...m,
      { role: "me", text: prompt.trim() },
      {
        role: "studio",
        text:
          next === source
            ? "I left the file as-is. Try name it Lagos Credit, symbol LCR, or add pause."
            : "Updated the file. Read it once, then compile.",
      },
    ]);
    setPrompt("");
  }

  async function connect() {
    const eth = window.ethereum;
    if (!eth) {
      setLog("No injected wallet. Install MetaMask or a WalletConnect-capable wallet.");
      return;
    }
    setBusy(true);
    try {
      await ensureZenith(eth);
      const provider = new BrowserProvider(eth);
      const accs = await provider.send("eth_requestAccounts", []);
      const addr = accs[0];
      const bal = await provider.getBalance(addr);
      setAccount(addr);
      setBalance(formatEther(bal));
      setLog(`Connected ${addr} on ${ZENITH.name}.`);
    } catch (e) {
      setLog(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function launch() {
    const eth = window.ethereum;
    if (!eth) {
      setLog("Connect a wallet first.");
      return;
    }
    setBusy(true);
    setLog("Compiling in the browser. First compile downloads solc, give it a moment.");
    try {
      const artifact = await compileContract(source, tpl.contractName);
      setLog(`Compiled ${artifact.name}. Switching wallet to Zenith, then deploying.`);
      await ensureZenith(eth);
      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
      const contract = await factory.deploy();
      setLog(`Tx sent ${contract.deploymentTransaction().hash}\nWaiting for Zenith…`);
      await contract.waitForDeployment();
      const addr = await contract.getAddress();
      setDeployed(addr);
      const tx = contract.deploymentTransaction();
      setLog(`Live on Zenith testnet.\n${addr}\n${tx ? txUrl(tx.hash) : ""}`);
    } catch (e) {
      setLog(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div className="mark">
          testnet<span>.studio</span>
        </div>
        <span className="chip">{ZENITH.name} · {ZENITH.chainId}</span>
        <div className="grow" />
        {account ? (
          <span className="chip">
            {short} · {Number(balance).toFixed(4)} ZTH
          </span>
        ) : null}
        <a className="btn ghost" href={ZENITH.faucet} target="_blank" rel="noreferrer">
          Faucet
        </a>
        <button className="btn ghost" onClick={connect} disabled={busy}>
          {account ? "Reconnect" : "Connect"}
        </button>
        <button className="btn" onClick={launch} disabled={busy}>
          {busy ? "Working…" : "Launch on testnet"}
        </button>
      </header>

      <div className="shell">
        <aside className="col">
          <div className="hd">Start from</div>
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className={`tpl ${tpl.id === t.id ? "on" : ""}`}
              onClick={() => pick(t)}
            >
              <b>{t.name}</b>
              <p>{t.blurb}</p>
            </div>
          ))}
        </aside>

        <section className="col">
          <div className="hd">{tpl.contractName}.sol</div>
          <textarea
            className="editor"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
          />
          <pre className="log">
            {log}
            {deployed ? (
              <>
                {"\n"}
                <a href={addressUrl(deployed)} target="_blank" rel="noreferrer">
                  Open contract
                </a>
              </>
            ) : null}
          </pre>
        </section>

        <aside className="col">
          <div className="hd">Vibecode</div>
          <div className="chat">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role === "me" ? "me" : ""}`}>
                {m.text}
              </div>
            ))}
          </div>
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              vibe();
            }}
          >
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="name it Lagos Credit"
            />
            <button className="btn" type="submit">
              Apply
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
