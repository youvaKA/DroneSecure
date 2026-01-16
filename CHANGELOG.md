# Changelog

All notable changes to the DroneSecure project will be documented in this file.

## [Unreleased] - 2026-01-16

### Fixed
- **Critical Bug Fix**: Fixed arithmetic overflow in `swapResources` function
  - Issue: The function was manually decrementing `userMissionCount` in the burn loop, but `_burn()` also calls `_update()` which decrements the counter, causing a double-decrement and arithmetic underflow
  - Solution: Removed the manual `userMissionCount[msg.sender]--` at line 124 in the burn loop, as `_burn()` handles the decrement automatically via `_update()` at line 192
  - Impact: The swap functionality now works correctly without reverting with panic code 0x11 (Arithmetic operation overflowed)
  - Tests affected: 
    - "Should swap 3 Standard tokens for 1 Medical Urgency token" ✅
    - "Should apply lock period to swapped token" ✅

### Added
- **Frontend Application**: Complete React-based user interface
  - Modern UI with gradient design and smooth animations
  - Vite for fast development and optimized builds
  - ethers.js v6 integration for Web3 interactions
  - Components:
    - **WalletConnect**: MetaMask integration
    - **CreateMission**: Create new drone missions with resource levels
    - **MissionList**: View all active missions with details
    - **SwapResources**: Exchange 3 Standard tokens for 1 Medical Urgency token
    - **Stats Dashboard**: Real-time user statistics (mission count, cooldown status)
  - Features:
    - Responsive design for desktop and mobile
    - Real-time blockchain data updates
    - Transaction status feedback
    - Error handling with user-friendly messages
    - Auto-refresh after successful transactions

- **Documentation**:
  - Frontend README with setup instructions
  - Updated main README with frontend section
  - Configuration guide for local development

### Changed
- Updated `.gitignore` to exclude frontend build artifacts
- Enhanced roadmap in README to reflect completed frontend work

## [1.0.0] - Initial Release

### Added
- ERC-721 smart contract implementation
- Resource level system (Standard, Express, Medical Urgency)
- Business constraints:
  - Maximum 4 active missions per user
  - 5-minute cooldown between mission creations
  - 10-minute transfer lock after creation
- Resource swap mechanism (3 Standard → 1 Medical Urgency)
- IPFS integration for mission metadata
- Previous owners tracking
- Transfer timestamp tracking
- Comprehensive test suite (40 tests)
- Deployment scripts
- Technical documentation
