# YOUWARE.md - 3D Room Asset Placement System

## Project Overview
This is a 3D room asset placement system built with Babylon.js, allowing users to place and manipulate 3D objects in a virtual room environment. The project supports both third-person and first-person camera modes.

## Architecture

### Core Components
- **3D Scene Setup**: Babylon.js engine with camera, lighting, and shadow systems
- **Asset Management**: Preloaded 3D models (GLB format) with cloning for placement
- **Interaction System**: Mouse/pointer-based object placement, selection, and movement
- **Camera System**: Dual camera modes (ArcRotate for 3rd person, Universal for 1st person)
- **First-Person Mode**: WASD movement with camera-relative direction and height controls

### Key Files
- `js/app.js`: Main application logic, scene setup, asset management, interaction handling
- `index.html`: UI structure with control panels and canvas
- `css/style.css`: Styling for control panels and UI elements

### 3D Assets
The system supports these preloaded assets:
- **Burger**: 5x scale (0.5 scaling factor), replaces traditional cube placement
- **Juice Box**: Standard scale (0.1 scaling factor)
- **Record Machine**: Standard scale (0.1 scaling factor)
- **Mike Desk**: Procedurally generated cylinder/cone

### Asset Loading System
1. Models are preloaded on scene initialization using `BABYLON.SceneLoader.ImportMesh`
2. Preloaded models are stored in `preloadedModels` object and kept disabled
3. During placement, models are cloned from preloaded instances for performance
4. Each placed asset gets collision detection, shadow casting/receiving, and selection capabilities

### Camera Modes
- **Third-Person (Default)**: ArcRotate camera with orbit controls, asset placement/manipulation enabled
- **First-Person**: Universal camera with WASD movement, asset interaction disabled, camera position logging

### Interaction States
- **Placement Mode**: Click to place selected asset type on floor/walls
- **Selection Mode**: Click objects to select, drag to move, with grid snapping
- **First-Person Mode**: All asset interaction disabled, movement-only mode

## Key Systems

### Asset Placement Pipeline
1. User selects asset type via button (`setPlacementMode`)
2. System enters placement mode (`isPlacing = true`)
3. User clicks on floor/wall surface
4. Ray casting determines placement position
5. Asset is cloned from preloaded model and positioned
6. Collision detection, shadows, and selection are configured

### First-Person Movement
- Horizontal movement (WASD) uses camera direction projected to XZ plane
- Vertical movement (Space/C) for up/down
- Movement speed modifiers (Shift for fast, Ctrl for slow)
- Real-time camera position/rotation display for debugging

### Material and Rendering
- All assets use optimized rendering settings to prevent z-fighting
- Shadow system with directional and point lights
- Materials configured for proper depth rendering and lighting

## Development Notes

### Asset Integration
When adding new 3D assets:
1. Add to `preloadedModels` object
2. Implement preloading in scene setup
3. Add placement logic in `placeObject` function
4. Update UI button and mode handling
5. Configure scaling, collision, and shadow properties

### Camera Position Logging
First-person mode outputs camera position/rotation to console and on-screen display, useful for setting up preset camera positions or debugging movement bounds.

### Performance Considerations
- Models are preloaded once and cloned for each placement
- Rendering groups and culling strategies optimize scene performance
- Shadow casting limited to necessary objects

## Babylon.js Dependencies
- Core Babylon.js engine
- Loaders for GLB/GLTF files
- Materials library for advanced materials
- GUI system for overlays

The system is designed for real-time 3D asset placement with smooth performance and intuitive controls across both camera modes.