// Copyright (c) 2023
// SPDX-License-Identifier: MIT

/// Module: viewing_keys
/// Implements selective disclosure through viewing keys
module private_transfers::viewing_keys {
    use std::vector;
    use std::string::{String};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::hash::{blake2b256};
    use sui::event::emit;
    
    // === Errors ===
    const EInvalidKey: u64 = 0;
    const EUnauthorizedAccess: u64 = 1;
    
    // === Structs ===
    
    /// Represents a viewing key that grants access to transaction details
    struct ViewingKey has key, store {
        id: UID,
        owner: address,
        key_hash: vector<u8>,
        name: String,
        active: bool,
        creation_time: u64
    }
    
    /// Holds encrypted transaction data viewable only with the correct key
    struct EncryptedTransaction has store, copy, drop {
        /// Transaction ID (nullifier)
        id: vector<u8>,
        /// AEAD encrypted data - can only be decrypted with the right viewing key
        encrypted_data: vector<u8>,
        /// Encryption nonce
        nonce: vector<u8>,
        /// Transaction timestamp
        timestamp: u64
    }
    
    /// Registry to track viewing keys and transaction history
    struct ViewingKeyRegistry has key {
        id: UID,
        /// Maps owner address to their viewing keys
        keys_by_owner: Table<address, vector<ID>>,
        /// Maps transaction ID to encrypted transaction data
        transaction_data: Table<vector<u8>, EncryptedTransaction>,
    }
    
    // === Events ===
    
    /// Emitted when a new viewing key is created
    struct ViewingKeyCreated has copy, drop {
        key_id: ID,
        owner: address
    }
    
    /// Emitted when a viewing key is revoked
    struct ViewingKeyRevoked has copy, drop {
        key_id: ID,
        owner: address
    }
    
    /// Emitted when transaction data is added
    struct TransactionDataAdded has copy, drop {
        tx_id: vector<u8>,
        recipient: address
    }
    
    // === Public Functions ===
    
    /// Create a new viewing key registry
    public fun create_registry(ctx: &mut TxContext) {
        let registry = ViewingKeyRegistry {
            id: object::new(ctx),
            keys_by_owner: table::new(ctx),
            transaction_data: table::new(ctx),
        };
        
        // Share the registry so anyone can use it
        transfer::share_object(registry);
    }
    
    /// Generate a new viewing key for the caller
    public fun generate_key(
        registry: &mut ViewingKeyRegistry,
        key_bytes: vector<u8>,
        name: String,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        
        // Hash the key bytes for storage
        let key_hash = blake2b256(&key_bytes);
        
        // Create the viewing key object
        let viewing_key = ViewingKey {
            id: object::new(ctx),
            owner,
            key_hash,
            name,
            active: true,
            creation_time: tx_context::epoch(ctx)
        };
        
        // Add to registry
        if (!table::contains(&registry.keys_by_owner, owner)) {
            table::add(&mut registry.keys_by_owner, owner, vector::empty<ID>());
        };
        
        let owner_keys = table::borrow_mut(&mut registry.keys_by_owner, owner);
        vector::push_back(owner_keys, object::id(&viewing_key));
        
        // Emit event
        emit(ViewingKeyCreated {
            key_id: object::id(&viewing_key),
            owner
        });
        
        // Transfer the key to the caller
        transfer::transfer(viewing_key, owner);
    }
    
    /// Revoke a viewing key
    public fun revoke_key(key: &mut ViewingKey, ctx: &mut TxContext) {
        // Only the owner can revoke
        assert!(key.owner == tx_context::sender(ctx), EUnauthorizedAccess);
        
        // Mark as inactive
        key.active = false;
        
        // Emit event
        emit(ViewingKeyRevoked {
            key_id: object::id(key),
            owner: key.owner
        });
    }
    
    /// Add encrypted transaction data that can be viewed with the correct key
    public fun add_transaction_data(
        registry: &mut ViewingKeyRegistry,
        tx_id: vector<u8>,
        encrypted_data: vector<u8>,
        nonce: vector<u8>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let transaction = EncryptedTransaction {
            id: tx_id,
            encrypted_data,
            nonce,
            timestamp: tx_context::epoch(ctx)
        };
        
        // Add to registry
        table::add(&mut registry.transaction_data, tx_id, transaction);
        
        // Emit event
        emit(TransactionDataAdded {
            tx_id,
            recipient
        });
    }
    
    /// Check if a key hash matches a viewing key
    public fun verify_key(key: &ViewingKey, key_bytes: vector<u8>): bool {
        if (!key.active) {
            return false
        };
        
        blake2b256(&key_bytes) == key.key_hash
    }
    
    /// Get all viewing keys for an address
    public fun get_keys_for_owner(registry: &ViewingKeyRegistry, owner: address): vector<ID> {
        if (!table::contains(&registry.keys_by_owner, owner)) {
            return vector::empty<ID>()
        };
        
        *table::borrow(&registry.keys_by_owner, owner)
    }
    
    /// Get transaction data if available
    public fun get_transaction_data(registry: &ViewingKeyRegistry, tx_id: vector<u8>): EncryptedTransaction {
        *table::borrow(&registry.transaction_data, tx_id)
    }
    
    /// Check if transaction data exists
    public fun transaction_exists(registry: &ViewingKeyRegistry, tx_id: vector<u8>): bool {
        table::contains(&registry.transaction_data, tx_id)
    }
    
    // === Test Functions ===
    
    #[test_only]
    public fun test_viewing_keys(ctx: &mut TxContext) {
        // Create a registry
        let registry = ViewingKeyRegistry {
            id: object::new(ctx),
            keys_by_owner: table::new(ctx),
            transaction_data: table::new(ctx),
        };
        
        transfer::share_object(registry);
    }
} 