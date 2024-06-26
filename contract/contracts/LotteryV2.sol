// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract LotteryV2 is Initializable{
    address public manager;
    address payable[] public participants;
    mapping(address => uint) public totalParticipantContributions; // Track contributions
    mapping(address => uint) public currentParticipantContributions;
    uint public participationFee;
    string internal lotteryLog;

    event EnteredLottery(address participant, uint amount);
    event WinnersPicked(address[3] winners, uint[3] amounts);
    event ParticipantWithdrawn(address participant, uint refundAmount);
    event ParticipationFeeUpdated(uint newFee);

    // constructor(uint _participationFee) {
    //     manager = msg.sender;
    //     participationFee = _participationFee;
    // }
    function initialize(uint _participationFee) public initializer{
        manager = msg.sender;
        //Now in USD
        participationFee = _participationFee * 1e18;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Only the manager can call this.");
        _;
    }

    modifier minUSDSent() {
        require(convertEthToUSD(msg.value) >= participationFee, "Minimum Eth not sent.");
        _;
    }

    modifier participantNotExists(address participant){
        require (!verifyIfExists(participants, participant), "Participant already exists");
        _;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getParticipantCount() public view returns (uint) {
        return participants.length;
    }

    function enterLottery() external payable minUSDSent participantNotExists(msg.sender) {
        participants.push(payable(msg.sender));

        totalParticipantContributions[msg.sender] += msg.value; // Track contribution
        currentParticipantContributions[msg.sender] = msg.value;

        emit EnteredLottery(msg.sender, msg.value);
    }

    function pickWinner() public onlyManager{
        require(participants.length >= 3, "Not enough participants.");

        // Selecting three unique winners and transferring winnings
        address payable[3] memory winners;
        uint[3] memory amounts;
        
        uint prizePool = address(this).balance;

        // This will be the 5% fee for the manager
        uint managerFee = prizePool * 5 / 100;
        uint adjustedPrizePool = prizePool - managerFee;

        payable(manager).transfer(managerFee);

        uint[3] memory prizes = [adjustedPrizePool * 75 / 100, adjustedPrizePool * 15 / 100, adjustedPrizePool * 10 / 100];

        for (uint i = 0; i < 3; i++) {
            uint index = random() % participants.length;
            winners[i] = participants[index];
            amounts[i] = prizes[i];
            winners[i].transfer(amounts[i]);

            // Remove winner from participants to avoid being selected again
            delete currentParticipantContributions[participants[index]];
            participants[index] = participants[participants.length - 1];
            participants.pop();
        }

        emit WinnersPicked([address(winners[0]), address(winners[1]), address(winners[2])], amounts);

        // Resetting the lottery for the next round
        for (uint i = 0; i < participants.length; i++){
            currentParticipantContributions[participants[i]] = 0;
        }
        delete participants;
    }

    function withdrawFromLottery() public {
        require(currentParticipantContributions[msg.sender] > 0, "Not a participant or no funds to withdraw.");

        // Calculate 90% of the participant's contribution
        uint refundAmount = (currentParticipantContributions[msg.sender] * 90) / 100;
        payable(msg.sender).transfer(refundAmount);

        // Remove the participant from the array and their contribution record
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i] == msg.sender) {
                participants[i] = participants[participants.length - 1];
                participants.pop();
                break;
            }
        }

        totalParticipantContributions[msg.sender] -= currentParticipantContributions[msg.sender];
        currentParticipantContributions[msg.sender] = 0; // Reset their contribution record
        emit ParticipantWithdrawn(msg.sender, refundAmount);
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, participants.length)));
    }

    function verifyIfExists(address payable[] memory adresses, address adress) internal pure returns (bool){
        adress = payable(adress);
        bool exists = false;
        for (uint i = 0; i < adresses.length; ++i){
            if (adresses[i] == adress){
                exists = true;
                break;
            }
        }
        return exists;
    }

    function getPrice() public view returns(uint256){
        AggregatorV3Interface priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        (, int256 price,,,) = priceFeed.latestRoundData();
        //console.log(priceFeed.decimals());
        //console.log(price);
        return uint256(price * 1e10);
    }

    function convertEthToUSD(uint256 ethAmount) public view returns (uint256){
        uint ethPrice = getPrice();
        uint convertedAmount = (ethPrice * ethAmount) / 1e18;
        return convertedAmount;

    }

}