'use strict';

const express = require('express');
const grpc = require('@grpc/grpc-js');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TextDecoder } = require('node:util');


const app = express();
const port = 8000;


app.use(express.json());

// Hyperledger Fabric settings
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

// Set up gRPC connection and gateway
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

// Routes

// Create a new asset
app.post('/asset/create', async (req, res) => {
    try {
        const { id, color, size, owner, appraisedValue } = req.body;
        const client = await newGrpcConnection();
        const gateway = connect({
            client,
            identity: await newIdentity(),
            signer: await newSigner(),
            hash: hash.sha256,
        });

        const network = gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);
        
        await createAsset(contract, id, color, size, owner, appraisedValue);
        res.status(201).send(`Asset ${id} created successfully.`);
    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).send('Error creating asset');
    }
});

// Read an existing asset
app.get('/asset/read/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await newGrpcConnection();
        const gateway = connect({
            client,
            identity: await newIdentity(),
            signer: await newSigner(),
            hash: hash.sha256,
        });

        const network = gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);

        const asset = await readAsset(contract, id);
        res.status(200).json(asset);
    } catch (error) {
        console.error('Error reading asset:', error);
        res.status(500).send('Error reading asset');
    }
});

// Update an existing asset
app.put('/asset/update', async (req, res) => {
    try {
        const { id, color, size, owner, appraisedValue } = req.body;
        const client = await newGrpcConnection();
        const gateway = connect({
            client,
            identity: await newIdentity(),
            signer: await newSigner(),
            hash: hash.sha256,
        });

        const network = gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);

        await updateAsset(contract, id, color, size, owner, appraisedValue);
        res.status(200).send(`Asset ${id} updated successfully.`);
    } catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).send('Error updating asset');
    }
});

// Delete an asset
app.delete('/asset/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await newGrpcConnection();
        const gateway = connect({
            client,
            identity: await newIdentity(),
            signer: await newSigner(),
            hash: hash.sha256,
        });

        const network = gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);

        await deleteAsset(contract, id);
        res.status(200).send(`Asset ${id} deleted successfully.`);
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).send('Error deleting asset');
    }
});

// List all assets
app.get('/assets', async (req, res) => {
    try {
        const client = await newGrpcConnection();
        const gateway = connect({
            client,
            identity: await newIdentity(),
            signer: await newSigner(),
            hash: hash.sha256,
        });

        const network = gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);

        const assets = await getAllAssets(contract);
        res.status(200).json(assets);
    } catch (error) {
        console.error('Error listing assets:', error);
        res.status(500).send('Error listing assets');
    }
});

// Helper functions (same as before)
async function createAsset(contract, id, color, size, owner, appraisedValue) {
    await contract.submitTransaction('CreateAsset', id, color, size, owner, appraisedValue);
}

async function readAsset(contract, id) {
    const resultBytes = await contract.evaluateTransaction('ReadAsset', id);
    return JSON.parse(utf8Decoder.decode(resultBytes));
}

async function updateAsset(contract, id, color, size, owner, appraisedValue) {
    await contract.submitTransaction('UpdateAsset', id, color, size, owner, appraisedValue);
}

async function deleteAsset(contract, id) {
    await contract.submitTransaction('DeleteAsset', id);
}

async function getAllAssets(contract) {
    const resultBytes = await contract.evaluateTransaction('GetAllAssets');
    return JSON.parse(utf8Decoder.decode(resultBytes));
}

// Start server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
