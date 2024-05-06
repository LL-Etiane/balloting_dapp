const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("Voting", function (){
    async function deployVotingContract() {
        const [owner, addr1, addr2] = await ethers.getSigners(); 
        const votingContract = await ethers.deployContract("Voting")

        return { owner, addr1, addr2, votingContract };
    }

    describe("Creating a ballot", function(){
        it("Should create a ballot", async function(){
            const { votingContract } = await loadFixture(deployVotingContract);
            const startTime = await time.latest() + 60;
            const duration = 400; // the ballot will be open for 400 seconds
            const question = "What is your favorite color?";

            const options = ["Red", "Green", "Blue"];

            await votingContract.createBallot(question, options, startTime, duration);

            const ballot = await votingContract.getBallot(0);

            expect(ballot.startTime).to.equal(startTime);
            expect(ballot.duration).to.equal(duration);
            expect(ballot.question).to.equal(question);
        });

        it("Should revert if ballot has less than 2 options", async function(){
            const { votingContract } = await loadFixture(deployVotingContract);
            const startTime = await time.latest() + 60;
            const question = "What is your favorite color?";
            const duration = 60;
            const options = ["Red"];

            await expect(votingContract.createBallot(question, options, startTime, duration)).to.be.revertedWith("Ballot must have a minimum of two options");
        });
        
        it("Should revert if the start time is less than the current time", async function(){
            const { votingContract } = await loadFixture(deployVotingContract);
            const startTime = await time.latest() - 60;
            const question = "What is your favorite color?";
            const duration = 60;
            const options = ["Red", "Green", "Blue"];

            await expect(votingContract.createBallot(question, options, startTime, duration)).to.be.revertedWith("Start time must be in the future");
        
        });

        it("Should revert if the duration is less than 1 minute", async function(){
            const { votingContract } = await loadFixture(deployVotingContract);
            const startTime = await time.latest() + 60;
            const question = "What is your favorite color?";
            const duration = 0;
            const options = ["Red", "Green", "Blue"];

            await expect(votingContract.createBallot(question, options, startTime, duration)).to.be.revertedWith("Duration must be at least 1 minute");
        });
    })

    describe("Casting a vote", function(){
        let owner, addr1, addr2, votingContract;
        let duration = 400;

        beforeEach(async function(){
            ({ owner, addr1, addr2, votingContract } = await loadFixture(deployVotingContract));
            const startTime = await time.latest() + 60;
            const question = "What is your favorite color?";
            const options = ["Red", "Green", "Blue"];

            await votingContract.createBallot(question, options, startTime, duration);
        });

        it("should be able to vote", async function(){
            await time.increase(90)
            await votingContract.vote(0, 0);
            
            expect(await votingContract.hasVoted(0, owner.address)).to.be.true;
            expect(await votingContract.getVotes(0, 0)).to.equal(1);
        })

        it("should revert if the user tries to vote before the start time", async function(){
            await expect(votingContract.vote(0, 0)).to.be.revertedWith("Voting has not started yet");
        })

        it("should revert if the user tries to vote after the end time", async function(){
            await time.increase(duration + 60);
            await expect(votingContract.vote(0, 0)).to.be.revertedWith("Voting has ended");
        
        })
        
        it("should revert if the user tries to vote multiple times", async function(){
            await time.increase(90);
            await votingContract.vote(0, 0);
            await expect(votingContract.vote(0, 0)).to.be.revertedWith("Address has already casted a vote for this question");
        })
    })

    describe("Counting votes", function(){
        let owner, addr1, addr2, votingContract;
        let duration = 400;

        beforeEach(async function(){
            ({ owner, addr1, addr2, votingContract } = await loadFixture(deployVotingContract));
            const startTime = await time.latest() + 60;
            const question = "What is your favorite color?";
            const options = ["Red", "Green", "Blue"];

            await votingContract.createBallot(question, options, startTime, duration);
        });

        it("should return the correct number of votes", async function(){
            await time.increase(90);
            await votingContract.vote(0, 0);
            await votingContract.connect(addr1).vote(0, 0);
            await votingContract.connect(addr2).vote(0, 1);

            expect(await votingContract.results(0)).to.deep.equal([2, 1, 0]);
        })

        it("should return the correct winner", async function(){
            await time.increase(90);

            await votingContract.vote(0, 0);
            
            expect(await votingContract.winners(0)).to.deep.eq([true, false, false]);
        })

        it("should return the correct winner if there is a tie", async function(){
            await time.increase(90);

            await votingContract.vote(0, 0);
            await votingContract.connect(addr1).vote(0, 1);
            
            expect(await votingContract.winners(0)).to.deep.eq([true, true, false]);
        })
    })
});