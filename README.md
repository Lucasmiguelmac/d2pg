# D2 Playground

An **unofficial** interactive web playground for creating diagrams with [D2](https://d2lang.com/) - a modern diagram scripting language.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is D2?

**D2** (Declarative Diagramming) is a text-based diagram scripting language that turns simple code into beautiful diagrams. Instead of dragging boxes and arrows in a visual editor, you write expressive code like:

```d2
# Create a simple diagram
x -> y: Hello
y -> z: World

# Shape configurations
x.shape: circle
z.style.fill: "#d4a5a5"
```

And D2 renders it into polished, professional diagrams. Perfect for architecture diagrams, flowcharts, network topologies, and system designs.

## Features

✨ **Live Preview** - See your diagrams update in real-time as you type  
🎨 **Interactive Canvas** - Zoom, pan, and explore your diagrams  
💾 **Auto-save** - Your work is automatically saved to browser localStorage  
⌨️ **Keyboard Shortcuts** - Fast workflow with `Ctrl/Cmd+S` to compile  
📏 **Resizable Panels** - Adjust editor width to your preference  
🎯 **Collapsible Sidebar** - Maximize diagram viewing space  
🔄 **Smart Zoom** - Ctrl+scroll to zoom, automatic fit-to-view  
🌙 **Dark Theme** - Easy on the eyes for long coding sessions

## Quick Start

### Try It Online

Just visit the playground and start typing D2 code! Your diagrams are automatically saved in your browser.

### Run Locally

```bash
# Clone the repository
git clone https://github.com/Lucasmiguelmac/d2pg.git
cd d2pg

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### Basic Example

Type this in the editor:

```d2
# Simple flow
Users -> API: Request
API -> Database: Query
Database -> API: Results
API -> Users: Response

# Style it
API.shape: hexagon
Database.shape: cylinder
```

Press `Ctrl+S` (or `Cmd+S` on Mac) to compile and see your diagram!

### Interactive Controls

- **Compile**: `Ctrl/Cmd+S` or click "Compile" button
- **Zoom**: Hold `Ctrl/Cmd` and scroll
- **Pan**: Click and drag the canvas
- **Reset Zoom**: Click "Reset Zoom" button
- **Toggle Editor**: Click `‹` / `›` buttons

### Advanced Examples

**Architecture Diagram:**
```d2
cloud: Cloud Infrastructure {
  lb: Load Balancer
  app: Application Servers {
    web1: Web Server 1
    web2: Web Server 2
  }
  db: Database {
    primary: Primary DB
    replica: Replica DB
  }
}

cloud.lb -> cloud.app.web1
cloud.lb -> cloud.app.web2
cloud.app.web1 -> cloud.db.primary
cloud.app.web2 -> cloud.db.primary
cloud.db.primary -> cloud.db.replica: sync
```

**Network Topology:**
```d2
internet: Internet
router: Router
switch: Switch
devices: {
  pc1: Computer 1
  pc2: Computer 2
  printer: Printer
}

internet -> router
router -> switch
switch -> devices.pc1
switch -> devices.pc2
switch -> devices.printer

router.shape: diamond
switch.shape: rectangle
```

## Development

### Build for Production

```bash
npm run build
# or
bun run build
```

### Tech Stack

- **[Svelte](https://svelte.dev/)** - Reactive UI framework
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool
- **[@terrastruct/d2](https://www.npmjs.com/package/@terrastruct/d2)** - Official D2 compiler
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## Automatic Updates

This project uses Dependabot to automatically update the D2 compiler to the latest version, ensuring you always have access to the newest D2 features.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Disclaimer

This is an **unofficial** playground and is not affiliated with, endorsed by, or connected to [Terrastruct](https://terrastruct.com/) or the official D2 project.

For the official D2 documentation and resources, visit:
- 🌐 [D2 Official Website](https://d2lang.com/)
- 📚 [D2 Documentation](https://d2lang.com/tour/intro)
- 💻 [D2 GitHub Repository](https://github.com/terrastruct/d2)

## Acknowledgments

Built with ❤️ using the official [@terrastruct/d2](https://www.npmjs.com/package/@terrastruct/d2) compiler.

Special thanks to the Terrastruct team for creating D2!
