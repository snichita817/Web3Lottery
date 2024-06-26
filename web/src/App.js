import React, { useState, useEffect, useRef } from 'react';
import logo from './lotto-logo.jpg';
import './App.css';
import contractABI from './LotteryContractABI.json';
import Participants from './Participants';

const { ethers } = require("ethers");

function App() {
  const [contractAddress, setContractAddress] = useState('');

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [totalUserContributions, setTotalUserContributions] = useState('0');
  const [currentUserContributions, setCurrentUserContributions] = useState('0');
  const [piggyBank, setPiggyBank] = useState('0');

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [events, setEvents] = useState([]);
  const messageTimeoutRef = useRef(null);

  useEffect(() => {
    if (contract && userAddress && isConnected) {
      fetchContributions(userAddress);
    }
  }, [contract, userAddress, isConnected]);

  useEffect(() => {
    // Cleanup to clear timeout when component unmounts
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    const subscribeToEvents = async () => {
      if (contract) {
        contract.on('EnteredLottery', (participant, amount) => {
          setEvents((prevEvents) => {
            if ({name: "EnteredLottery", participant, amount } != prevEvents[prevEvents.length-1])
               return [...prevEvents, {name: "EnteredLottery", participant, amount }]});
        });
        contract.on('WinnersPicked', (winners, amounts) => {
          setEvents((prevEvents) => {
            if ({name: "WinnersPicked", winners, amounts } != prevEvents[prevEvents.length-1])
              return [...prevEvents, {name: "WinnersPicked", winners, amounts }]});
        });
        contract.on('ParticipantWithdrawn', (participant, refundAmount) => {
          setEvents((prevEvents) => {
            if ({name: "ParticipantWithdrawn", participant, refundAmount } != prevEvents[prevEvents.length-1])
              return [...prevEvents, {name: "ParticipantWithdrawn", participant, refundAmount }]});
        });
      }
    };

    subscribeToEvents();

    return () => {
      if (contract) {
        contract.removeAllListeners();
      }
    };
  }, [contract]);

  useEffect(() => {
    fetch('/ProxyContractAddress.txt')
      .then(response => response.text())
      .then(address => {
        setContractAddress(address.trim());
      })
      .catch(error => console.error('Failed to load contract address:', error));
  }, []);



  const showMessage = (msg, isError = false) => {
    setMessage(msg);
    setIsError(isError);

    // Clear existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    // Set new timeout to clear message after 5 seconds
    messageTimeoutRef.current = setTimeout(() => {
      setMessage('');
      setIsError(false);
    }, 5000);
  };

  const fetchContributions = async (userAddress) => {
    try {
      const total = await contract.totalParticipantContributions(userAddress);
      const current = await contract.currentParticipantContributions(userAddress);
      const bank = await contract.getBalance();

      setTotalUserContributions(ethers.formatEther(total));
      setCurrentUserContributions(ethers.formatEther(current));
      setPiggyBank(ethers.formatEther(bank));
    } catch (error) {
      console.error("Error fetching contributions:", error);
      const errorMessage = error.reason || (error.error && error.error.message) || "An unknown error occurred.";
      showMessage(`Error fetching contributions. ${errorMessage}`, true);
    }
  };

  const connectWalletHandler = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setIsConnected(true);
      await provider.send("eth_requestAccounts", []);

      const userAddress = await signer.getAddress();
      setUserAddress(userAddress);
      showMessage('Sign in successful!');
    } else {
      showMessage('Please check or install MetaMask!', true);
    }
  };

  const enterLotteryHandler = async () => {
    try {
      let userAmount = document.getElementById('deposit-amount').value;
      const weiAmount = ethers.parseEther(userAmount);
      const tx = await contract.enterLottery({ value: weiAmount });
      await tx.wait();

      const gasLimit = await provider.estimateGas(tx.data);
      const gasPrice = await provider.getGasPrice();

      const txResponse = contract.contract.enterLottery({ value: weiAmount }, {gasPrice, gasLimit})

      const userAddress = await signer.getAddress();
      fetchContributions(userAddress);
      showMessage("Entered the lottery successfully!");
    } catch (error) {
      console.error("Error entering the lottery:", error);
      const errorMessage = error.reason || (error.error && error.error.message) || "An unknown error occurred.";
      showMessage(`Error entering the lottery. ${errorMessage}`, true);
    }
  };

  const withdrawHandler = async () => {
    try {
      const tx = await contract.withdrawFromLottery();
      await tx.wait();

      const gasLimit = await provider.estimateGas(tx.data);
      const gasPrice = await provider.getGasPrice();

      const txResponse = contract.contract.withdrawFromLottery({gasPrice, gasLimit})

      fetchContributions(userAddress);
      showMessage('Withdrawal successful!');
    } catch (error) {
      console.error("Error withdrawing from the lottery:", error);
      const errorMessage = error.reason || (error.error && error.error.message) || "An unknown error occurred.";
      showMessage(`Error withdrawing from the lottery. ${errorMessage}`, true);
    }
  };

  const pickWinnerHandler = async () => {
    try {
      const tx = await contract.pickWinner();
      await tx.wait();

      const gasLimit = await provider.estimateGas(tx.data);
      const gasPrice = await provider.getGasPrice();

      const txResponse = contract.contract.pickWinner({gasPrice, gasLimit})
      
      fetchContributions(userAddress);
      showMessage('Rewards have been granted!');
    } catch (error) {
      console.error("Error picking the winner:", error);
      const errorMessage = error.reason || (error.error && error.error.message) || "An unknown error occurred.";
      showMessage(`Error picking the winner. ${errorMessage}`, true);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {message && (
          <div className={`message ${isError ? 'error-message' : 'success-message'}`}>
            {message}
          </div>
        )}
        <img src={logo} className="App-logo" alt="logo" />
        <h2>In piggy bank: {piggyBank} ETH</h2>
        {isConnected && <p>Your Contributions: {currentUserContributions} ETH</p>}

        {!isConnected && (
          <div className='notConnected'>
            <h2>Please connect your MetaMask account before playing!</h2>
            <button onClick={connectWalletHandler}>Connect Wallet</button>
          </div>
        )}

        {isConnected && (
          <div className='connected'>
            <input type='text' id='deposit-amount' placeholder='ETH' /><br />
            <button onClick={enterLotteryHandler}>Enter lottery!!!</button>
          </div>
        )}

        {isConnected && (
          <div className='connected'>
            <button onClick={withdrawHandler}>Withdraw</button>
          </div>
        )}

        {isConnected && (
          <div className='connected'>
            <button onClick={pickWinnerHandler}>Pick your winner!</button>
          </div>
        )}

        {isConnected && (
          <div className='connected'>
            <Participants contractAddress={contractAddress} contractABI={contractABI} />
          </div>
        )}

        {isConnected && (
          <div className='connected'>
            <ul>
              {events.map((event, index) => (
              <li key={index}>
                {event.name == "EnteredLottery" && (
                  <div><h2>A new player has appeared!</h2>
                  <p>-------{event.participant}-------</p>
                  <p>with a balance of {ethers.formatEther(event.amount)}</p>
                  </div>
                )}
                {event.name == "WinnersPicked" && (
                  <div><h2>The winners have been picked!</h2>
                  <p>First Prize: {event.winners[0]} - {ethers.formatEther(event.amounts[0])} eth</p>
                  <p>Second Prize: {event.winners[1]} - {ethers.formatEther(event.amounts[1])} eth</p>
                  <p>Third Prize: {event.winners[2]} - {ethers.formatEther(event.amounts[2])} eth</p>
                  </div>
                )}
                {event.name == "ParticipantWithdrawn" && (
                  <div><h2>A participant has withdrawn their funds!</h2>
                  <p>-------{event.participant}-------</p>
                  <p>Withdrew an amount of {ethers.formatEther(event.refundAmount)}</p>
                  </div>
                )}
              </li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;