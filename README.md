# GroqChat - AI Chat Assistant with Vision 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://www.ecma-international.org/ecma-262/)

A modern Progressive Web App (PWA) for AI-powered chat conversations with advanced image analysis capabilities. Built with cutting-edge web technologies and powered by Groq's fast AI models.

## 📋 Table of Contents

- [✨ Features](#-features)
- [📸 Screenshots](#-screenshots)
- [🚀 Installation](#-installation)
- [💡 Usage](#-usage)
- [🛠️ Development](#️-development)
- [🔧 API Reference](#-api-reference)
- [❓ Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🤖 AI Chat | Powered by Groq API with multiple vision models | ✅ |
| 🖼️ Image Analysis | Upload and analyze images with AI | ✅ |
| 📱 PWA Support | Installable as a mobile/desktop app | ✅ |
| 🌍 Internationalization | Full Czech and English support | ✅ |
| 🌓 Dark/Light Theme | Automatic theme switching | ✅ |
| 💬 Chat History | Persistent chat storage | ✅ |
| 📱 Responsive Design | Optimized for all devices | ✅ |
| ⚡ Fast Performance | Built with modern web standards | ✅ |

## 📸 Screenshots

### Desktop View
![Desktop Screenshot](https://via.placeholder.com/800x400/4A90E2/FFFFFF?text=GroqChat+Desktop)

### Mobile View
![Mobile Screenshot](https://via.placeholder.com/400x600/4A90E2/FFFFFF?text=GroqChat+Mobile)

*Note: Screenshots will be updated with actual app images.*

## 🚀 Installation

### Prerequisites
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Groq API key (get one at [groq.com](https://groq.com))

### Quick Start
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd groqchat
   ```

2. **Open in browser**
   - Open `index.html` in your browser
   - Or serve with a local server for better PWA functionality

3. **Configure API Key**
   - Click the settings icon (⚙️)
   - Enter your Groq API key
   - Select your preferred language

4. **Install as PWA** (optional)
   - The app will prompt for installation
   - Or use the install button in the banner

## 💡 Usage

### Basic Chat
1. Type your message in the input field
2. Press Enter or click Send
3. AI will respond with helpful information

### Image Analysis
1. Click the image upload button
2. Select an image from your device
3. Ask questions about the image
4. AI will analyze and describe the content

### Settings
- **Theme**: Toggle between light and dark modes
- **Language**: Switch between Czech and English
- **API Key**: Update your Groq API key
- **Clear History**: Remove all chat messages

## 🛠️ Development

### Project Structure
```
groqchat/
├── index.html                 # Main HTML file
├── manifest.json              # PWA manifest
├── service-worker.js          # Service worker for caching
├── js/
│   ├── main.js               # Main application entry point
│   └── modules/
│       ├── config.js         # Configuration and constants
│       ├── i18n.js           # Internationalization system
│       ├── settings.js       # Settings management
│       ├── groq.js           # Groq API integration
│       ├── chat.js           # Chat functionality
│       ├── ui.js             # UI management and event handlers
│       └── pwa.js            # PWA functionality
├── style/
│   └── style.css             # Main stylesheet
├── locales/
│   ├── cs.json               # Czech translations
│   └── en.json               # English translations
└── README.md                 # This file
```

### Adding New Features

1. **Create Module**: Add new file in `js/modules/`
2. **Import/Export**: Use ES6 modules
3. **Initialize**: Import in `main.js`
4. **Translations**: Add keys to `locales/*.json`

### Building for Production
The app uses ES6 modules and works in modern browsers. For older browser support, use a bundler like Webpack or Rollup.

## 🔧 API Reference

### Groq Integration

The app integrates with Groq's API for AI chat and vision capabilities.

**Endpoints Used:**
- `chat/completions` - Text chat
- `chat/completions` with vision - Image analysis

**Supported Models:**
- `llama3-8b-8192` - Fast chat model
- `llama3-70b-8192` - Advanced reasoning
- `mixtral-8x7b-32768` - Code and math
- Vision models for image analysis

### Configuration
API settings are managed in `js/modules/config.js` and user preferences in `js/modules/settings.js`.

## ❓ Troubleshooting

### Common Issues

**Q: App not loading?**
A: Ensure you're using a modern browser with ES6 module support.

**Q: API key not working?**
A: Check your Groq API key is valid and has sufficient credits.

**Q: PWA not installing?**
A: Make sure you're serving over HTTPS or localhost.

**Q: Images not uploading?**
A: Check file size limits and supported formats (JPG, PNG, GIF).

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use ES6+ syntax
- Follow modular architecture
- Add tests for new features
- Update documentation
- Respect existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com) for providing fast AI models
- [Font Awesome](https://fontawesome.com) for icons
- Open source community for inspiration

---

<div align="center">
  <p>Made with ❤️ using modern web technologies</p>
  <p>
    <a href="#groqchat---ai-chat-assistant-with-vision-">Back to top</a>
  </p>
</div>
