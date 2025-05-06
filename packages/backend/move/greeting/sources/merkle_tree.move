// Copyright (c) 2023
// SPDX-License-Identifier: MIT

/// Module: merkle_tree
/// Implements a Merkle tree for zero-knowledge proofs
module private_transfers::merkle_tree {
    use std::vector;
    use sui::hash::{blake2b256};

    // === Constants ===
    const MAX_TREE_DEPTH: u64 = 20; // Allow up to 2^20 entries
    
    // === Errors ===
    const EInvalidTreeDepth: u64 = 0;
    const ETreeFull: u64 = 1;
    const EInvalidPosition: u64 = 2;
    const EInvalidProof: u64 = 3;
    
    // === Structs ===
    
    /// A sparse Merkle tree implementation for ZK proof verification
    struct MerkleTree has store, drop {
        /// The depth of the tree
        depth: u64,
        /// The current number of leaves in the tree
        leaf_count: u64,
        /// The empty hashes at each level (for default nodes)
        empty_hashes: vector<vector<u8>>,
        /// The leaves of the tree (commitments)
        leaves: vector<vector<u8>>,
        /// The current root of the tree
        root: vector<u8>
    }
    
    // === Public Functions ===
    
    /// Create a new empty Merkle tree with the specified depth
    public fun new(depth: u64): MerkleTree {
        assert!(depth <= MAX_TREE_DEPTH, EInvalidTreeDepth);
        
        // Calculate the empty hashes for each level
        let empty_hashes = vector::empty<vector<u8>>();
        let current_hash = vector::empty<u8>();
        let i = 0;
        while (i < 32) {
            vector::push_back(&mut current_hash, 0);
            i = i + 1;
        };
        
        vector::push_back(&mut empty_hashes, current_hash);
        
        i = 1;
        while (i <= depth) {
            let prev_hash = *vector::borrow(&empty_hashes, i - 1);
            let current_hash = hash_pair(prev_hash, prev_hash);
            vector::push_back(&mut empty_hashes, current_hash);
            i = i + 1;
        };
        
        MerkleTree {
            depth,
            leaf_count: 0,
            empty_hashes,
            leaves: vector::empty(),
            root: *vector::borrow(&empty_hashes, depth)
        }
    }
    
    /// Add a leaf to the Merkle tree and update the root
    public fun insert(tree: &mut MerkleTree, leaf: vector<u8>): vector<u8> {
        // Check if tree has space
        let max_leaves = 1 << (tree.depth as u8);
        assert!(tree.leaf_count < max_leaves, ETreeFull);
        
        // Add leaf
        vector::push_back(&mut tree.leaves, leaf);
        
        // Get the position
        let position = tree.leaf_count;
        tree.leaf_count = tree.leaf_count + 1;
        
        // Update the root
        tree.root = update_tree(tree, position, leaf);
        
        // Return the new root
        tree.root
    }
    
    /// Calculate the Merkle proof for a leaf at a specific position
    public fun generate_proof(tree: &MerkleTree, position: u64): vector<vector<u8>> {
        assert!(position < tree.leaf_count, EInvalidPosition);
        
        let proof = vector::empty<vector<u8>>();
        let current_position = position;
        
        let level = 0;
        while (level < tree.depth) {
            let is_right = current_position % 2 == 1;
            let sibling_pos = if (is_right) { current_position - 1 } else { current_position + 1 };
            
            // Get the sibling hash
            let sibling_hash = if (sibling_pos < tree.leaf_count) {
                if (level == 0) {
                    // At level 0, we can directly get the leaf
                    *vector::borrow(&tree.leaves, sibling_pos)
                } else {
                    // For other levels, we need to compute it
                    // This is a simplified representation; in a real implementation
                    // we would store intermediate nodes
                    calculate_node_hash(tree, sibling_pos, level)
                }
            } else {
                // Use empty hash at this level
                *vector::borrow(&tree.empty_hashes, level)
            };
            
            vector::push_back(&mut proof, sibling_hash);
            
            // Move up the tree
            current_position = current_position / 2;
            level = level + 1;
        };
        
        proof
    }
    
