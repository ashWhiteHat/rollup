/* global BigInt */
const utils = require("../../js/utils");

/**
 * Promise to be resolved in a certain amount of time
 * @param {Number} ms - miliseconds to resolve the promise
 * @returns {Promise} - Promise
 */
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert to hexadecimal string padding until 256 characters
 * @param {Number | BigInt} n - input number
 * @returns {String} - String encoded as hexadecimal with 256 characters
 */
function padding256(n) {
    let nstr = BigInt(n).toString(16);
    while (nstr.length < 64) nstr = "0"+nstr;
    nstr = `0x${nstr}`;
    return nstr;
}

/**
 * Get zkSnark public inputs from batchBuilder
 * @param {Object} bb - batchBuilder object
 * @returns {Array} - zkSanrk public inputs 
 */
function buildPublicInputsSm(bb) {
    return [
        padding256(bb.getFinalIdx()),
        padding256(bb.getNewStateRoot()),
        padding256(bb.getNewExitRoot()),
        padding256(bb.getOnChainHash()),
        padding256(bb.getOffChainHash()),
        padding256(bb.getCountersOut()),
        padding256(bb.getInitIdx()),
        padding256(bb.getOldStateRoot()),
        padding256(bb.getFeePlanCoins()),
        padding256(bb.getFeePlanFees())
    ];
}

/**
 * Get transaction from either on-chain or on-chain event
 * @param {Object} event - Ethereum event
 * @returns {Object} - Decoded rollup transaction 
 */
function manageEvent(event) {
    if (event.event == "OnChainTx") {
        const txData = utils.decodeTxData(event.args.txData);
        return {
            IDEN3_ROLLUP_TX: txData.IDEN3_ROLLUP_TX,
            amount: txData.amount,
            loadAmount: BigInt(event.args.loadAmount),
            coin: txData.tokenId,
            fromAx: BigInt(event.args.fromAx).toString(16),
            fromAy: BigInt(event.args.fromAy).toString(16),
            fromEthAddr: BigInt(event.args.fromEthAddress).toString(),
            toAx: BigInt(event.args.toAx).toString(16),
            toAy: BigInt(event.args.toAy).toString(16),
            toEthAddr: BigInt(event.args.toEthAddress).toString(),
            onChain: txData.onChain
        };
    } else if (event.event == "OffChainTx") { //does not exxist right know
        return event.tx;
    }
}

/**
 * Prepare zkSnark inputs for smart contract
 * @param {Object} proofInput - Proof generated by snarkjs library
 * @returns {Object} - Proof structure ready to be sent to smart contract 
 */
function generateCall(proofInput){
    const proof = {};
    proof.proofA = [];
    proof.proofA[0] = padding256(proofInput.proofA[0]);
    proof.proofA[1] = padding256(proofInput.proofA[1]);

    proof.proofB = [[],[]];

    proof.proofB[0][0] = padding256(proofInput.proofB[0][1]);
    proof.proofB[0][1] = padding256(proofInput.proofB[0][0]);
    proof.proofB[1][0] = padding256(proofInput.proofB[1][1]);
    proof.proofB[1][1] = padding256(proofInput.proofB[1][0]);

    proof.proofC = [];
    proof.proofC[0] = padding256(proofInput.proofC[0]);
    proof.proofC[1] = padding256(proofInput.proofC[1]);

    if (proofInput.publicInputs){
        proof.publicInputs = [];
        for (const elem of proofInput.publicInputs)
            proof.publicInputs.push(`${padding256(elem)}`);
    }
    
    return proof;
}

/**
 * Removes all numbers from array starting at startPurge
 * Array purgues all numbers beyond startPurge
 * @param {Array} array - array of numbers
 * @param {Number} startPurge - number to start purge
 */
function purgeArray(array, startPurge){
    if (array.length === 0) return;
    if (array.slice(-1)[0] <= startPurge) return;
    if (array[0] > startPurge) {
        array.splice(0, array.length);
        return;
    }
    let indexFound = null;
    for (let i = array.length - 1; i >= 0; i--){
        if (array[i] <= startPurge){
            indexFound = i+1;
            break;
        }
    }
    if (indexFound !== null)
        array.splice(indexFound);
}

module.exports = {
    timeout,
    buildPublicInputsSm,
    manageEvent,
    generateCall,
    purgeArray,
};