# Testnet Studio

Live on GitHub Pages: https://tunezjr.github.io/testnet-studio/

A small studio for Zenith EVM Testnet (Canton).

People pick a Solidity start, talk to the file, compile in the browser, connect a wallet, and launch on chain `936485`.

## Run locally

```bash
npm install
npm run dev
```

GitHub Pages builds from `main` via `.github/workflows/pages.yml`.
If the first Actions run fails on Pages permissions, open the repo Settings → Pages and set Source to GitHub Actions, then rerun the workflow.

## Network

| Field | Value |
| --- | --- |
| Name | Zenith EVM Testnet |
| Chain ID | 936485 |
| RPC | https://rpc.testnet.zenith.network/ |
| Explorer | https://explorer.testnet.zenith.network |
| Faucet | https://explorer.testnet.zenith.network/faucet |
