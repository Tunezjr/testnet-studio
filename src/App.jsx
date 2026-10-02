import { useEffect, useMemo, useRef, useState } from "react";
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
  const [log, setLog] = useState("waiting on you.");
  const [busy, setBusy] = useState(false);
  const [deployed, setDeployed] = useState("");
  const videoRef = useRef(null);

  const short = useMemo(
    () => (account ? `${account.slice(0, 6)}…${account.slice(-4)}` : ""),
    [account]
  );

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const play = () => {
      void el.play().catch(() => {});
    };
    play();
    el.addEventListener("canplay", play);
    window.addEventListener("touchstart", play, { once: true });
    return () => {
      el.removeEventListener("canplay", play);
      window.removeEventListener("touchstart", play);
    };
  }, []);

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
            <video
              ref={videoRef}
              className="silk-pan"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            >
              <source src="/videos/silk.mp4" type="video/mp4" />
            </video>
            <div className="silk-gold" />
            <div className="silk-fade" />
          </div>
          <div className="hero">
            <h1>studio</h1>
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
              </div>
            ))}
          </aside>

          <section className="card status">
            <div className="hd">{tpl.name}</div>
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
        </div>
      </div>
    </div>
  );
}
