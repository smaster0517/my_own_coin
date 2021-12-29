const fs = require('fs');
const truffleContract = require('@truffle/contract');
const truffleAssert = require('truffle-assertions');

const CONFIG = require("../credentials");
const { web3 } = require('hardhat');

const tokenABI = (JSON.parse(fs.readFileSync('./artifacts/contracts/erc20.sol/Token.json', 'utf8'))).abi;

contract("Wrap Unwrap Test Cases", () => {
    let token;    
    let accounts;

    // const provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    // const provider = new Web3.providers.HttpProvider(CONFIG.polygonTestnet.url);


    before(async () => {
        accounts = await web3.eth.getAccounts()

        const TOKEN = artifacts.require("Token");

        token = await TOKEN.new()
        TOKEN.setAsDeployed(token)
        token = await TOKEN.deployed()


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

    const mintCost = async (token, address, number) => {
        const erc20 = new ethers.Contract(token.address, tokenABI, provider);
        const estimateGas = await erc20.estimateGas.mint(address, number);
        return estimateGas;
    }

    const burnCost = async (token, address, number) => {
        const erc20 = new ethers.Contract(token.address, tokenABI, provider);
        const estimateGas = await erc20.estimateGas.burn(address, number);
        return estimateGas;
    }

    it ("should mint tokens, when called by admin", async () => {
        const admin = accounts[0]
        const user = accounts[1]
        const amount = 100

        const balanceBef = await token.balanceOf(user)

        await token.mint(user, amount, {from: admin})
        await truffleAssert.reverts(token.mint(user, amount, {from: user}))

        const balanceAft = await token.balanceOf(user)
        
        assert.equal(balanceBef.toNumber(), 0, "Balance before is not equal to 0")
        assert.equal(balanceAft.toNumber(), amount, "Balance after is not equal to amount")
    })

    it ("should burn tokens, when called by admin", async () => {
        const admin = accounts[0]
        const user = accounts[1]
        const amount = 100

        const balanceBef = await token.balanceOf(user)

        await token.burn(user, amount, {from: admin})
        await truffleAssert.reverts(token.burn(user, amount, {from: user}))

        const balanceAft = await token.balanceOf(user)
        
        assert.equal(balanceAft.toNumber(), 0, "Balance after is not equal to 0")
        assert.equal(balanceBef.toNumber() - balanceAft.toNumber(), amount, "Burn amount not correct")
    })

    it ("should estimate gas", async () => {
        const admin = accounts[0]

        await mintCost(token, accounts[0], 100)
        await token.mint(accounts[0], 100, {from: admin})

        await burnCost(token, accounts[0], 100)
        await token.burn(accounts[0], 100, {from: admin})

        await mintCost(token, accounts[1], 100000000000)
        await token.mint(accounts[1], 100000000000, {from: admin})

        await mintCost(token, accounts[2], 1000)
        await token.mint(accounts[2], 1000, {from: admin})

        await burnCost(token, accounts[1], 50000000000)
        await token.burn(accounts[1], 50000000000, {from: admin})

        await burnCost(token, accounts[2], 500)
        await token.burn(accounts[2], 500, {from: admin})
        
    })

})