export const TEMPLATES = [
  {
    id: "counter",
    name: "Counter",
    blurb: "Smallest deploy. Click, increment, prove the chain is live.",
    contractName: "Counter",
    constructorArgs: [],
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Counter {
    uint256 public count;
    address public owner;

    event Bumped(address indexed who, uint256 next);

    constructor() {
        owner = msg.sender;
    }

    function bump() external {
        count += 1;
        emit Bumped(msg.sender, count);
    }
}
`,
  },
  {
    id: "token",
    name: "Test token",
    blurb: "Mint a named ERC-20 to the deployer. Good first public app.",
    contractName: "StudioToken",
    constructorArgs: [],
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract StudioToken {
    string public name = "Studio Token";
    string public symbol = "STUDIO";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        uint256 minted = 1_000_000 * 10 ** 18;
        totalSupply = minted;
        balanceOf[msg.sender] = minted;
        emit Transfer(address(0), msg.sender, minted);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "balance");
        require(allowance[from][msg.sender] >= value, "allowance");
        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}
`,
  },
  {
    id: "vault",
    name: "Open vault",
    blurb: "Deposit ZTH, withdraw later. First lending-shaped surface.",
    contractName: "OpenVault",
    constructorArgs: [],
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract OpenVault {
    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;

    event Deposited(address indexed who, uint256 amount);
    event Withdrawn(address indexed who, uint256 amount);

    function deposit() external payable {
        require(msg.value > 0, "send ZTH");
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(deposits[msg.sender] >= amount, "too much");
        deposits[msg.sender] -= amount;
        totalDeposits -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "send failed");
        emit Withdrawn(msg.sender, amount);
    }
}
`,
  },
];

export function applyVibe(source, prompt) {
  const p = prompt.toLowerCase();
  let next = source;
  const nameMatch = prompt.match(/name(?:d)?\s+["']?([A-Za-z0-9 ]{2,32})/i);
  const symbolMatch = prompt.match(/symbol\s+["']?([A-Za-z0-9]{2,12})/i);

  if (nameMatch && next.includes("string public name")) {
    next = next.replace(/string public name = "[^"]*"/, `string public name = "${nameMatch[1].trim()}"`);
  }
  if (symbolMatch && next.includes("string public symbol")) {
    next = next.replace(/string public symbol = "[^"]*"/, `string public symbol = "${symbolMatch[1].trim().toUpperCase()}"`);
  }
  if (p.includes("pause") && !next.includes("paused")) {
    next = next.replace(
      "constructor() {",
      `bool public paused;\n    address public admin;\n\n    constructor() {\n        admin = msg.sender;`
    );
    next += `\n\n    modifier live() {\n        require(!paused, "paused");\n        _;\n    }\n\n    function setPaused(bool v) external {\n        require(msg.sender == admin, "admin");\n        paused = v;\n    }\n`;
  }
  if (p.includes("owner only") || p.includes("only owner")) {
    if (!next.includes("modifier onlyOwner") && next.includes("address public owner")) {
      next += `\n\n    modifier onlyOwner() {\n        require(msg.sender == owner, "owner");\n        _;\n    }\n`;
    }
  }
  return next;
}
