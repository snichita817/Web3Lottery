import React, { useState } from 'react';
import { ethers } from 'ethers';
import './Participants.css';

const Participants = ({ contractAddress, contractABI }) => {
    const [participants, setParticipants] = useState([]);
    const [showParticipants, setShowParticipants] = useState(false);

    const fetchParticipants = async () => {
        if (showParticipants) {
            setShowParticipants(false);  // If list is currently shown, hide it
        } else {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
            const count = await contract.getParticipantCount();
            let loadedParticipants = [];
            for (let i = 0; i < count; i++) {
                const participant = await contract.participants(i);
                console.log(participant)
                const contributions = await contract.currentParticipantContributions(participant);
                loadedParticipants.push({ address: participant, amount: contributions.toString() });
            }
    
            setParticipants(loadedParticipants);
            setShowParticipants(true);
        }
    };

    return (
        <div className="participants-container">
            <button onClick={fetchParticipants} className="load-participants-button">
                {showParticipants ? 'Hide Participants' : 'Load Participants'}
            </button>
            {showParticipants && (
                <ul className="participants-list">
                    {participants.map((p, index) => (
                        <li key={index} className="participant-item">
                            Address: 
                            <a href={`https://etherscan.io/address/${p.address}`} target="_blank" rel="noopener noreferrer" className="participant-link">
                                {p.address}
                            </a> - Contributed: {ethers.formatEther(p.amount)} ETH
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Participants;