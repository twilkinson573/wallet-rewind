import React from "react";
import { ethers } from "ethers";
import { Network, Alchemy } from "alchemy-sdk";
// import EthDater from "ethereum-block-by-date";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";

const HARDHAT_NETWORK_ID = '31337';

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      selectedAddress: undefined, // The user's wallet address 
      startBlockNumber: undefined, 
      endBlockNumber: undefined,
      transactions: undefined
    };

    this.state = this.initialState;
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    if (!this.state.transactions) {
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>
              Wallet Rewind 👀
            </h1>
            <p>
              Welcome, <b>{this.state.selectedAddress}</b>, you are cool & have made {this.state.transactions.length} transactions!
            </p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
          </div>
        </div>

      </div>
    );
  }

  componentWillUnmount() {
    // We poll the user's balance, so we have to stop doing that when Dapp
    // gets unmounted
    this._stopPollingData();
  }

  // This method is run when the user clicks the Connect. It connects the
  // dapp to the user's wallet and initializes it.
  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Checks the network
    if (!this._checkNetwork()) {
      return;
    }

    // Initializes the application.
    this._initialize(selectedAddress);

    // Reinitialize whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
    
    // Reset dapp state if the network is changed
    window.ethereum.on("chainChanged", ([networkId]) => {
      this._resetState();
    });
  }

  _initialize(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });
    this._initializeEthers();
    this._initializeAlchemyAPI();
    this._initializeTimestamps();
    this._fetchTransactions();
  }

  async _initializeEthers() {
    // Initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);
    // Initialize any other smart contract instances here...
  }

  async _initializeAlchemyAPI() {
    // Alchemy API key is inserted at build time
    // The key will be exposed on the frontend, but is protected at the API
    // level with a domain whitelist to only allow requests from this site
    const settings = {
      apiKey: process.env.REACT_APP_ALCHEMY_API_KEY
    };

    this._alchemy = new Alchemy(settings);

    console.log(await this._alchemy.core.getBlockNumber());
  }

  // DEV-NOTE - eth-dater package isn't playing nice, adding block numbers directly for MVP
  // FUTURE-NOTE - this function could be brought into the UI to allow for customisable date ranges!
  async _initializeTimestamps() {
    // this._dater = new EthDater(this._provider);

    // let startBlockNumber = await this._dater.getDate(
    //   '2020-12-24T12:00:00Z', // Date, required. Any valid moment.js value: string, milliseconds, Date() object, moment() object.
    //   true, // Block after, optional. Search for the nearest block before or after the given date. By default true.
    //   false // Refresh boundaries, optional. Recheck the latest block before request. By default false.
    // );

    // let endBlockNumber = await this._dater.getDate(
    //   '2021-12-24T12:00:00Z', // Date, required. Any valid moment.js value: string, milliseconds, Date() object, moment() object.
    //   true, // Block after, optional. Search for the nearest block before or after the given date. By default true.
    //   false // Refresh boundaries, optional. Recheck the latest block before request. By default false.
    // );

    // DEV-NOTE TODO - replace these with dynamic eth-dater values
    let startBlockNumber = 11512970 // ≈ 2020-12-24T00:00:00Z
    let endBlockNumber = 13864522   // ≈ 2021-12-24T00:00:00Z

    this.setState({ startBlockNumber, endBlockNumber })
  }

  async _fetchTransactions(){

    let transactionsPayload = await this._alchemy.core.getAssetTransfers({
      fromAddress: "0x9a4D77a4567706E5Ca12eD5CE7020e4A961937d5", // TODO, replace this with user connected address
      category: ['external', 'erc20'],
      fromBlock: ethers.utils.hexlify(this.state.startBlockNumber),
      toBlock: ethers.utils.hexlify(this.state.endBlockNumber),
    });

    let transactions = transactionsPayload.transfers;

    this.setState({ transactions })

  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545 
  _checkNetwork() {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect Metamask to Localhost:8545'
    });

    return false;
  }
}
