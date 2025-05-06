#!/usr/bin/env node

/**
 * Test script for the deployed private_transfers contract
 * This script:
 * 1. Reads the package ID from .env.local
 * 2. Creates a shielded pool
 * 3. Verifies the pool was created successfully
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path configurations
const ROOT_DIR = path.resolve(__dirname, '../..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend-greeting-next');
const ENV_FILE = path.join(FRONTEND_DIR, '.env.local');

// Function to read the package ID from .env.local
function readPackageId() {
  try {
    if (!fs.existsSync(ENV_FILE)) {
      console.error(`.env.local file not found at ${ENV_FILE}`);
      return null;
    }
    
    const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
    const match = envContent.match(/NEXT_PUBLIC_TESTNET_CONTRACT_PACKAGE_ID="([^"]+)"/);
    
    if (!match || !match[1]) {
      console.error('Package ID not found in .env.local file');
      return null;
    }
    
    return match[1];
  } catch (error) {
    console.error('Error reading package ID:', error.message);
    return null;
  }
}

// Function to create a shielded pool
function createShieldedPool(packageId) {
  console.log(`Creating shielded pool with package ID: ${packageId}`);
  
  try {
    // Execute the Sui command to create a pool
    const command = `sui client call --function create --module shielded_pool --package ${packageId} --type-args 0x2::sui::SUI --gas-budget 100000000`;
    console.log(`Executing command: ${command}`);
    
    const result = execSync(command, { encoding: 'utf-8' });
    console.log('Pool creation result:', result);
    
    // Try to extract the pool ID from the response
    const objectIdMatch = result.match(/Created.+?object.+?([0x][0-9a-fA-F]+)/);
    if (objectIdMatch && objectIdMatch[1]) {
      const poolId = objectIdMatch[1];
      console.log(`Pool created successfully! Pool ID: ${poolId}`);
      console.log('\nYou can now use this Pool ID in the frontend application.');
      
      // Save the pool ID to a file for easy reference
      fs.writeFileSync(path.join(__dirname, 'pool-id.txt'), poolId);
      console.log(`Pool ID saved to ${path.join(__dirname, 'pool-id.txt')}`);
      
      return poolId;
    } else {
      console.log('Pool may have been created, but could not extract the Pool ID from the response.');
      console.log('Check the full response above for details.');
      return null;
    }
  } catch (error) {
    console.error('Error creating shielded pool:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr.toString());
    }
    return null;
  }
}

// Main execution function
async function main() {
  console.log('Starting test of the deployed contract...');
  
  // Check if sui is installed
  try {
    execSync('sui --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('Error: Sui CLI is not installed or not in PATH');
    console.error('Please install Sui CLI: https://docs.sui.io/build/install');
    process.exit(1);
  }
  
  // Check if the user is on testnet
  try {
    const activeEnv = execSync('sui client active-env', { encoding: 'utf-8' }).trim();
    console.log(`Current active Sui environment: ${activeEnv}`);
    
    if (activeEnv !== 'testnet') {
      console.error('Error: You need to be on the testnet environment to run this test');
      console.error('Run "sui client switch --env testnet" to switch to testnet');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error checking Sui environment:', error.message);
    process.exit(1);
  }
  
  // Read the package ID from .env.local
  const packageId = readPackageId();
  if (!packageId) {
    console.error('Failed to read package ID from .env.local');
    process.exit(1);
  }
  
  // Create a shielded pool
  const poolId = createShieldedPool(packageId);
  if (poolId) {
    console.log('\nTest completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the frontend application: cd ../frontend-greeting-next && npm run dev');
    console.log('2. When using the frontend, use the Pool ID from above for deposit/transfer/withdraw operations');
  } else {
    console.error('\nTest failed to create a shielded pool.');
    console.error('Check that the package ID is correct and you have enough gas.');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 