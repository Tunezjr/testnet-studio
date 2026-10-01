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
      text: "what happens when you say the token name out loud, I put it in the file. when you are ready, launch puts the contract on zenith testnet from the wallet you just connected.",
    },
  ]);
  const [log, setLog] = useState("waiting on you.");
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
    setLog(`opened ${next.name}.`);
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
            ? "I left it. try name it lagos credit, or symbol lcr, or add pause."
            : "it is in the file. read it once, then launch.",
      },
    ]);
    setPrompt("");
  }

  async function connect() {
    const eth = window.ethereum;
    if (!eth) {
      setLog("no wallet in this browser. install one, then come back.");
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
      setLog(`connected ${addr}, still on zenith.`);
    } catch (e) {
      setLog(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function launch() {
    const eth = window.ethereum;
    if (!eth) {
      setLog("connect first.");
      return;
    }
    setBusy(true);
    setLog("compiling here in the page, first time it fetches solc.");
    try {
      const artifact = await compileContract(source, tpl.contractName);
      setLog(`compiled ${artifact.name}. asking the wallet for zenith, then sending.`);
      await ensureZenith(eth);
      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
      const contract = await factory.deploy();
      setLog(`sent ${contract.deploymentTransaction().hash}\nzenith is thinking.`);
      await contract.waitForDeployment();
      const addr = await contract.getAddress();
      setDeployed(addr);
      const tx = contract.deploymentTransaction();
      setLog(`it is live.\n${addr}\n${tx ? txUrl(tx.hash) : ""}`);
    } catch (e) {
      setLog(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <div className="wrap">
        <header className="top">
          <div className="wordmark">
            <span className="dot" />
            studio
          </div>
          <span className="chip">zenith testnet · {ZENITH.chainId}</span>
          <div className="grow" />
          {account ? (
            <span className="chip">
              {short} · {Number(balance).toFixed(4)} zth
            </span>
          ) : null}
          <a className="btn ghost" href={ZENITH.faucet} target="_blank" rel="noreferrer">
            get test zth
          </a>
          <button className="btn cream" onClick={connect} disabled={busy}>
            {account ? "reconnect" : "connect wallet"}
          </button>
          <button className="btn" onClick={launch} disabled={busy}>
            {busy ? "working" : "launch on testnet"}
          </button>
        </header>

        <section className="hero-stage">
          <div className="silk" aria-hidden="true">
            <div className="silk-wash" />
            <div className="silk-radials" />
            <div className="silk-fade" />
          </div>
          <div className="hero">
            <h1>say what the app is, then put it on zenith.</h1>
            <p>
              what happens when someone opens this page, they pick a start, talk to the file,
              compile in the browser, and launch from their own wallet. no new language, no
              bridge story.
            </p>
          </div>
        </section>

        <div className="grid">
          <aside className="card">
            <div className="hd">start from</div>
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

          <section className="card">
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
                    open the contract
                  </a>
                </>
              ) : null}
            </pre>
          </section>

          <aside className="card">
            <div className="hd">what to change</div>
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
                placeholder="name it lagos credit"
              />
              <button className="btn cream" type="submit">
                apply
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
