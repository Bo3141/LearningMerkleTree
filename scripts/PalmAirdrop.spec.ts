import { MerkleTree } from 'merkletreejs';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { utils, constants } from 'ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { PalmToken, PalmAirdrop } from '../typechain';
import { getAirdropMerkleTree, getLeaf, ClaimInfo } from './utils';

describe('PalmAirdrop', () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let palmToken: PalmToken;
  let palmAirdrop: PalmAirdrop;

  let CLAIM_INFOS: ClaimInfo[];

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();

    CLAIM_INFOS = [
      {
        user: alice,
        ranking: 1,
        amount: utils.parseEther('1000'),
      },
      {
        user: bob,
        ranking: 2,
        amount: utils.parseEther('800'),
      },
    ];

    const PalmTokenFactory = await ethers.getContractFactory('PalmToken');
    palmToken = (await PalmTokenFactory.deploy()) as PalmToken;

    const PalmAirdropFactory = await ethers.getContractFactory('PalmAirdrop');
    palmAirdrop = (await PalmAirdropFactory.deploy(
      palmToken.address,
    )) as PalmAirdrop;
  });

  describe('Check constructor and initial values', () => {
    it('check inital values', async () => {
      expect(await palmAirdrop.palmToken()).to.be.equal(palmToken.address);
      expect(await palmAirdrop.owner()).to.be.equal(owner.address);
    });

    it('it reverts if palmToken is address(0)', async () => {
      const PalmAirdropFactory = await ethers.getContractFactory('PalmAirdrop');
      await expect(
        PalmAirdropFactory.deploy(constants.AddressZero),
      ).revertedWith('ZeroAddress()');
    });
  });

  describe('Set merkle root', () => {
    it('it reverts if msg.sender is not owner', async () => {
      await expect(
        palmAirdrop
          .connect(alice)
          .setRoot(getAirdropMerkleTree(CLAIM_INFOS).getRoot()),
      ).revertedWith('Ownable: caller is not the owner');
    });

    it('updates merkle root', async () => {
      const merkleTree = getAirdropMerkleTree(CLAIM_INFOS);
      await palmAirdrop.connect(owner).setRoot(merkleTree.getRoot());

      expect(await palmAirdrop.merkleRoot()).to.be.equal(
        merkleTree.getHexRoot(),
      );
    });
  });

  describe('Claim airdrop', () => {
    let merkleTree: MerkleTree;

    beforeEach(async () => {
      merkleTree = getAirdropMerkleTree(CLAIM_INFOS);
      await palmAirdrop.connect(owner).setRoot(merkleTree.getRoot());

      await palmToken.transfer(palmAirdrop.address, utils.parseEther('2000'));
    });

    it('it reverts if merkle proof is invalid', async () => {
      const hexProof = merkleTree.getHexProof(getLeaf(CLAIM_INFOS[1]));

      await expect(
        palmAirdrop.connect(alice).claim(
          {
            ranking: CLAIM_INFOS[0].ranking,
            amount: CLAIM_INFOS[0].amount,
          },
          hexProof,
        ),
      ).revertedWith('InvalidProof()');
    });

    it('claim airdrop amount', async () => {
      const hexProof = merkleTree.getHexProof(getLeaf(CLAIM_INFOS[0]));

      await palmAirdrop.connect(alice).claim(
        {
          ranking: CLAIM_INFOS[0].ranking,
          amount: CLAIM_INFOS[0].amount,
        },
        hexProof,
      );

      expect(await palmToken.balanceOf(alice.address)).to.be.equal(
        CLAIM_INFOS[0].amount,
      );
    });

    it('updates claimed variable', async () => {
      const hexProof = merkleTree.getHexProof(getLeaf(CLAIM_INFOS[0]));

      await palmAirdrop.connect(alice).claim(
        {
          ranking: CLAIM_INFOS[0].ranking,
          amount: CLAIM_INFOS[0].amount,
        },
        hexProof,
      );

      expect(await palmAirdrop.claimed(getLeaf(CLAIM_INFOS[0]))).to.be.equal(
        true,
      );
    });

    it('emits event', async () => {
      const hexProof = merkleTree.getHexProof(getLeaf(CLAIM_INFOS[0]));

      const tx = await palmAirdrop.connect(alice).claim(
        {
          ranking: CLAIM_INFOS[0].ranking,
          amount: CLAIM_INFOS[0].amount,
        },
        hexProof,
      );

      expect(tx)
        .to.be.emit(palmAirdrop, 'Claimed')
        .withArgs(alice.address, CLAIM_INFOS[0].ranking, CLAIM_INFOS[0].amount);
    });

    it('it reverts if already claimed', async () => {
      const hexProof = merkleTree.getHexProof(getLeaf(CLAIM_INFOS[0]));

      await palmAirdrop.connect(alice).claim(
        {
          ranking: CLAIM_INFOS[0].ranking,
          amount: CLAIM_INFOS[0].amount,
        },
        hexProof,
      );

      await expect(
        palmAirdrop.connect(alice).claim(
          {
            ranking: CLAIM_INFOS[0].ranking,
            amount: CLAIM_INFOS[0].amount,
          },
          hexProof,
        ),
      ).revertedWith('AlreadyClaimed()');
    });
  });
});
