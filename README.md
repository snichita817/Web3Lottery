# Web3Lottery

## Overview

Web3Lottery is a decentralized application (DApp) built on Hardhat and web3.js. It features a lottery contract on Ethereum, enabling users to participate in a blockchain-based lottery system. The front end is developed using React, with web3.js utilized for interacting with the Ethereum blockchain.

## Prerequisites

Before setting up the project, ensure you have Node.js and npm installed on your machine. You can download them from [Node.js official website](https://nodejs.org/).

## Setup Instructions

### Cloning the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/snichita817/Web3Lottery.git
cd Web3Lottery
```

### Setting Up the Hardhat Environment

Install dependencies and set environment variables:

```bash
npm install
npx hardhat vars set GET_PK1
npx hardhat vars set GET_PK2
npx hardhat vars set GET_PK3
```

These commands will set up private keys used by the Hardhat environment. Replace **GET_PK1**, **GET_PK2**, and **GET_PK3** with actual values for your environment.

Start the Hardhat local node:

```bash
npx hardhat node
```

Deploy the contracts to the local network:

```bash
npx hardhat run scripts/deploy.js --network <localhost/sepolia>
npx hardhat run scripts/deployUpgrade.js --network <localhost/sepolia>
```

### Setting Up the React Application

Install `create-react-app` globally and create a new React application:

```bash
npm install -g create-react-app
cd web
```

Install the `ethers` library to interact with Ethereum:

```bash
npm install --save ethers
```

Additionally, install Hardhat ethers for development:

```bash
npm install --save-dev @nomiclabs/hardhat-ethers
```

### Running the Application

```bash
npm start
```

This will start the development server and open the application in your default web browser.
