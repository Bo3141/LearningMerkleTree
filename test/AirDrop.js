const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

const { MerkleTree } = require('merkletreejs')

const KECCAK256 = web3.utils.soliditySha3

describe("Merkle tree airdrop", () => {
    const REWARD_AMOUNT = parseEther("1")
    const USER_NUMBER = 10
    const INVALID_PROOF = 
        [
            '0x4306ceff26c1e104939fabc1d917760e45551281e46ed897561f29a31ef875f3',
            '0x11b8eb5570cba0bb401776e0de86c277b085e62cf3c1503934bf88e34c710eea'
        ]
    
    let airDropToken, airDrop
    let deployer, signers

    let usersMerkleProofs, leaves, usersAddresses
    before("", async() =>{

        signers = await ethers.getSigners();
        deployer = signers[0]
        users = signers.slice(1,USER_NUMBER + 1)
        usersAddresses = users.map(x => x.address)

        leaves = usersAddresses.map(x => KECCAK256(x))
        
        const tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true })
        const ROOT = "0x" + tree.getRoot().toString('hex')

        usersMerkleProofs = leaves.map(x => tree.getHexProof(x))
        // const leaf = KECCAK256(usersAddresses[0])
        // const proof = tree.getProof(leaf)
        // console.log(tree.verify(proof, leaf, ROOT)) // true

        const AirDropToken = await ethers.getContractFactory("ERC20Mock");
        airDropToken = await AirDropToken.deploy();
        await airDropToken.deployed();

        
        const AirDrop = await ethers.getContractFactory("AirDrop");
        airDrop = await AirDrop.deploy(ROOT, airDropToken.address, REWARD_AMOUNT );
        await airDrop.deployed();

        airDropToken.mint(airDrop.address, REWARD_AMOUNT.mul(users.length * 2))
    })
    it("User cannot claim airdrop with invalid proof", async() =>{
        await expect(airDrop.connect(users[0]).claim(INVALID_PROOF)).
        to.be.revertedWith("Invalid proof")
    })
    it("Users can claim airdrop", async () => {
        for(let i = 0; i < users.length; i++){
            await airDrop.connect(users[i]).claim(usersMerkleProofs[i])
            expect(await airDropToken.balanceOf(users[i].address)).to.be.equal(REWARD_AMOUNT)
        }
    });
    it("Users cannot claim reward twice", async() =>{
        for(let i = 0; i < users.length; i++){
            await expect(airDrop.connect(users[i]).claim(usersMerkleProofs[i]))
            .to.be.revertedWith("Airdrop is already claimed")
        }
    })
});
