#!/usr/bin/env node

/**
 * Deployment script for the private_transfers contract to Sui Testnet
 * This script:
 * 1. Publishes the Move contract to Sui Testnet
 * 2. Extracts the package ID from the response
 * 3. Updates the .env.local file with the package ID
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path configurations
const ROOT_DIR = path.resolve(__dirname, '../..');
const MOVE_DIR = path.join(ROOT_DIR, 'backend/move/greeting');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend-greeting-next');
const ENV_FILE = path.join(FRONTEND_DIR, '.env.local');

// Function to publish the contract to Sui network
function publishContract() {
  console.log('Publishing contract to Sui Testnet...');
  
  try {
    // First build the package
    console.log('Building package...');
    execSync('sui move build', { cwd: MOVE_DIR, stdio: 'inherit' });
    
    // Then publish to testnet
    console.log('Publishing to testnet...');
    const result = execSync('sui client publish --gas-budget 100000000 --json', { 
      cwd: MOVE_DIR, 
      encoding: 'utf-8' 
    });
    
    // Parse the JSON result to get the package ID
    const publishData = JSON.parse(result);
    console.log('Publish response:', JSON.stringify(publishData, null, 2));
    
    // Extract the package ID from the response
    let packageId = null;
    
    // Handle different response formats
    if (publishData.effects && publishData.effects.created) {
      // Find the created object that is a package
      const packageObj = publishData.effects.created.find(obj => 
        obj.owner === 'Immutable' || 
        (obj.owner && obj.owner.Immutable)
      );
      if (packageObj) {
        packageId = packageObj.reference?.objectId || packageObj.reference;
      }
    } else if (publishData.objectChanges) {
      // New format: Check objectChanges for published packages
      const publishedObj = publishData.objectChanges.find(change => 
        change.type === 'published' || 
        change.type === 'created' && change.objectType && change.objectType.includes('Package')
      );
      if (publishedObj) {
        packageId = publishedObj.packageId || publishedObj.objectId;
      }
    } else if (publishData.created) {
      // Try yet another format
      const packageObj = publishData.created.find(obj => 
        obj.owner === 'Immutable' || 
        (obj.owner && typeof obj.owner === 'object' && 'Immutable' in obj.owner)
      );
      if (packageObj) {
        packageId = packageObj.reference || packageObj.objectId;
      }
    }
    
    // As a last resort, search for a string that looks like a package ID anywhere in the response
    if (!packageId) {
      const responseStr = JSON.stringify(publishData);
      const packageIdMatch = responseStr.match(/0x[a-fA-F0-9]{40,64}/);
      if (packageIdMatch) {
        packageId = packageIdMatch[0];
      }
    }
    
    if (!packageId) {
      console.error('Failed to extract package ID from publish response');
      console.error('Response:', JSON.stringify(publishData, null, 2));
      return null;
    }
    
    console.log(`Contract published successfully. Package ID: ${packageId}`);
    return packageId;
  } catch (error) {
    console.error('Error publishing contract:', error.message);
    // If it's a child process error, log the stderr
    if (error.stderr) {
      console.error('Error details:', error.stderr.toString());
    }
    return null;
  }
}

// Function to update the .env.local file with the package ID
function updateEnvFile(packageId) {
  console.log(`Updating .env.local with package ID: ${packageId}`);
  
  try {
    // Read the current content of the .env.local file
    let envContent = '';
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf-8');
    }
    
    // Replace or add the package ID variable
    const envVar = 'NEXT_PUBLIC_TESTNET_CONTRACT_PACKAGE_ID';
    const regex = new RegExp(`${envVar}=.*`, 'g');
    
    if (envContent.match(regex)) {
      // Replace existing variable
      envContent = envContent.replace(regex, `${envVar}="${packageId}"`);
    } else {
      // Add new variable
      envContent += `\n${envVar}="${packageId}"\n`;
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(ENV_FILE, envContent);
    
    console.log('.env.local updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating .env.local file:', error.message);
    return false;
  }
}

// Main execution function
async function main() {
  console.log('Starting deployment process...');
  
  // Check if sui is installed
  try {
    execSync('sui --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('Error: Sui CLI is not installed or not in PATH');
    console.error('Please install Sui CLI: https://docs.sui.io/build/install');
    process.exit(1);
  }
  
  // Check if the user is logged in to testnet
  try {
    const activeEnv = execSync('sui client active-env', { encoding: 'utf-8' }).trim();
    console.log(`Current active Sui environment: ${activeEnv}`);
    
    if (activeEnv !== 'testnet') {
      console.log('Switching to testnet environment...');
      execSync('sui client switch --env testnet', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('Error checking or switching Sui environment:', error.message);
    process.exit(1);
  }
  
  // Publish the contract and get the package ID
  const packageId = publishContract();
  if (!packageId) {
    console.error('Failed to publish contract');
    process.exit(1);
  }
  
  // Update the .env.local file with the package ID
  const updated = updateEnvFile(packageId);
  if (!updated) {
    console.error('Failed to update .env.local file');
    process.exit(1);
  }
  
  console.log('Deployment and configuration completed successfully');
  console.log(`Contract package ID: ${packageId}`);
  console.log(`Environment file updated: ${ENV_FILE}`);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 