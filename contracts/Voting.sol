// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.25;

import "hardhat/console.sol";

contract Voting {
    uint public counter = 0;

    struct Ballot {
        string question;
        string[] options;
        uint startTime;
        uint endTime;
        uint duration;
        address creator;
    }

    mapping(uint => Ballot) private _ballots;

    mapping(uint => mapping(uint => uint)) private _votes;
    mapping(uint => mapping(address => bool)) public hasVoted;

    event BallotCreated(string question, string[] options, uint startTime, uint endTime, uint duration, address creator);

    function availableBallots() external view returns (uint) {
        return counter;
    }

    function activeBallots() external view returns (Ballot[] memory) {
        Ballot[] memory _activeBallots = new Ballot[](counter);
        uint activeCounter = 0;

        for (uint i = 0; i < counter; i++) {
            if (block.timestamp >= _ballots[i].startTime && block.timestamp <= _ballots[i].endTime) {
                _activeBallots[activeCounter] = _ballots[i];
                activeCounter++;
            }
        }

        return _activeBallots;
    }

    function expiredBallots() external view returns (Ballot[] memory) {
        Ballot[] memory _expiredBallots = new Ballot[](counter);
        uint expiredCounter = 0;

        for (uint i = 0; i < counter; i++) {
            if (block.timestamp > _ballots[i].endTime) {
                _expiredBallots[expiredCounter] = _ballots[i];
                expiredCounter++;
            }
        }

        return _expiredBallots;
    }

    function createBallot(string memory question, string[] memory options,uint start_time, uint duration) external {
        // Check to make sure the ballot has atleast two options
        require(options.length >= 2, "Ballot must have a minimum of two options");

        // Check to ensure start time is now or in the future
        require(start_time >= block.timestamp, "Start time must be in the future");


        // Check to ensure duration is atleast 1 minute
        require(duration >= 60, "Duration must be at least 1 minute");

        _ballots[counter] = Ballot(question, options, start_time, start_time + duration, duration, msg.sender);
        counter++;

        emit BallotCreated(question, options, start_time, start_time + duration, duration, msg.sender);
    }

    function updateBallotTime(uint index, uint start_time, uint duration) external {
        Ballot storage ballot = _ballots[index];

        // Check to ensure the ballot exists
        require(bytes(ballot.question).length > 0, "Ballot does not exist");

        // Check to ensure the caller is the creator of the ballot
        require(msg.sender == ballot.creator, "You are not the creator of this ballot");

        // Check to ensure start time is now or in the future
        require(start_time >= block.timestamp, "Start time must be in the future");

        // Check to ensure duration is atleast 1 minute
        require(duration >= 60, "Duration must be at least 1 minute");

        ballot.startTime = start_time;
        ballot.endTime = start_time + duration;
        ballot.duration = duration;
    }

    function getBallot(uint index) external view returns (Ballot memory) {
        console.log("Ballot question: %s", _ballots[index].question);
        return _ballots[index];
    }
    

    function vote(uint ballotIndex, uint optionIndex) external {
        Ballot memory ballot = _ballots[ballotIndex];
        // console.log("Ballot start time: %s and your time is %s", ballot.startTime, block.timestamp);

        require(block.timestamp >= ballot.startTime, "Voting has not started yet");
        require(block.timestamp <= ballot.endTime, "Voting has ended");

        // Check to ensure the voter has not voted before
        require(hasVoted[ballotIndex][msg.sender] == false, "Address has already casted a vote for this question");

        // Ensure the option index is a valid one
        require(optionIndex < ballot.options.length, "Invalid option index");

        // increase the vote count for the option in the ballot
        _votes[ballotIndex][optionIndex]++;

        // mark the voter as having voted
        hasVoted[ballotIndex][msg.sender] = true;
    }

    function getVotes(uint ballotIndex, uint optionIndex) external view returns (uint) {
        return _votes[ballotIndex][optionIndex];
    }


    function results(uint ballotIndex) external view returns (uint[] memory) {
        Ballot memory ballot = _ballots[ballotIndex];
        uint len = ballot.options.length;

        uint[] memory _results = new uint[](len);

        for (uint i = 0; i < len; i++) {
            _results[i] = _votes[ballotIndex][i];
        }

        return _results;
    }


    function winners(uint ballotIndex) external view returns (bool[] memory) {
        Ballot memory ballot = _ballots[ballotIndex];
        uint len = ballot.options.length;

        uint[] memory _results = new uint[](len);
        uint max;

        for(uint i = 0; i < len; i++){
            _results[i] = _votes[ballotIndex][i];
            if(_results[i] > max){
                max = _results[i];
            }
        }

        bool[] memory _winners = new bool[](len);
        for(uint i = 0; i < len; i++){
            if(_results[i] == max){
                _winners[i] = true;
            }
        }

        return _winners;
    }
    
}

