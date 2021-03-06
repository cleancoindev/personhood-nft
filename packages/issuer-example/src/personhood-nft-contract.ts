import Web3 from "web3";
import { AbiItem } from "web3-utils";
import personhoodNFT from "./contracts/PersonhoodNFT.json";
import { ethProvider, issuerAddress, contractAddress } from "./constants";

const web3 = new Web3(ethProvider);

const contractOptions = {
	from: issuerAddress,
	gas: 6700000,
};

const personhoodNftContract = new web3.eth.Contract(
	personhoodNFT.abi as AbiItem[],
	contractAddress,
	contractOptions,
) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

export default personhoodNftContract;
