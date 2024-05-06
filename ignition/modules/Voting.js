const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const VotingModule = buildModule("VotingModule", (m)=>{
  const Voting = m.contract("Voting");

  return { Voting }
})

module.exports = VotingModule