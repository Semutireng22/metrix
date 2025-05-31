// Mengimpor modul yang diperlukan
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
const rpcUrl = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  console.error(chalk.red("❌ Silakan atur PRIVATE_KEY di file .env"));
  process.exit(1);
}
if (!rpcUrl) {
    console.error(chalk.red("❌ Silakan atur RPC_URL di file .env"));
    process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// ABIs
const ABI_ERC20 = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
const ABI_STAKE = ["function stake(uint256 _tokens) public"];

// Addresses & Desimal
const TOKENS = {
  ATH:     { symbol: "ATH",     address: "0x1428444Eacdc0Fd115dd4318FcE65B61Cd1ef399", decimals: 18 },
  AUSD:    { symbol: "AUSD",    address: "0x78De28aABBD5198657B26A8dc9777f441551B477", decimals: 18 },
  USDe:    { symbol: "USDe",    address: "0xf4BE938070f59764C85fAcE374F92A4670ff3877", decimals: 18 },
  LVLUSD:  { symbol: "LVLUSD",  address: "0x8802b7bcF8EedCc9E1bA6C20E139bEe89dd98E83", decimals: 18 },
  VIRTUAL: { symbol: "VIRTUAL", address: "0xFF27D611ab162d7827bbbA59F140C1E7aE56e95C", decimals: 9  },
  VUSD:    { symbol: "VUSD",    address: "0xc14A8E2Fc341A97a57524000bF0F7F1bA4de4802", decimals: 9  },
  USD1:    { symbol: "USD1",    address: "0x16a8A3624465224198d216b33E825BcC3B80abf7", decimals: 18 },
  AI16Z:   { symbol: "AI16Z",   address: "0x2d5a4f5634041f50180A25F26b2A8364452E3152", decimals: 9  },
  AZUSD:   { symbol: "AZUSD",   address: "0x5966cd11aED7D68705C9692e74e5688C892cb162", decimals: 9  }
};

const CONTRACTS = {
  mintAUSD:    "0x2cFDeE1d5f04dD235AEA47E1aD2fB66e3A61C13e",
  mintVUSD:    "0x3dCACa90A714498624067948C092Dd0373f08265",
  mintAZUSD:   "0xB0b53d8B4ef06F9Bbe5db624113C6A5D35bB7522",
  stakeAUSD:   "0x054de909723ECda2d119E31583D40a52a332f85c",
  stakeUSDe:   "0x3988053b7c748023a1aE19a8ED4c1Bf217932bDB",
  stakeLVLUSD: "0x5De3fBd40D4c3892914c3b67b5B529D776A1483A",
  stakeVUSD:   "0x5bb9Fa02a3DCCDB4E9099b48e8Ba5841D2e59d51",
  stakeUSD1:   "0x7799841734Ac448b8634F1c1d7522Bc8887A7bB9",
  stakeAZUSD:  "0xf45Fde3F484C44CC35Bdc2A7fCA3DDDe0C8f252E"
};

// Konfigurasi Faucet Terpusat
const allFaucetConfigs = [
  { url: "https://app.x-network.io/maitrix-faucet/faucet",       name: 'ATH Faucet',       tokenSymbol: 'ATH',     type: 'general', timeout: 15000, providesCode: false },
  { url: "https://app.x-network.io/maitrix-usde/faucet",        name: 'USDe Faucet',      tokenSymbol: 'USDe',    type: 'general', timeout: 15000, providesCode: false },
  { url: "https://app.x-network.io/maitrix-lvl/faucet",         name: 'LVL Faucet',       tokenSymbol: 'LVLUSD',  type: 'general', timeout: 15000, providesCode: false },
  { url: "https://app.x-network.io/maitrix-virtual/faucet",     name: 'Virtual Faucet',   tokenSymbol: 'VIRTUAL', type: 'general', timeout: 15000, providesCode: false },
  { url: "https://app.x-network.io/maitrix-usd1/faucet",        name: 'USD1 Faucet',      tokenSymbol: 'USD1',    type: 'usd1',    timeout: 20000, providesCode: true  },
  { url: "https://app.x-network.io/maitrix-ai16z/faucet",       name: 'ai16z Faucet',     tokenSymbol: 'AI16Z',   type: 'ai16z',   timeout: 20000, providesCode: true  }
];

const generalHeaders = {
  "Content-Type": "application/json",
  "Origin": "https://app.testnet.themaitrix.ai",
  "Referer": "https://app.testnet.themaitrix.ai/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Fungsi Logging Seragam
const logSection = (message) => console.log(chalk.blue.bold.underline(`\n=== ${message} ===`));
const logSubSection = (message) => console.log(chalk.cyan.bold(`\n--- ${message} ---`));
const logEndSubSection = (message, success = true) => console.log(chalk.cyan.bold(`--- Selesai ${message} ${success ? '' : '(Gagal/Dilewati)'} ---\n`)); // Dihilangkan (Sukses) agar lebih ringkas
const logStep = (message) => console.log(chalk.blueBright(`  -> ${message}`));
const logDetail = (message) => console.log(chalk.gray(`     ${message}`));
const logSuccess = (message) => console.log(chalk.greenBright(`    ✅ ${message}`));
const logError = (message) => console.log(chalk.redBright(`    ❌ ${message}`));
const logWarn = (message) => console.log(chalk.yellowBright(`    🟡 ${message}`));


async function claimAllFaucets(address) {
  logSection("Memulai Proses Klaim Semua Faucet");
  const spinner = ora('Memproses semua faucet...').start();
  let successfullyProcessedCount = 0;
  let significantFaucetNewlyClaimed = false; 

  for (const faucetConfig of allFaucetConfigs) {
    spinner.text = `Mengklaim dari ${faucetConfig.name}`;
    try {
      const response = await axios.post(faucetConfig.url, { address }, {
        headers: generalHeaders,
        timeout: faucetConfig.timeout
      });

      if (faucetConfig.providesCode) { 
        if (response.data && typeof response.data.code !== 'undefined') {
            if (response.data.code === 200) {
                spinner.text = chalk.green(`  [${faucetConfig.name}] Berhasil diklaim! (Tx: ...${response.data.data.txHash.slice(-6)})`);
                successfullyProcessedCount++;
                if (faucetConfig.type === 'usd1' || faucetConfig.type === 'ai16z') {
                    significantFaucetNewlyClaimed = true;
                }
            } else if (response.data.code === 202) {
                const remainTime = parseInt(response.data.data.remainTime, 10);
                const hours = Math.floor(remainTime / 3600);
                const minutes = Math.floor((remainTime % 3600) / 60);
                spinner.text = chalk.yellow(`  [${faucetConfig.name}] Sudah diklaim. Coba lagi dalam ${hours}j ${minutes}m.`);
                successfullyProcessedCount++;
            } else {
                 spinner.text = chalk.red(`  [${faucetConfig.name}] Gagal: ${response.data.message || 'Status tidak dikenal'}.`);
            }
        } else {
             spinner.text = chalk.yellow(`  [${faucetConfig.name}] Respons tidak memiliki format 'code', namun permintaan terkirim (Status: ${response.status}).`);
             successfullyProcessedCount++; 
        }
      } else { 
        spinner.text = chalk.green(`  [${faucetConfig.name}] Permintaan klaim terkirim (Status: ${response.status}).`);
        successfullyProcessedCount++;
      }
      await delay(2000); 

    } catch (err) {
      let errorMessage = err.message;
      if (err.response) {
         errorMessage = err.response?.data?.message || `Error ${err.response.status}`;
      } else if (err.request) {
         errorMessage = "Tidak ada respons dari server.";
      }
      spinner.text = chalk.red(`  [${faucetConfig.name}] Error: ${errorMessage.substring(0, 60)}...`);
      await delay(2000);
    }
  }

  spinner.stop();
  logSection(`Selesai Proses Klaim Semua Faucet (${successfullyProcessedCount}/${allFaucetConfigs.length} diproses)`);
  return { significantFaucetNewlyClaimed };
}

async function checkTokenBalance(walletSigner, tokenInfo, operationName = "") {
    logStep(`Memeriksa saldo ${tokenInfo.symbol} untuk ${operationName || 'operasi berikutnya'}`);
    const tokenContract = new ethers.Contract(tokenInfo.address, ABI_ERC20, walletSigner.provider);
    try {
        const balance = await tokenContract.balanceOf(walletSigner.address);
        let decimalsToUse = tokenInfo.decimals;
        try { 
            const contractDecimals = await tokenContract.decimals();
            if (Number(contractDecimals) !== decimalsToUse) {
                logDetail(`(Info: Desimal ${tokenInfo.symbol} dari kontrak adalah ${contractDecimals}, menggunakan nilai kontrak)`);
                decimalsToUse = Number(contractDecimals);
            }
        } catch (decError) { /* Abaikan, gunakan desimal dari konfigurasi */ }
        
        logDetail(`Saldo ${tokenInfo.symbol}: ${ethers.utils.formatUnits(balance, decimalsToUse)} ${tokenInfo.symbol}`);
        return balance;
    } catch (error) {
        logError(`Gagal memeriksa saldo ${tokenInfo.symbol}: ${(error.reason || error.message).substring(0,100)}`);
        return ethers.BigNumber.from(0);
    }
}

async function approveToken(walletSigner, tokenInfo, spender, amount, operationName = "") {
  logStep(`Menyetujui ${ethers.utils.formatUnits(amount, tokenInfo.decimals)} ${tokenInfo.symbol} untuk ${operationName} (${spender.slice(0,6)}...${spender.slice(-4)})`);
  const token = new ethers.Contract(tokenInfo.address, ABI_ERC20, walletSigner);
  try {
    const currentGasPrice = await provider.getGasPrice();
    logDetail(`Harga gas saat ini: ${ethers.utils.formatUnits(currentGasPrice, "gwei")} Gwei`);
    const tx = await token.approve(spender, amount, {
        gasPrice: currentGasPrice
        // gasLimit bisa ditambahkan jika sering gagal, misal: ethers.utils.hexlify(100000)
    });
    logDetail(`Menunggu konfirmasi approval ${tokenInfo.symbol} (Tx: ${tx.hash})...`);
    await tx.wait(1); 
    logSuccess(`Approval ${tokenInfo.symbol} berhasil (Tx: ${tx.hash}).`);
    return true;
  } catch (err) {
    logError(`Gagal approve ${tokenInfo.symbol}: ${err.reason || err.message}`);
    if (err.transactionHash) {
        logError(`Detail transaksi approval: https://sepolia.arbiscan.io/tx/${err.transactionHash}`);
    }
    return false;
  }
}

async function mintOperation(wallet, outputTokenSymbol, inputTokenSymbol, mintContractAddress, mintData) {
  logSubSection(`Proses Mint ${outputTokenSymbol} dari ${inputTokenSymbol}`);
  const inputToken = TOKENS[inputTokenSymbol];
  const outputToken = TOKENS[outputTokenSymbol];

  let amountToApprove;
  let minBalanceRequired = ethers.BigNumber.from(0); // Saldo minimal default 0

  if (inputTokenSymbol === "AI16Z") {
    minBalanceRequired = ethers.utils.parseUnits("5", inputToken.decimals); // Minimal 5 AI16Z
    amountToApprove = await checkTokenBalance(wallet, inputToken, `Mint ${outputTokenSymbol}`);
    if (amountToApprove.lt(minBalanceRequired)) { // lt adalah "less than"
        logWarn(`Saldo ${inputTokenSymbol} (${ethers.utils.formatUnits(amountToApprove, inputToken.decimals)}) kurang dari 5. Lewati mint ${outputTokenSymbol}.`);
        logEndSubSection(`Proses Mint ${outputTokenSymbol}`, false);
        return false;
    }
  } else {
    if (inputTokenSymbol === "ATH") amountToApprove = ethers.utils.parseUnits("50", inputToken.decimals);
    else if (inputTokenSymbol === "VIRTUAL") amountToApprove = ethers.utils.parseUnits("2", inputToken.decimals);
    else { 
        amountToApprove = await checkTokenBalance(wallet, inputToken, `Mint ${outputTokenSymbol}`);
        if (amountToApprove.isZero()) { // Untuk token lain, cukup cek apakah saldo ada
            logWarn(`Saldo ${inputTokenSymbol} adalah 0. Lewati mint ${outputTokenSymbol}.`);
            logEndSubSection(`Proses Mint ${outputTokenSymbol}`, false);
            return false;
        }
    }
    // Cek saldo lagi sebelum approve untuk ATH dan VIRTUAL (jika perlu, tapi amountToApprove sudah fix)
    const currentInputBalance = await checkTokenBalance(wallet, inputToken, `Mint ${outputTokenSymbol}`);
    if (currentInputBalance.lt(amountToApprove) && (inputTokenSymbol === "ATH" || inputTokenSymbol === "VIRTUAL")) {
        logWarn(`Saldo ${inputTokenSymbol} (${ethers.utils.formatUnits(currentInputBalance, inputToken.decimals)}) tidak mencukupi untuk mint ${outputTokenSymbol} (butuh ${ethers.utils.formatUnits(amountToApprove, inputToken.decimals)}). Lewati.`);
        logEndSubSection(`Proses Mint ${outputTokenSymbol}`, false);
        return false;
    }
  }

  const approved = await approveToken(wallet, inputToken, mintContractAddress, amountToApprove, `Mint ${outputTokenSymbol}`);
  if (!approved) {
    logEndSubSection(`Proses Mint ${outputTokenSymbol}`, false);
    return false;
  }

  const spinner = ora(chalk.blue(`  Mempersiapkan mint ${outputTokenSymbol}...`)).start();
  let retries = 2; 
  
  while (retries > 0) {
    try {
      const nonce = await wallet.getTransactionCount("pending"); 
      spinner.text = chalk.blue(`    📝 Mempersiapkan tx mint ${outputTokenSymbol} (Nonce: ${nonce})...`);
      
      const txForEstimate = { to: mintContractAddress, data: mintData, nonce: nonce };
      let estimatedGas;
      try {
        estimatedGas = await wallet.estimateGas(txForEstimate);
        spinner.text = chalk.blue(`    ⛽ Estimasi gas: ${estimatedGas.toString()}`);
      } catch (estError) {
        spinner.warn(chalk.yellow(`    ⚠️ Gagal estimasi gas, menggunakan default (500000). Err: ${estError.message.substring(0,40)}...`));
        estimatedGas = ethers.BigNumber.from(500000); 
      }
      const gasLimitWithBuffer = estimatedGas.mul(120).div(100); 

      const tx = { ...txForEstimate, gasLimit: gasLimitWithBuffer, gasPrice: await provider.getGasPrice(), chainId: 421614, value: "0x0" };

      spinner.text = chalk.yellow(`    🚀 Mengirim tx mint ${outputTokenSymbol}...`);
      const mintTx = await wallet.sendTransaction(tx);
      spinner.text = chalk.blue(`    ⏳ Menunggu konfirmasi mint ${outputTokenSymbol} (Tx: ${mintTx.hash})...`);
      const receipt = await mintTx.wait(1); 
      
      if (receipt.status === 1) {
        spinner.succeed(chalk.green(`  Berhasil mint ${outputTokenSymbol} (Tx: ${mintTx.hash}).`));
        logEndSubSection(`Proses Mint ${outputTokenSymbol}`);
        await checkTokenBalance(wallet, outputToken, `Setelah Mint ${outputTokenSymbol}`); 
        return true;
      } else {
        throw new Error(`Transaksi mint ${outputTokenSymbol} gagal (status 0)`);
      }
    } catch (err) {
      retries--;
      spinner.text = chalk.yellow(`    ⚠️ Gagal mint ${outputTokenSymbol} (${(err.reason || err.message).substring(0,40)}...). Retry (${retries} left)...`);
      if (retries > 0) {
        await delay(7000 + Math.random() * 3000); 
      } else {
        spinner.fail(chalk.red(`  ❌ Gagal total mint ${outputTokenSymbol}.`));
        logEndSubSection(`Proses Mint ${outputTokenSymbol}`, false);
        return false;
      }
    }
  }
  return false; 
}

async function stakeOperation(wallet, tokenToStakeSymbol, stakeContractAddress) {
  logSubSection(`Proses Stake ${tokenToStakeSymbol}`);
  const tokenInfo = TOKENS[tokenToStakeSymbol];

  const balance = await checkTokenBalance(wallet, tokenInfo, `Stake ${tokenToStakeSymbol}`);
  if (balance.isZero()) {
    logWarn(`Saldo ${tokenToStakeSymbol} = 0, lewati staking.`);
    logEndSubSection(`Proses Stake ${tokenToStakeSymbol}`, false);
    return false;
  }

  const approved = await approveToken(wallet, tokenInfo, stakeContractAddress, balance, `Stake ${tokenToStakeSymbol}`);
  if (!approved) {
    logEndSubSection(`Proses Stake ${tokenToStakeSymbol}`, false);
    return false;
  }

  logStep(`Melakukan staking ${ethers.utils.formatUnits(balance, tokenInfo.decimals)} ${tokenToStakeSymbol}...`);
  const spinner = ora(chalk.blue(`  Mempersiapkan tx stake ${tokenToStakeSymbol}...`)).start();
  try {
    const nonce = await wallet.getTransactionCount("pending");
    spinner.text = chalk.blue(`    📝 Mempersiapkan tx stake ${tokenToStakeSymbol} (Nonce: ${nonce})...`);
    
    const stakeContract = new ethers.Contract(stakeContractAddress, ABI_STAKE, wallet); 
    
    let estimatedGas;
    try {
        const populatedTx = await stakeContract.populateTransaction.stake(balance, { nonce }); 
        estimatedGas = await wallet.estimateGas(populatedTx);
        spinner.text = chalk.blue(`    ⛽ Estimasi gas: ${estimatedGas.toString()}`);
    } catch (estError) {
        spinner.warn(chalk.yellow(`    ⚠️ Gagal estimasi gas, menggunakan default (500000). Err: ${estError.message.substring(0,40)}...`));
        estimatedGas = ethers.BigNumber.from(500000);
    }
    const gasLimitWithBuffer = estimatedGas.mul(120).div(100);

    const stakeTx = await stakeContract.stake(balance, {
        gasLimit: gasLimitWithBuffer, 
        gasPrice: await provider.getGasPrice(),
        nonce: nonce,
    });
    
    spinner.text = chalk.yellow(`    ⏳ Menunggu konfirmasi staking ${tokenToStakeSymbol} (Tx: ${stakeTx.hash})...`);
    await stakeTx.wait(1);
    spinner.succeed(chalk.green(`  ✅ Berhasil stake ${tokenToStakeSymbol} (Tx: ${stakeTx.hash}).`));
    logEndSubSection(`Proses Stake ${tokenToStakeSymbol}`);
    return true;
  } catch (err) {
    spinner.fail(chalk.red(`  ❌ Gagal stake ${tokenToStakeSymbol}: ${(err.reason || err.message).substring(0,100)}`));
    logEndSubSection(`Proses Stake ${tokenToStakeSymbol}`, false);
    return false;
  }
}

async function processWallet(wallet) {
  logSection(`Memulai Sesi Proses untuk Dompet: ${wallet.address}`);
  
  const faucetResults = await claimAllFaucets(wallet.address);
  
  if (faucetResults.significantFaucetNewlyClaimed) {
      logStep("Tuggu 10 detik sebelum ke proses selanjutnya...");
      await delay(10000); 
  }
  
  // Alur Mint & Stake
  // 1. AUSD Path
  if (await mintOperation(wallet, "AUSD", "ATH", CONTRACTS.mintAUSD, "0x1bf6318b000000000000000000000000000000000000000000000002b5e3af16b1880000")) {
    await delay(5000);
    await stakeOperation(wallet, "AUSD", CONTRACTS.stakeAUSD);
  }
  await delay(5000);

  // 2. VUSD Path
  if (await mintOperation(wallet, "VUSD", "VIRTUAL", CONTRACTS.mintVUSD, "0xa6d675100000000000000000000000000000000000000000000000000000000077359400")) {
    await delay(5000);
    await stakeOperation(wallet, "VUSD", CONTRACTS.stakeVUSD);
  }
  await delay(5000);

  // 3. azUSD Path
  if (await mintOperation(wallet, "AZUSD", "AI16Z", CONTRACTS.mintAZUSD, "0xa6d6751000000000000000000000000000000000000000000000000000000001a13b8600")) {
    await delay(5000);
    await stakeOperation(wallet, "AZUSD", CONTRACTS.stakeAZUSD);
  }
  await delay(5000);

  // 4. Stake Token Lainnya (Direct Stake)
  await stakeOperation(wallet, "LVLUSD", CONTRACTS.stakeLVLUSD);
  await delay(5000);
  await stakeOperation(wallet, "USDe", CONTRACTS.stakeUSDe);
  await delay(5000);
  await stakeOperation(wallet, "USD1", CONTRACTS.stakeUSD1);
  
  logSection(`Selesai Sesi Proses untuk Dompet: ${wallet.address}`);
}

async function main() {
  console.log(chalk.inverse.bold(`🤖 Maitrix Auto Task Bot Dimulai 🤖`));
  console.log(chalk.gray(`Alamat Dompet: ${wallet.address}`));
  
  while (true) {
    await processWallet(wallet); // Ini akan memulai dari klaim faucet setiap siklus
    
    logSection("Menunggu Siklus Berikutnya");
    const totalSeconds = 24 * 60 * 60; 
    const waitSpinner = ora(chalk.blue(`Menunggu 24 jam...`)).start();
    
    for (let sisa = totalSeconds; sisa > 0; sisa--) {
      const hours = Math.floor(sisa / 3600);
      const minutes = Math.floor((sisa % 3600) / 60);
      const seconds = sisa % 60;
      waitSpinner.text = chalk.blue(`⏳ Siklus berikutnya dalam ${hours}j ${minutes}m ${seconds}d`);
      await delay(1000);
    }
    waitSpinner.succeed(chalk.green("Waktu tunggu selesai. Memulai siklus baru..."));
  }
}

main().catch(error => {
  console.error(chalk.bgRed.white.bold("\n💥 Terjadi Error Fatal dalam Skrip:"));
  console.error(error);
  process.exit(1);
});
