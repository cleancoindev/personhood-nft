import crypto from "crypto";
import { RequestHandler } from "express";
import { readFileSync } from "fs";
import path from "path";
import Web3 from "web3";
import { Log } from "web3-core";
import { address, minimumValue } from "./constants";
import marketClient from "./market-client";

const encodeHex = (hexString: string) => `0x${hexString}`;
const encodeAddress = (hexString: string) => encodeHex(hexString.slice(24));
const decodeHeight = (hexString: string) => parseInt(hexString, 16);

export const getChallenge: (
	web3: Web3,
	topics: string[],
	challenges: Set<string>
) => RequestHandler = (web3, topics, challenges) => (req, res) => {
	if (!req.session) throw new Error("session not found");

	const challenge = crypto.randomBytes(32).toString("hex");
	req.session.value = 0;
	req.session.challenge = challenge;
	res.send(challenge);

	const options = {
		// address: process.env.CONTRACT_ADDRESS
		topics
	};
	const subscription = web3.eth.subscribe("logs", options);
	const timeout = setTimeout(() => subscription.unsubscribe(), 3600000);
	const clearChallenge = () => {
		subscription.unsubscribe();
		clearTimeout(timeout);
		if (req.session) req.session.challenge = undefined;
	};

	const errorHandler = (error: Error) => {
		console.error(error);
		clearChallenge();
	};
	const dataHandler = async ({ data }: Log) => {
		const { session } = req;
		if (!session) {
			errorHandler(new Error("session not found"));
			return;
		}

		// const prefix = data.slice(0, 2);
		const tokenIdBytes = data.slice(2, 66);
		const tokenId = encodeHex(tokenIdBytes);
		const issuerBytes = data.slice(66, 130);
		const issuer = encodeAddress(issuerBytes);
		const heightBytes = data.slice(130, 194);
		const height = decodeHeight(heightBytes);
		const recipientBytes = data.slice(194, 258);
		const recipientAddress = encodeAddress(recipientBytes);
		const memo = data.slice(258, 322);

		if (recipientAddress === address.toLowerCase() && memo === challenge) {
			try {
				const { data: marketData } = await marketClient.get("/rate", {
					params: {
						tokenId,
						issuer,
						height
					}
				});
				if (typeof marketData.rate !== "number") {
					throw new Error("unrecognised response from market API");
				}
				session!.value += marketData.rate;
			} catch (error) {
				console.error(error.message || error.code || "unknown error");
			}
		}

		if (session!.value >= minimumValue) {
			challenges.add(challenge);
			clearChallenge();
		}
	};

	subscription.on("data", dataHandler).on("error", errorHandler);
};

export const serveText: RequestHandler = (req, res) => {
	const kittenPath = path.join(__dirname, "..", "static", "kitten.jpg");
	const kitten = readFileSync(kittenPath);
	res.send(kitten);
};
