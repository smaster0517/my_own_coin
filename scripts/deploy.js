const fs = require('fs');
const truffleContract = require('@truffle/contract');
const truffleAssert = require('truffle-assertions');

const CONFIG = require("../credentials");
const { web3, ethers } = require('hardhat');

const tokenABI = (JSON.parse(fs.readFileSync('./artifacts/contracts/erc20.sol/Token.json', 'utf8'))).abi;

contract("Wrap unwrap token Test Cases", () => {
    let token;    

    // const provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
    // const web3 = new Web3.providers.HttpProvider(CONFIG.infura.bscTestnet);
    const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
    const signer = new ethers.Wallet(CONFIG.wallet.PKEY);
    const account = signer.connect(provider);
    

    before(async () => {

        const TOKEN = artifacts.require("Token");

        token = await TOKEN.new()
        TOKEN.setAsDeployed(token)
        token = await TOKEN.deployed()

        token = new ethers.Contract(token.address, tokenABI, account);



        console.log({
            token: token.address,
        })

    })

    after(async () => {
        console.log('\u0007');
        console.log('\u0007');
        console.log('\u0007');
        console.log('\u0007');
    })

    const advanceBlock = () => new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            id: new Date().getTime()
        }, async (err, result) => {
            if (err) { return reject(err) }
            // const newBlockHash =await web3.eth.getBlock('latest').hash
            return resolve()
        })
    })
    
    const advanceBlocks = async (num) => {
        let resp = []
        for (let i = 0; i < num; i += 1) {
            resp.push(advanceBlock())
        }
        await Promise.all(resp)
    }
    
    const advancetime = (time) => new Promise((resolve, reject) => {
        web3.currentProvider.send({ 
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            id: new Date().getTime(),
            params: [time]
        }, async (err, result) => {
            if (err) { return reject(err) }
            const newBlockHash = await web3.eth.getBlock('latest').hash
    
            return resolve(newBlockHash)
        })
    })

    const sendBNBTForMint = async (token, admin, address, number) => {
        gas = await mintCost(token, address, number);
        gasPrice = await provider.getGasPrice();

        console.log({
            gas: String(gas),
            gasPrice: String(gasPrice),
        })

        estimatedPrice = gas * gasPrice * 1.5;
        let tx = await account.sendTransaction({ to: admin, value: estimatedPrice })
        await tx.wait()
    }

    const sendBNBTForBurn = async (token, admin, address, number) => {
        gas = await burnCost(token, address, number);
        gasPrice = await provider.getGasPrice();

        console.log({
            gas: String(gas),
            gasPrice: String(gasPrice),
        })

        estimatedPrice = gas * gasPrice * 1.5;
        let tx = await account.sendTransaction({ to: admin, value: estimatedPrice })
        await tx.wait()
}

    const mintCost = async (token, address, number) => {
        const erc20 = new ethers.Contract(token.address, tokenABI, account);
        const estimateGas = await erc20.estimateGas.mint(address, number);
        return estimateGas;
    }

    const burnCost = async (token, address, number) => {
        const erc20 = new ethers.Contract(token.address, tokenABI, account);
        const estimateGas = await erc20.estimateGas.burn(address, number);
        return estimateGas;
    }

    it ("should be able to mint token", async () => {
        await sendBNBTForMint(token, account.address, "0x0000000000000000000000000000000000000002", 100);
        let tx = await token.mint("0x0000000000000000000000000000000000000002", 100);
        await tx.wait()
    })

    it ("should be able to burn token", async () => {
        await sendBNBTForBurn(token, account.address, "0x0000000000000000000000000000000000000002", 50);
        let tx = await token.burn("0x0000000000000000000000000000000000000002", 50);
        await tx.wait()
    })

    it ("should be able to get gas estimate and price", async () => {
        const estGasMint = await mintCost(token, "0x0000000000000000000000000000000000000002", 100);
        const estGasBurn = await burnCost(token, "0x0000000000000000000000000000000000000002", 50);
    })
})
