# Contributing to AltSendme

Thank you for your interest in contributing to AltSendme! Your help is appreciated in making file sharing frictionless, fast, and private for everyone. 

## How You Can Help

This project welcomes contributions in several key areas:

### Real-World Testing & Bug Reports

One of the most valuable contributions is testing AltSendme in real-world scenarios and reporting any issues encountered. This project is particularly interested in:

- File transfer issues across different networks (home networks, corporate networks, VPNs, etc.)
- Edge cases with different file types and sizes
- Cross-platform compatibility issues
- Performance problems or unexpected behavior
- NAT traversal and connectivity challenges

**To report issues:**
1. Check if the issue already exists in our [Issues](https://github.com/tonyantony300/alt-sendme/issues) section
2. If not, create a new issue with:
   - A clear description of the problem
   - Steps to reproduce
   - Your operating system and AltSendme version
   - Network environment (if relevant)
   - Expected vs. actual behavior

### Rust Code Contributions

This project is always looking for help improving the Rust codebase! Whether you're:

- A seasoned Rust developer looking to optimize performance
- Someone who wants to fix bugs or add features
- A learner wanting to contribute while improving your Rust skills

**All contributions are welcome!** Areas where you can help include:

- Code refactoring and cleanup
- Core file transfer logic
- Tauri backend improvements
- Error handling and edge cases
- Performance optimizations
- Documentation improvements
- Unit and integration tests

Please refer to the [Development](#development-setup) section below for setup instructions.

### Mobile Development

This project needs help porting AltSendme to mobile platforms using **Tauri's mobile capabilities**. 

Since Tauri is cross-platform and supports mobile development, contributors with experience in:

- **Tauri mobile development** (iOS/Android)
- Rust mobile integration
- Cross-platform mobile development with Tauri
- Mobile UI/UX adaptation

...would be especially valuable. Mobile development is in the early planning stages, so there's lots of room for input on architecture and approach.

### Spread the Word

One of the simplest yet most impactful ways to contribute is through word of mouth! Help more people discover AltSendme by:

- Sharing the project with friends, colleagues, and communities
- Posting about it on social media, forums, or tech communities
- Writing blog posts or creating tutorials about your experience
- Mentioning it when someone needs a file transfer solution
- Starring the repository on GitHub to increase visibility


## Getting in Touch

Have ideas you want to discuss? Want to collaborate on a major feature? Need guidance on where to start?

**Let's connect on Discord:** [`tny_antny`](https://discord.com/users/tny_antny)

Feel free to reach out with questions, ideas, or just to say hello. Discussion about the project, guidance, and collaboration to make AltSendme better are always welcome!

## Development Setup

### Prerequisites

- Rust 1.81+
- Node.js 18+
- npm or yarn

### Getting Started

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/your-username/alt-sendme.git
   cd alt-sendme
   ```

2. **Install frontend dependencies**:
   ```bash
   cd web-app
   npm install
   ```

3. **Run in development mode**:
   ```bash
   cd src-tauri
   cargo tauri dev
   ```

4. **Build for production** (optional):
   ```bash
   cd src-tauri
   cargo tauri build --no-bundle
   ```

This will start the app with hot reload enabled for both frontend and backend changes.

### Before Submitting a Pull Request

- Ensure your code follows industry standards
- Builds without errors
- Test your changes thoroughly
- Document everything properly in PR
- Write clear commit messages

## Code of Conduct

Please be respectful and considerate in all interactions. The goal is to maintain a welcoming and inclusive environment for everyone.

## Questions?

Don't hesitate to ask questions! You can:
- Open an issue for discussion
- Reach out on Discord: [`tny_antny`](https://discord.com/users/tny_antny)
- Comment on existing issues or pull requests

Thank you for making AltSendme better! Every contribution, no matter how small, is greatly appreciated. 💚

