# Personhood NFT

This project is a proof of concept for a token representing personhood. The goals of the project are:

1. For _web services_: to provide a robust method for determining whether a given user is a person or not;
1. For _users_: to simplify automated usage of personhood verification, and potentially to enable monetisation of such verification;
1. For _personhood verification systems_: to provide an open source of information to improve such tools, as well as a potential source of monetisation.

## The Problem and the Solution

Some web services should only be provided to people, and it can be problematic if they are provided to non-people. A well-known problem today is the cost of serving spam requests from bots. As AI agents become more sophisticated and potentially more powerful, the problem is likely to become ever more difficult and important.

Many solutions exist today which attempt to distinguish—online—between persons and non-persons. However, these solutions inevitably involve a game of cat-and-mouse, which each individual solution potentially vulnerable to zero-day exploits which render them useless for a period of time without prior notice. How does a web service respond to this?

The solution proposed here is to tokenise these various assessments of personhood, by way of an NFT-issuing smart contract. In this way a market can decide on the value of these tokens as a proxy for the accuracy of the respective approaches to verifying personhood. Thus a web service has access to an abstraction layer over the various approaches and is not forced to integrate any individual system—or to rapidly replace it in case of an emergency.

## Components

The system consists of several components:

1. Web services which want to know whether their users are people or not.
1. Users of those web services.
1. An Ethereum blockchain with a deployed instance of the `PersonhoodNFT` contract.
1. Personhood verification providers which interact with the contract to issue tokens to users they consider people. These could be based on centralised solutions (e.g. Google reCAPTCHA) or decentralised solutions (e.g. IDENA).
1. Marketplaces where the tokens created using the `PersonhoodNFT` contract can be traded, which provide an API with price information for those tokens.

The basic workflow is as follows:

1. A user who wants to access a web service asks that service for a reference or "challenge", e.g. a randomly generated string.
1. The user verifies their personhood with the personhood verification service of their choice, e.g. by passing a CAPTCHA.
1. The personhood verification service uses the `PersonhoodNFT` contract to mint a token for the user representing their personhood. The token is an NFT which stores information about the issuing service and the height at which the token was created.
1. The user uses the `PersonhoodNFT` contract to burn tokens, providing the web service’s address and the challenge they were provided. Burning the token causes a log event to occur.
1. The web service listens for these events, and when it detects one it asks a marketplace’s API for a price estimation of the token burned. (It could ask more than one marketplace and aggregate the information somehow).
1. These steps can potentially occur multiple times per challenge until the market value of the burned tokens crosses a threshold set by the web service.
1. At this point the web service allows the user access as the web service has confidence that the user is a person.

## Prerequisites

This is a Node.js project with a monorepo structure organised by `lerna`. The npm client is `yarn`, because of its workspaces integration with `lerna`.

## Install

```
yarn
```

## Testing

### Step 1: Deploy an Ethereum blockchain instance

```
yarn lerna run serve --stream --scope personhood-nft-contracts
```

### Step 2: Deploy the `PersonhoodNFT` contract

```
yarn lerna run migrate --scope personhood-nft-contracts
```

### Step 2: Deploy a market rate API server

```
yarn lerna run serve --stream --scope market-api-example
```

### Step 3: Deploy an issuer server

This is an example token issuer service which mints tokens for anyone who asks, but uses Google reCAPTCHA v3 to filter out spam requests. To run the service you will need to register with Google reCAPTCHA for a secret key and set it as an environmental variable. See [Google reCAPTCHA docs](https://developers.google.com/recaptcha/docs/v3) for more information.

```
    export GRECAPTCHA_SECRET="<your secret key from Google reCAPTCHA>"
yarn lerna run serve --stream --scope issuer-example
```

### Step 4: Deploy a kitten-as-a-service server

```
yarn lerna run serve --stream --scope kitten-as-a-service
```

### Step 5: Run tests

#### Automated tests

To run all tests:

```
yarn lerna run test --stream
```

Or just the integration tests:

```
yarn lerna run test:integration --stream --scope personhood-nft-contracts
```

_Note: currently the blockchain instance and web services which connect to it will have to be stopped and redeployed before each test run as the contract address is assumed to be constant._

#### Manual tests

For a manual run through the workflow described above try the following...

1. Confirm that access to the service is blocked without personhood verification:

```
curl http://localhost:3000/kitten
```

2. Make sure you have a temporary directory:

```
mkdir -p tmp
```

3. Visit the Personhood NFT issuer site:

```
open http://localhost:3002/?address=0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0
```

A `0x`-prefixed, hex-encoded Ethereum address should be prepopulated. Wait for the Google reCAPTCHA widget to load and submit the form. You should be redirected to the success page, displaying your newly minted token ID.

4. Get a challenge from the web service (kitten-as-a-service):

```
curl --fail --silent --cookie-jar tmp/cookies http://localhost:3000/challenge > tmp/challenge
cat tmp/challenge
```

5. Burn the token using the token ID and the challenge.

```
node scripts/burn-token.js <token ID> <challenge>
```

6. Access the kitten

```
curl --fail --silent --cookie tmp/cookies http://localhost:3000/kitten > tmp/kitten.jpg
open tmp/kitten.jpg
```
