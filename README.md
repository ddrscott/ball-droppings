
# Ball Droppings

A physics-based web game inspired by the classic "Ball Droppings" concept, built with modern web technologies. Players drop balls onto pegs and obstacles, creating musical feedback as balls bounce and collide.

## Technology Stack

- **Frontend Framework**: Next.js 15 with React 18
- **Game Engine**: Phaser 3.90 with Matter.js physics
- **Styling**: Styled Components 6 (with Next.js SWC compiler)
- **Audio**: Web Audio API with Phaser's sound system
- **Storage**: LocalForage for persistent data
- **Runtime**: Node.js 22+

## Game Mechanics

### Core Gameplay
- Click/tap to drop balls from the top of the screen
- Balls interact with static pegs and obstacles using realistic physics
- Score points by hitting targets (A=100, B=25, C=10, D=5, E=1 points)
- Game tracks clicks per second (CPS) and points per second (PPS)
- Automatic bonus drops spawn based on click frequency

### Interactive Tools
Players can select from multiple drop tools via a draggable toolbar:

1. **Puck** (`lib/tools/puck.js:7`): Standard balls with normal physics
2. **Biggy** (`lib/tools/biggy.js:6`): Larger, denser balls with reduced bounce
3. **B.Hole** (`lib/tools/gravity.js:34`): Creates black holes that attract nearby objects

### Physics Engine
- Built on Matter.js with custom attractors (`lib/attractors.js`)
- World gravity decreases as black holes are added
- Collision detection triggers sound effects with depth-based pitch modulation
- Objects are automatically destroyed when they fall off-screen

## Map Creation System

The game features a unique ASCII-based map creation system that makes level design intuitive and maintainable.

### Map Structure

Maps are defined in individual files under `/maps/` and follow this pattern:

```javascript
import {config} from '../components/maps';
import maps from '../maps';

maps.push({
    ...config,
    name: "Level Name",
    layout: `
|                             |
|     o     o     o     o     |
|  o     o     o     o     o  |
|     o     o     o     o     |
|  |B |C |D |E |E |D |C |B |  |
|  |  |  |  |  |  |  |  |  |  |`
});
```

### ASCII Characters & Physics Objects

Each character in the layout string represents a different game element:

| Character | Object Type | Physics Properties | Location |
|-----------|-------------|-------------------|----------|
| `\|` | Wall/Barrier | Static rectangle, low friction | `lib/board.js:280` |
| `o` | Small Peg | Static circle, bouncy, wood sound | `lib/board.js:267` |
| `O` | Large Peg | Static circle, 1.5x size, wood sound | `lib/board.js:273` |
| `^` | Triangle | Swinging triangle, constrained to point | `lib/board.js:284` |
| `A-E` | Score Targets | Invisible sensors with point values | `lib/board.js:295` |
| ` ` (space) | Empty Space | No collision | - |

### Auto-Scaling System

The map system includes intelligent auto-scaling (`lib/board.js:225`):

- **x_increment: 'auto'**: Automatically divides screen width by map width
- **y_increment: 'auto'**: Automatically divides screen height by map height
- Manual pixel values can override auto-scaling when needed

### Map Configuration

Base configuration in `components/maps.js`:

```javascript
export const config = {
    x_increment: 'auto',  // Horizontal spacing
    y_increment: 'auto',  // Vertical spacing
    name: 'No name',      // Display name
    minPoints: 300000,    // Points needed to "win"
    layout: `...`         // ASCII layout string
};
```

### Unique Design Features

1. **First Line Ignored**: The first newline in layout strings is always ignored for cleaner formatting
2. **Dynamic Positioning**: Objects auto-position based on their character location in the grid
3. **Sound Mapping**: Each peg type has associated collision sounds with pitch variation
4. **Target Zones**: Invisible scoring areas can be placed anywhere in the layout
5. **Constraint Physics**: Triangle pegs swing realistically using world constraints

## Audio System

### Dynamic Music
- Background music fades in/out based on game state (`lib/music.js`)
- Music rate adjusts dynamically during gameplay
- Two instrumental tracks by Chad Crouch included

### Collision Sounds
- Wood collision samples (`wood-01` through `wood-06`) triggered by impact force
- Pitch modulation based on vertical position creates depth effect (`lib/board.js:121`)
- Volume scales with collision intensity

## Build Process

### Development Setup
```bash
npm install
npm run dev
```

### Testing
Integration tests are available using Playwright:

```bash
# Install test dependencies and browsers
npm install --save-dev @playwright/test
npx playwright install

# Run all tests
npx playwright test

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests with browser UI visible
npx playwright test --headed

# View HTML test report
npx playwright show-report
```

Tests cover:
- Game loading without console errors
- Menu functionality and navigation
- Game start/pause/resume mechanics
- Tool selection and object dropping
- Score tracking and map switching
- Multi-browser compatibility (Chrome, Safari, Mobile Chrome)

### Dependencies
- **Phaser 3.90**: Latest game engine with performance improvements
- **phaser3-rex-plugins 1.60+**: Updated UI plugin system
- **Next.js 15**: Modern React framework with SWC compiler
- **React 18**: Latest React with concurrent features
- **react-draggable 4.4+**: Moveable UI components
- **styled-components 6**: CSS-in-JS with native Next.js support

### Requirements
- **Node.js 22+**: Required for development and building
- **WebGL Support**: Required for optimal performance
- **Modern Browser**: ES2018+ support recommended
- Auto-scales to fit different screen sizes
- Touch events supported for mobile devices

## File Structure

```
├── components/          # React UI components
│   ├── game.js         # Main game wrapper
│   ├── toolbar.js      # Drop tool selector
│   └── maps.js         # Map configuration base
├── lib/                # Game logic and utilities
│   ├── board.js        # Main game scene
│   ├── attractors.js   # Matter.js attractor plugin
│   ├── music.js        # Audio management
│   └── tools/          # Interactive drop tools
├── maps/               # Level definitions
│   ├── 001_such_simple.js
│   └── index.js        # Maps registry
├── pages/              # Next.js pages
└── public/             # Static assets
    ├── audio/          # Sound effects
    ├── images/         # Textures and sprites
    └── music/          # Background tracks
```

## Development Notes

### Adding New Maps
1. Create new file in `/maps/` following naming convention
2. Import base config and maps array
3. Define layout using ASCII characters
4. Push to maps array - auto-loaded by Next.js

### Creating New Tools
1. Create class in `/lib/tools/` with required methods:
   - `label`: Display name
   - `onUp(scene, event)`: Handle click release
   - `onDown(scene, event)`: Handle click start (optional)
   - `onPointerMove(scene, event)`: Handle drag (optional)
2. Import and add to `TOOLS` array in `components/toolbar.js`

### Physics Customization
- Modify gravity, friction, and bounce values in `lib/board.js`
- Collision sound mapping in `PINGS` array
- Target scoring values in `TARGETS` object

This architecture makes Ball Droppings highly extensible while maintaining clean separation between game logic, physics, and presentation layers.

## Credits
- Animal Circles :: https://www.kenney.nl/assets/animal-pack-redux
- Ding Sound :: Bell, Counter, A.wav" by InspectorJ (www.jshaw.co.uk) of Freesound.org
