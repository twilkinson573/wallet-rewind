import React from "react";
import { ethers } from "ethers";
import { Alchemy } from "alchemy-sdk";
// import EthDater from "ethereum-block-by-date";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      selectedAddress: undefined, // The user's wallet address 
      startBlockNumber: undefined, 
      endBlockNumber: undefined,
      transactionsFrom: undefined,
      transactionsTo: undefined
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

    if (!this.state.transactionsFrom || !this.state.transactionsTo) {
      return <Loading />;
    }

    // Display vars here
    const topAssets = this._defineTopAssets(this.state.transactionsFrom, this.state.transactionsTo);

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>
              Your 2021 Bull Run Rewind <span role="img" aria-label="eyes">👀</span>
            </h1>
            <p>
              Welcome, <b>{this.state.selectedAddress}</b>, this is your Official Rewind for the 2021 Bull Run!
            </p>
            <p>From roughly December 2020 to December 2021 the crypto industry experienced insane growth</p>
            <p>
              Did you make it? Did all your research & trading even outperform holding ETH??! Find out below!
            </p>
          </div>
        </div>

        <hr />
        <h1>So during the bull run...</h1>

        <div className="row">
          <div className="col-12">
            <h4>Your Transactions</h4>
            <p>
              You made {this.state.transactionsFrom.concat(this.state.transactionsTo).length} transactions!
            </p>

            <table style={{width: '100%'}}>
              <thead>
                <tr>
                  <td>Tx Hash</td>
                  <td>Block Num</td>
                  <td>From </td>
                  <td>In/Out</td>
                  <td>To</td>
                  <td>Asset</td>
                  <td>Amount</td>
                </tr>
              </thead>
              <tbody>
                
                {this.state.transactionsFrom.concat(this.state.transactionsTo).sort((a,b) => parseInt(a.blockNum) - parseInt(b.blockNum)).map(t => 
                  <tr key={t.blockNum}>
                    <td><a target="_blank" rel="noopener noreferrer" href={`https://etherscan.io/tx/${t.hash}`}>{this._shortHex(t.hash)}</a></td>
                    <td><a target="_blank" rel="noopener noreferrer" href={`https://etherscan.io/block/${parseInt(t.blockNum)}`}>{parseInt(t.blockNum)}</a></td>
                    <td><a target="_blank" rel="noopener noreferrer" href={`https://etherscan.io/address/${t.from}`}>{this._shortHex(t.from)}</a></td>
                    <td><span role="img" rel="noopener noreferrer" aria-label="arrow">{t.from.toLowerCase() == this.state.selectedAddress.toLowerCase() ? '➡️' : '⬅️'}</span></td>
                    <td><a target="_blank" rel="noopener noreferrer" href={`https://etherscan.io/address/${t.to}`}>{this._shortHex(t.to)}</a></td>
                    <td>{t.asset}</td>
                    <td style={{color: t.from.toLowerCase() == this.state.selectedAddress.toLowerCase() ? 'red' : 'green'}}>{t.value}</td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </div>

        <hr/>

        <div className="row">
          <div className="col-12">
            <h4>Your Assets</h4>
            <p>
              Your favourite assets were: 
            </p>

            <div className="row" style={{display: 'flex', alignItems: 'flex-end'}}>
              {topAssets[0] && 
                <div className="col-4">
                  <p style={{fontSize: '4rem'}}>#1 {topAssets[0].symbol} 🥇</p>
                </div>
              }
              {topAssets[1] && 
                <div className="col-3">
                  <p style={{fontSize: '3rem'}}>#2 {topAssets[1].symbol} 🥈</p>
                </div>
              }
              {topAssets[2] && 
                <div className="col-5">
                  <p style={{fontSize: '2rem'}}>#3 {topAssets[2].symbol} 🥉</p>
                </div>
              }
            </div>

            <p>The assets you traded in the bull run were:</p>

            {topAssets.map(a => 
              <p key={a.symbol}>{a.symbol} - {a.trades} trades for a <span style={{color: a.net >= 0 ? 'green' : 'red'}}>{a.net}</span> net position</p>
            )}

          </div>
        </div>

      </div>
    );
  }

  componentWillUnmount() {
    // Put cleanup here
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

    let transactionsFromPayload = await this._alchemy.core.getAssetTransfers({
      fromAddress: this.state.selectedAddress, 
      category: ['external', 'erc20'],
      fromBlock: ethers.utils.hexlify(this.state.startBlockNumber),
      toBlock: ethers.utils.hexlify(this.state.endBlockNumber),
      // withMetadata: true <-- just returns blockTimestamp
    });

    let transactionsFrom = transactionsFromPayload.transfers;

    let transactionsToPayload = await this._alchemy.core.getAssetTransfers({
      toAddress: this.state.selectedAddress, 
      category: ['external', 'erc20'],
      fromBlock: ethers.utils.hexlify(this.state.startBlockNumber),
      toBlock: ethers.utils.hexlify(this.state.endBlockNumber),
      // withMetadata: true <-- just returns blockTimestamp
    });

    let transactionsTo = transactionsToPayload.transfers;

    this.setState({ transactionsFrom, transactionsTo })

  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545 
  _checkNetwork() {
    if (window.ethereum.networkVersion === process.env.REACT_APP_CHAIN_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect Metamask to Localhost:8545'
    });

    return false;
  }

  // Count up the most traded assets, with accumulator for how many trades
  // Keep score on the 'net position' of the asset: was it higher or lower?
  // Sort the final assets tally based on number of trades
  // DEV TODO - this could be refactored
  _defineTopAssets(transactionsFrom, transactionsTo) {

    const topAssets = []

    transactionsTo.forEach(t => {
      let assetId = topAssets.findIndex(a => a.symbol == t.asset);

      if (assetId !== -1) {
        // Asset entry exists, increment tx count & update net position
        let asset = topAssets[assetId];

        topAssets[assetId] = {
          symbol: asset.symbol,
          trades: asset.trades += 1,
          net: asset.net + t.value
        }

      } else {
        // Asset entry doesn't exist, create new entry
        topAssets.push({symbol: t.asset, trades: 1, net: t.value}) 

      }
    })

    transactionsFrom.forEach(t => {
      let assetId = topAssets.findIndex(a => a.symbol == t.asset);

      if (assetId !== -1) {
        // Asset entry exists, increment tx count & update net position
        let asset = topAssets[assetId];

        topAssets[assetId] = {
          symbol: asset.symbol,
          trades: asset.trades += 1,
          net: asset.net - t.value
        }

      } else {
        // Asset entry doesn't exist, create new entry
        topAssets.push({symbol: t.asset, trades: 1, net: -t.value}) 

      }
    })

    return topAssets.sort((a,b) => b.trades - a.trades);
  }

  _shortHex(hexString) {
    if(hexString.toLowerCase() == this.state.selectedAddress.toLowerCase()) {
      return `${hexString.substring(0,6)}...${hexString.slice(-3)} 👋`
    } else {
      return `${hexString.substring(0,6)}...${hexString.slice(-6)}`
    }
  }
}