    /// Verify a Merkle proof
    public fun verify_proof(
        root: vector<u8>,
        leaf: vector<u8>,
        position: u64,
        proof: vector<vector<u8>>,
        depth: u64
    ): bool {
        assert!(vector::length(&proof) == depth, EInvalidProof);
        
        let computed_hash = leaf;
        let current_position = position;
        
        let i = 0;
        while (i < depth) {
            let sibling_hash = *vector::borrow(&proof, i);
            let is_right = current_position % 2 == 1;
            
            if (is_right) {
                computed_hash = hash_pair(sibling_hash, computed_hash);
            } else {
                computed_hash = hash_pair(computed_hash, sibling_hash);
            };
            
            current_position = current_position / 2;
            i = i + 1;
        };
        
        computed_hash == root
    }
    
    /// Get the current root of the tree
    public fun get_root(tree: &MerkleTree): vector<u8> {
        tree.root
    }
    
    /// Get the number of leaves in the tree
    public fun leaf_count(tree: &MerkleTree): u64 {
        tree.leaf_count
    }
    
    // === Private Helper Functions ===
    
    /// Update the tree with a new leaf and return the new root
    fun update_tree(tree: &MerkleTree, position: u64, leaf_hash: vector<u8>): vector<u8> {
        let current_position = position;
        let current_hash = leaf_hash;
        
        let level = 0;
        while (level < tree.depth) {
            let is_right = current_position % 2 == 1;
            let sibling_pos = if (is_right) { current_position - 1 } else { current_position + 1 };
            
            // Get the sibling hash
            let sibling_hash = if (sibling_pos < tree.leaf_count) {
                if (level == 0) {
                    // At level 0, we can directly get the leaf
                    *vector::borrow(&tree.leaves, sibling_pos)
                } else {
                    // For other levels, we need to compute it
                    calculate_node_hash(tree, sibling_pos, level)
                }
            } else {
                // Use empty hash at this level
                *vector::borrow(&tree.empty_hashes, level)
            };
            
            // Compute the parent hash
            if (is_right) {
                current_hash = hash_pair(sibling_hash, current_hash);
            } else {
                current_hash = hash_pair(current_hash, sibling_hash);
            };
            
            // Move up the tree
            current_position = current_position / 2;
            level = level + 1;
        };
        
        current_hash
    }
    
    /// Calculate a node hash at a specific position and level
    fun calculate_node_hash(tree: &MerkleTree, position: u64, level: u64): vector<u8> {
        // In a real implementation, we would store nodes
        // This is a simplified approach that walks down from the position and re-calculates
        if (level == 0) {
            return *vector::borrow(&tree.leaves, position)
        };
        
        // Calculate the range of leaves under this node
        let leaves_per_node = 1 << (level as u8);
        let start_leaf = position * leaves_per_node;
        let end_leaf = start_leaf + leaves_per_node;
        
        // Limit to actual leaves
        end_leaf = if (end_leaf > tree.leaf_count) { tree.leaf_count } else { end_leaf };
        
        if (start_leaf >= tree.leaf_count) {
            // Node has no actual leaves under it, use empty hash
            return *vector::borrow(&tree.empty_hashes, level)
        };
        
        if (level == 1) {
            // For level 1, children are leaves
            let left = *vector::borrow(&tree.leaves, start_leaf);
            let right = if (start_leaf + 1 < end_leaf) {
                *vector::borrow(&tree.leaves, start_leaf + 1)
            } else {
                *vector::borrow(&tree.empty_hashes, 0)
            };
            
            return hash_pair(left, right)
        };
        
        // Recurse to lower levels
        let left_child_pos = position * 2;
        let right_child_pos = left_child_pos + 1;
        
        let left_hash = calculate_node_hash(tree, left_child_pos, level - 1);
        let right_hash = calculate_node_hash(tree, right_child_pos, level - 1);
        
        hash_pair(left_hash, right_hash)
    }
    
    /// Hash a pair of values to create a parent hash
    fun hash_pair(left: vector<u8>, right: vector<u8>): vector<u8> {
        let combined = vector::empty<u8>();
        vector::append(&mut combined, left);
        vector::append(&mut combined, right);
        blake2b256(&combined)
    }
    
    // === Test Functions ===
    
    #[test_only]
    public fun test_merkle_tree() {
        let tree = new(4); // Depth 4 allows for 16 leaves
        
        // Insert some test data
        let leaf1 = b"leaf1";
        let leaf2 = b"leaf2";
        let leaf3 = b"leaf3";
        
        let _ = insert(&mut tree, leaf1);
        let _ = insert(&mut tree, leaf2);
        let root = insert(&mut tree, leaf3);
        
        // Generate a proof for leaf2 (position 1)
        let proof = generate_proof(&tree, 1);
        
        // Verify the proof
        assert!(verify_proof(root, leaf2, 1, proof, 4), 0);
    }
} 