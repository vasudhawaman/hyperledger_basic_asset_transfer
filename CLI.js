'use strict';

const grpc = require('@grpc/grpc-js');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TextDecoder } = require('node:util');
const readline = require('readline');

// Set up terminal interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const channelName = 'mychannel';  // Channel name
const chaincodeName = 'basic';    // Chaincode name
const mspId = 'Org1MSP';          // MSP ID

const cryptoPath = path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com');
const keyDirectoryPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
const certDirectoryPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts');
const tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
const peerEndpoint = 'localhost:7051';
const peerHostAlias = 'peer0.org1.example.com';

const utf8Decoder = new TextDecoder();

async function main() {
    // User input for command and parameters
    rl.question('Enter command (create/read/update/delete/list/exit): ', async (command) => {
        if (command === 'exit') {
            console.log('Exiting...');
            rl.close();
            return;
        }

        const client = await newGrpcConnection();
        const gateway = connect({
            client,
            identity: await newIdentity(),
            signer: await newSigner(),
            hash: hash.sha256,
        });

        try {
            const network = gateway.getNetwork(channelName);
            const contract = network.getContract(chaincodeName);

            if (command === 'create') {
                rl.question('Enter asset details (ID, Color, Size, Owner, AppraisedValue): ', async (details) => {
                    const [id, color, size, owner, appraisedValue] = details.split(',');
                    await createAsset(contract, id, color, size, owner, appraisedValue);
                    await promptAgain();
                });
            } else if (command === 'read') {
                rl.question('Enter asset ID to read: ', async (id) => {
                    await readAsset(contract, id);
                    await promptAgain();
                });
            } else if (command === 'update') {
                rl.question('Enter updated asset details (ID, Color, Size, Owner, AppraisedValue): ', async (details) => {
                    const [id, color, size, owner, appraisedValue] = details.split(',');
                    await updateAsset(contract, id, color, size, owner, appraisedValue);
                    await promptAgain();
                });
            } else if (command === 'delete') {
                rl.question('Enter asset ID to delete: ', async (id) => {
                    await deleteAsset(contract, id);
                    await promptAgain();
                });
            } else if (command === 'list') {
                await getAllAssets(contract);
                await promptAgain();
            } else {
                console.log('Invalid command');
                await promptAgain();
            }

        } catch (error) {
            console.error('Error: ', error);
        }
    });
}

async function promptAgain() {
    rl.question('Enter command (create/read/update/delete/list/exit): ', async (command) => {
        if (command === 'exit') {
            console.log('Exiting...');
            rl.close();
            return;
        }

        const client = await newGrpcConnection();
        const gateway = connect({
            client,
            identity: await newIdentity(),
            signer: await newSigner(),
            hash: hash.sha256,
        });

        try {
            const network = gateway.getNetwork(channelName);
            const contract = network.getContract(chaincodeName);

            if (command === 'create') {
                rl.question('Enter asset details (ID, Color, Size, Owner, AppraisedValue): ', async (details) => {
                    const [id, color, size, owner, appraisedValue] = details.split(',');
                    await createAsset(contract, id, color, size, owner, appraisedValue);
                    await promptAgain();
                });
            } else if (command === 'read') {
                rl.question('Enter asset ID to read: ', async (id) => {
                    await readAsset(contract, id);
                    await promptAgain();
                });
            } else if (command === 'update') {
                rl.question('Enter updated asset details (ID, Color, Size, Owner, AppraisedValue): ', async (details) => {
                    const [id, color, size, owner, appraisedValue] = details.split(',');
                    await updateAsset(contract, id, color, size, owner, appraisedValue);
                    await promptAgain();
                });
            } else if (command === 'delete') {
                rl.question('Enter asset ID to delete: ', async (id) => {
                    await deleteAsset(contract, id);
                    await promptAgain();
                });
            } else if (command === 'list') {
                await getAllAssets(contract);
                await promptAgain();
            } else {
                console.log('Invalid command');
                await promptAgain();
            }

        } catch (error) {
            console.error('Error: ', error);
        }
    });
}

async function newGrpcConnection() {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity() {
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function newSigner() {
    const keyPath = await getFirstDirFileName(keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

async function getFirstDirFileName(dirPath) {
    const files = await fs.readdir(dirPath);
    const file = files[0];
    if (!file) {
        throw new Error(`No files in directory: ${dirPath}`);
    }
    return path.join(dirPath, file);
}

async function createAsset(contract, id, color, size, owner, appraisedValue) {
    console.log('Creating asset...');
    await contract.submitTransaction('CreateAsset', id, color, size, owner, appraisedValue);
    console.log(`Asset ${id} created successfully.`);
}

async function readAsset(contract, id) {
    console.log('Reading asset...');
    const resultBytes = await contract.evaluateTransaction('ReadAsset', id);
    const resultJson = utf8Decoder.decode(resultBytes);
    console.log('Asset details:', JSON.parse(resultJson));
}

async function updateAsset(contract, id, color, size, owner, appraisedValue) {
    console.log('Updating asset...');
    await contract.submitTransaction('UpdateAsset', id, color, size, owner, appraisedValue);
    console.log(`Asset ${id} updated successfully.`);
}

async function deleteAsset(contract, id) {
    console.log('Deleting asset...');
    await contract.submitTransaction('DeleteAsset', id);
    console.log(`Asset ${id} deleted successfully.`);
}

async function getAllAssets(contract) {
    console.log('Listing all assets...');
    const resultBytes = await contract.evaluateTransaction('GetAllAssets');
    const resultJson = utf8Decoder.decode(resultBytes);
    console.log('All assets:', JSON.parse(resultJson));
}

// Run the application
main().catch((error) => {
    console.error('Application failed:', error);
    process.exitCode = 1;
});
