# Hyperledger Fabric Asset Transfer Basic

This repository provides a step-by-step guide to setting up and running the Hyperledger Fabric Asset Transfer Basic application using JavaScript. It includes both a CLI-based interaction (`CLI.js`) and a REST API (`server.js`).

## Installation

1. **Clone the Fabric Samples Repository**
   ```sh
   git clone https://github.com/hyperledger/fabric-samples.git
   cd fabric-samples
   ```

2. **Download and Set Up Hyperledger Fabric Binaries**
   Follow the official installation guide:
   [Hyperledger Fabric Install Guide](https://hyperledger-fabric.readthedocs.io/en/release-2.2/install.html)

3. **Start the Fabric Test Network**
   ```sh
   cd test-network
   ./network.sh down  # Shut down any active Docker containers
   ./network.sh up    # Bring up the Fabric network
   ```

4. **Install and Deploy Chaincode**
   Follow the chaincode installation guide:
   [Chaincode Deployment](https://github.com/hyperledger/fabric-samples/tree/main/asset-transfer-basic)
   
   Use `chaincode-javascript` and `application-gateway-javascript`.

5. **Move to the JavaScript Application Directory**
   ```sh
   cd asset-transfer-basic/application-gateway-javascript
   ```

6. **Install Dependencies**
   ```sh
   npm install
   ```

## CLI-Based Interaction (`CLI.js`)

The `CLI.js` file provides an interactive command-line interface to perform CRUD operations on assets in the Hyperledger Fabric blockchain.

### Features:
- Create, Read, Update, Delete assets.
- List all assets stored on the blockchain.
- Uses gRPC for secure interaction with the Hyperledger Fabric network.
- Takes user input via terminal.

### Running CLI.js
```sh
node CLI.js
```

### Available Commands:
- `create` - Create a new asset (ID, Color, Size, Owner, AppraisedValue)
- `read` - Fetch details of an asset by ID
- `update` - Modify an existing asset
- `delete` - Remove an asset from the blockchain
- `list` - Retrieve all assets stored on the blockchain

## REST API (`server.js`)

The `server.js` file sets up an Express-based REST API for interacting with Hyperledger Fabric.

### Features:
- Exposes RESTful endpoints for asset CRUD operations.
- Uses gRPC for blockchain communication.
- Supports JSON-based requests and responses.

### Running the Server:
```sh
node server.js
```

### Available Endpoints:
- **Create an Asset:** `POST /asset/create`
  - Request Body:
    ```json
    {
      "id": "asset1",
      "color": "blue",
      "size": 5,
      "owner": "Tom",
      "appraisedValue": 100
    }
    ```
- **Read an Asset:** `GET /asset/read/:id`
- **Update an Asset:** `PUT /asset/update`
- **Delete an Asset:** `DELETE /asset/delete/:id`
- **List All Assets:** `GET /assets`

### Example Request Using cURL:
```sh
curl -X POST http://localhost:8000/asset/create -H "Content-Type: application/json" -d '{"id":"asset1", "color":"blue", "size":5, "owner":"Tom", "appraisedValue":100}'
```

## Summary
This setup allows users to interact with the Hyperledger Fabric blockchain using both a command-line interface and a RESTful API. The project demonstrates asset transfer operations using JavaScript-based chaincode and application logic.

Feel free to contribute and extend the project!

