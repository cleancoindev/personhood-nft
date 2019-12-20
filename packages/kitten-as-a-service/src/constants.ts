export const oneHour = 3600000;
export const spendEventTopic =
	"0x5d578c853f453cdb9f2bd571dfa428d03e9112e36198626fd6954657625463e7";

// TODO: Remove defaults
export const sessionSecret = process.env.SESSION_SECRET || "keyboard cat";
export const ethProvider = process.env.ETH_PROVIDER || "ws://localhost:8545";
export const port = process.env.PORT || 3000;
export const address =
	process.env.ADDRESS || "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b";
export const minimumValue = 0.1;
