# Testnet Studio

A small Replit-shaped studio for Zenith EVM Testnet (Canton).

People pick a Solidity template, edit it in the browser, ask for a quick change, compile with solc in the page, connect a wallet, and launch the contract on chain `936485`.

## What this first cut does

- Counter, ERC-20, and open ZTH vault templates
- In-browser compile (solc 0.8.24 from soliditylang.org)
- Add / switch Zenith network in the injected wallet
- Deploy from the connected account
- Link to the official faucet and explorer
- Lightweight vibecode: rename token, set symbol, add pause

## What it is not yet

- Full multi-file IDE
- Hosted preview of a frontend
- Grok / LLM backend (the chat is rule-based until we wire an API)
- Private nodes or extra RPCs (only `https://rpc.testnet.zenith.network/`)

## Run

```bash
npm install
npm run dev
```

Deploy the `dist` folder, or point Vercel at this repo. `vercel.json` already rewrites to the SPA.

## Network

| Field | Value |
| --- | --- |
| Name | Zenith EVM Testnet |
| Chain ID | 936485 |
| RPC | https://rpc.testnet.zenith.network/ |
| Explorer | https://explorer.testnet.zenith.network |
| Faucet | https://explorer.testnet.zenith.network/faucet |
