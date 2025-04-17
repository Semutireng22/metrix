require('dotenv').config();
const axios = require('axios');
const { ethers } = require('ethers');
const chalk = require('chalk');
const ora = require('ora');

// ASCII Art Banner
console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║     ███╗   ███╗ █████╗ ██╗████████╗██████╗ ██╗██╗  ██╗     ██╗        ║
║     ████╗ ████║██╔══██╗██║╚══██╔══╝██╔══██╗██║╚██╗██╔╝     ██║        ║
║     ██╔████╔██║███████║██║   ██║   ██████╔╝██║ ╚███╔╝      ██║        ║
║     ██║╚██╔╝██║██╔══██║██║   ██║   ██╔══██╗██║ ██╔██╗      ╚═╝        ║
║     ██║ ╚═╝ ██║██║  ██║██║   ██║   ██║  ██║██║██╔╝ ██╗     ██╗        ║
║     ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝     ╚═╝        ║
║                                                                       ║
╠═══════════════════════════════════════════════════════════════════════╣
║                    Join Our Channel: t.me/ugdairdrop                  ║
║                 Follow Github : github.com/Semutireng22               ║
╚═══════════════════════════════════════════════════════════════════════╝
`));


// ENV
const rpc = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

// Validasi PRIVATE_KEY
if (!privateKey) {
  console.error("❌ Please set PRIVATE_KEY in .env file");
  process.exit(1);
}

// Inisialisasi dompet
const provider = new ethers.providers.JsonRpcProvider(rpc);
const wallet = new ethers.Wallet(privateKey, provider);

// ABIs
const ABI_ERC20 = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address) view returns (uint256)"
];
const ABI_MINT_AUSD = ["function mintAUSD(uint256 amount) public"];
const ABI_MINT_VUSD = ["function mintVUSD(uint256 amount) public"];
const ABI_STAKE = ["function stake(uint256 _tokens) public"];
const ABI_STAKE_VUSD = ["function stake(uint256 _amount) public"];

// Addresses
const TOKENS = {
  ATH: "0x1428444Eacdc0Fd115dd4318FcE65B61Cd1ef399",
  AUSD: "0x78De28aABBD5198657B26A8dc9777f441551B477",
  USDe: "0xf4BE938070f59764C85fAcE374F92A4670ff3877",
  LVLUSD: "0x8802b7bcF8EedCc9E1bA6C20E139bEe89dd98E83",
  VIRTUAL: "0xFF27D611ab162d7827bbbA59F140C1E7aE56e95C",
  VUSD: "0xc14A8E2Fc341A97a57524000bF0F7F1bA4de4802"
};
const CONTRACTS = {
  mintAUSD: "0x2cFDeE1d5f04dD235AEA47E1aD2fB66e3A61C13e",
  mintVUSD: "0x3dCACa90A714498624067948C092Dd0373f08265",
  stakeAUSD: "0x054de909723ECda2d119E31583D40a52a332f85c",
  stakeUSDe: "0x3988053b7c748023a1aE19a8ED4c1Bf217932bDB",
  stakeLVLUSD: "0x5De3fBd40D4c3892914c3b67b5B529D776A1483A",
  stakeVUSD: "0x5bb9Fa02a3DCCDB4E9099b48e8Ba5841D2e59d51"
};

// Faucet endpoints
const faucetUrls = [
  "https://app.x-network.io/maitrix-faucet/faucet",
  "https://app.x-network.io/maitrix-usde/faucet",
  "https://app.x-network.io/maitrix-lvl/faucet",
  "https://app.x-network.io/maitrix-virtual/faucet"
];

// Headers
const headers = {
  "Content-Type": "application/json",
  "Origin": "https://app.testnet.themaitrix.ai",
  "Referer": "https://app.testnet.themaitrix.ai/",
  "User-Agent": "Mozilla/5.0"
};

// Delay helper
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Faucet claim
async function claimAllFaucets(address) {
  console.log(chalk.cyan(`\n💧 Claiming faucets for ${address}`));
  const spinner = ora('Processing faucets...').start();
  let claimed = 0;

  for (let url of faucetUrls) {
    try {
      spinner.text = `Claiming from ${url.split('/').slice(-2)[0]}`;
      const res = await axios.post(url, { address }, {
        headers,
        timeout: 10000
      });
      claimed++;
      spinner.text = chalk.green(`✅ Faucet claimed: ${url.split('/').slice(-2)[0]}`);
      await delay(1000);
    } catch (err) {
      spinner.text = chalk.red(`❌ Failed: ${url.split('/').slice(-2)[0]} - ${err.response?.data?.message || err.message}`);
      await delay(1000);
    }
  }

  spinner.stop();
  console.log(chalk.green(`\n✨ Completed claiming ${claimed}/${faucetUrls.length} faucets\n`));
}

// Approve token
async function approveToken(wallet, tokenAddress, spender, amount, tokenName, decimals = 18) {
  const token = new ethers.Contract(tokenAddress, ABI_ERC20, wallet);
  try {
    const balance = await token.balanceOf(wallet.address);
    console.log(`🔎 ${tokenName} Balance: ${ethers.utils.formatUnits(balance, decimals)} ${tokenName}`);

    if (balance.lt(amount)) {
      console.log(`❌ ${tokenName} balance kurang untuk approve`);
      return false;
    }

    const approveTx = await token.approve(spender, amount);
    await approveTx.wait();
    console.log(`✅ Approved ${tokenName}: ${approveTx.hash}`);
    return true;
  } catch (err) {
    console.error(`❌ ${tokenName} Approve Error:`, err.reason || err.message);
    return false;
  }
}

// Mint AUSD
async function mintAUSD(wallet) {
  const amount = ethers.utils.parseUnits("50", 18);
  const approved = await approveToken(wallet, TOKENS.ATH, CONTRACTS.mintAUSD, amount, "ATH");
  if (!approved) return false;

  const spinner = ora('Preparing AUSD mint...').start();
  let retries = 3;
  
  while (retries > 0) {
    try {
      const nonce = await wallet.getTransactionCount();
      spinner.text = chalk.blue("📝 Preparing mint AUSD transaction...");
      const tx = {
        to: CONTRACTS.mintAUSD,
        data: "0x1bf6318b000000000000000000000000000000000000000000000002b5e3af16b1880000",
        gasLimit: 250000, // Increased gas limit
        gasPrice: ethers.utils.parseUnits("0.15", "gwei"), // Slightly increased gas price
        nonce: nonce,
        chainId: 421614,
        value: "0x0"
      };

      spinner.text = chalk.yellow("🚀 Sending mint AUSD transaction...");
      const mintTx = await wallet.sendTransaction(tx);
      spinner.text = chalk.blue("⏳ Waiting for confirmation...");
      const receipt = await mintTx.wait();
      
      if (receipt.status === 1) {
        spinner.succeed(chalk.green(`✨ Successfully minted AUSD: ${mintTx.hash}`));
        return true;
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      retries--;
      if (retries > 0) {
        spinner.text = chalk.yellow(`⚠️ Retrying... (${retries} attempts left)`);
        await delay(3000); // Wait 3 seconds before retry
      } else {
        spinner.fail(chalk.red(`❌ Mint AUSD Error: ${err.reason || err.message}`));
        return false;
      }
    }
  }
  return false;
}

// Mint VUSD
async function mintVUSD(wallet) {
  const amount = ethers.utils.parseUnits("2", 9);
  const approved = await approveToken(wallet, TOKENS.VIRTUAL, CONTRACTS.mintVUSD, amount, "VIRTUAL", 9);
  if (!approved) return false;

  try {
    const nonce = await wallet.getTransactionCount();
    console.log("Sending mint VUSD transaction...");
    const tx = {
      to: CONTRACTS.mintVUSD,
      data: "0xa6d675100000000000000000000000000000000000000000000000000000000077359400",
      gasLimit: 350000,
      gasPrice: ethers.utils.parseUnits("0.12", "gwei"),
      nonce: nonce,
      chainId: 421614,
      value: "0x0"
    };

    const mintTx = await wallet.sendTransaction(tx);
    console.log("Waiting for confirmation...");
    const receipt = await mintTx.wait();
    console.log(`✅ Minted VUSD: ${mintTx.hash}`);
    return true;
  } catch (err) {
    console.error("❌ Mint VUSD Error:", err.reason || err.message);
    return false;
  }
}

// Stake AUSD
async function stakeAUSD(wallet) {
  const token = new ethers.Contract(TOKENS.AUSD, ABI_ERC20, wallet);
  try {
    const balance = await token.balanceOf(wallet.address);
    console.log(`🔎 AUSD Balance: ${ethers.utils.formatUnits(balance, 18)} AUSD`);
    if (balance.isZero()) {
      console.log("❌ AUSD balance = 0, skip");
      return false;
    }

    const approved = await approveToken(wallet, TOKENS.AUSD, CONTRACTS.stakeAUSD, balance, "AUSD");
    if (!approved) return false;

    const nonce = await wallet.getTransactionCount();
    console.log("Staking AUSD...");
    const stakeTx = await wallet.sendTransaction({
      to: CONTRACTS.stakeAUSD,
      data: `0xa694fc3a${ethers.utils.hexZeroPad(balance.toHexString(), 32).slice(2)}`,
      gasLimit: 330000,
      gasPrice: ethers.utils.parseUnits("0.12", "gwei"),
      nonce: nonce,
      chainId: 421614,
      value: "0x0"
    });
    await stakeTx.wait();
    console.log(`✅ Staked AUSD: ${stakeTx.hash}`);
    return true;
  } catch (err) {
    console.error("❌ AUSD Stake Error:", err.reason || err.message);
    return false;
  }
}

// Stake VUSD
async function stakeVUSD(wallet) {
  const token = new ethers.Contract(TOKENS.VUSD, ABI_ERC20, wallet);
  try {
    const balance = await token.balanceOf(wallet.address);
    console.log(`🔎 VUSD Balance: ${ethers.utils.formatUnits(balance, 9)} VUSD`);
    if (balance.isZero()) {
      console.log("❌ VUSD balance = 0, skip");
      return false;
    }

    const approved = await approveToken(wallet, TOKENS.VUSD, CONTRACTS.stakeVUSD, balance, "VUSD", 9);
    if (!approved) return false;

    const nonce = await wallet.getTransactionCount();
    console.log("Staking VUSD...");
    const stakeTx = await wallet.sendTransaction({
      to: CONTRACTS.stakeVUSD,
      data: `0xa694fc3a${ethers.utils.hexZeroPad(balance.toHexString(), 32).slice(2)}`,
      gasLimit: 330000,
      gasPrice: ethers.utils.parseUnits("0.12", "gwei"),
      nonce: nonce,
      chainId: 421614,
      value: "0x0"
    });
    await stakeTx.wait();
    console.log(`✅ Staked VUSD: ${stakeTx.hash}`);
    return true;
  } catch (err) {
    console.error("❌ VUSD Stake Error:", err.reason || err.message);
    return false;
  }
}

// Stake other tokens (USDe, LVLUSD)
async function stakeToken(wallet, tokenAddress, contractAddress, tokenName) {
  const token = new ethers.Contract(tokenAddress, ABI_ERC20, wallet);
  const contract = new ethers.Contract(contractAddress, ABI_STAKE, wallet);

  try {
    const balance = await token.balanceOf(wallet.address);
    console.log(`🔎 ${tokenName} Balance: ${ethers.utils.formatUnits(balance, 18)} ${tokenName}`);
    if (balance.isZero()) {
      console.log(`❌ ${tokenName} balance = 0, skip`);
      return false;
    }

    const approveTx = await token.approve(contractAddress, balance);
    await approveTx.wait();
    console.log(`✅ Approved ${tokenName}: ${approveTx.hash}`);

    const stakeTx = await contract.stake(balance);
    await stakeTx.wait();
    console.log(`✅ Staked ${tokenName}: ${stakeTx.hash}`);
    return true;
  } catch (err) {
    console.error(`❌ ${tokenName} Stake Error:`, err.reason || err.message);
    return false;
  }
}

// Per wallet
async function processWallet(wallet) {
  console.log(`\n🚀 Processing wallet: ${wallet.address}`);
  await claimAllFaucets(wallet.address);
  await mintAUSD(wallet);
  await mintVUSD(wallet);
  await stakeAUSD(wallet);
  await stakeVUSD(wallet);
  await stakeToken(wallet, TOKENS.USDe, CONTRACTS.stakeUSDe, "USDe");
  await stakeToken(wallet, TOKENS.LVLUSD, CONTRACTS.stakeLVLUSD, "LVLUSD");
  console.log(`✅ Done for ${wallet.address}`);
}

// Main loop
async function main() {
  while (true) {
    await processWallet(wallet);
    
    console.log(chalk.yellow("\n🕛 Session completed. Waiting 24 hours before next run..."));
    const totalSeconds = 24 * 60 * 60;
    const spinner = ora().start();
    
    for (let sisa = totalSeconds; sisa > 0; sisa--) {
      const hours = Math.floor(sisa / 3600);
      const minutes = Math.floor((sisa % 3600) / 60);
      const seconds = sisa % 60;
      spinner.text = chalk.blue(`⏳ Next run in ${hours}h ${minutes}m ${seconds}s`);
      await delay(1000);
    }
    
    spinner.stop();
    console.log(chalk.green("\n🚀 Starting new session...\n"));
  }
}

main().catch(console.error);