import React from "react";

import { NetworkErrorMessage } from "./NetworkErrorMessage";

export function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <div className="container p-4">
      <div className="row justify-content-md-center">
        <div className="col-12 text-center">
          {/* Metamask network should be set to Localhost:8545. */}
          {networkError && (
            <NetworkErrorMessage 
              message={networkError} 
              dismiss={dismiss} 
            />
          )}
        </div>
        <div className="col-12 p-4 text-center">
          <h1>
            Your 2021 Bull Run Rewind <span role="img" aria-label="eyes">👀</span>
          </h1>
          <p>
            Welcome friend, this is your Official Rewind for the 2021 Crypto Bull Run!
          </p>
          <p>From roughly <b>December 2020</b> to <b>December 2021</b> the crypto industry experienced unparalleled growth</p>
          <p>
            Did you make it? Did all your research & trading even outperform just holding ETH??!
          </p>
          <p>
            Find out below!
          </p>
          <p>Please connect your wallet to on ETH Mainnet unlock your rewind</p>
          <button
            className="btn btn-warning"
            type="button"
            onClick={connectWallet}
          >
            Connect MetaMask
          </button>
        </div>
      </div>
    </div>
  );
}
