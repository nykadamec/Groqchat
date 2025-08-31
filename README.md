# GroqChat - AI Chat Assistant with Vision 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://www.ecma-international.org/ecma-262/)
[![CSS3](https://img.shields.io/badge/CSS3-Modern-blue.svg)](https://www.w3.org/TR/CSS/)

A modern Progressive Web App (PWA) for AI-powered chat conversations with advanced image analysis capabilities. Built with cutting-edge web technologies and powered by Groq's fast AI models.

*Last updated: August 31, 2025*

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
| 🌓 Dark/Light Theme | Automatic theme switching with AMOLED dark mode | ✅ |
| 💬 Chat History | Persistent chat storage with rename/delete options | ✅ |
| 📱 Responsive Design | Optimized for all devices with mobile-first approach | ✅ |
| ⚡ Fast Performance | Built with modern web standards | ✅ |
| 🎨 Minimalist UI | Clean, modern interface with smooth animations | ✅ |
| 🔄 Streaming Support | Real-time message streaming with toggle control | ✅ |
| 📝 Chat Management | Rename and delete individual chats | ✅ |
| 🎯 Interactive Elements | Hover and click effects on all buttons | ✅ |

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
1. Click the image upload button (📎)
2. Select an image from your device
3. Ask questions about the image
4. AI will analyze and describe the content

### Advanced Features
- **Streaming Toggle**: Use the green toggle switch to enable/disable real-time message streaming
- **Chat Management**: Hover over chat items to see rename (✏️) and delete (🗑️) buttons
- **Theme Switching**: Click the theme toggle button to switch between light and dark modes
- **Language Selection**: Choose between Czech and English in settings

### Settings
- **Theme**: Toggle between light, dark, and AMOLED dark modes
- **Language**: Switch between Czech and English
- **API Key**: Update your Groq API key
- **Model Selection**: Choose from available AI models
- **Chat History**: Enable/disable persistent chat storage
- **Clear History**: Remove all chat messages and start fresh

## 🛠️ Development

### Project Structure
```
groqchat/
├── index.html                 # Main HTML file with sidebar and composer
├── manifest.json              # PWA manifest for app installation
├── service-worker.js          # Service worker for offline functionality
├── js/
│   ├── main.js               # Main application entry point and module initialization
│   └── modules/
│       ├── chat.js           # Chat functionality, message handling, and chat management
│       ├── composer.js       # Composer UI and input handling
│       ├── config.js         # Configuration constants and API settings
│       ├── groq.js           # Groq API integration and error handling
│       ├── i18n.js           # Internationalization system
│       ├── pwa.js            # PWA functionality and install prompts
│       ├── settings.js       # User settings management
│       └── ui.js             # UI management and event handlers
├── style/
│   ├── style.css             # Main desktop stylesheet
│   ├── style-mobile.css      # Mobile-specific styles and responsive design
│   └── composer.css          # Composer-specific styling
├── locales/
│   ├── cs.json               # Czech language translations
│   └── en.json               # English language translations
└── README.md                 # Project documentation
```

### Technologies Used
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **UI Framework**: Custom CSS with Flexbox and Grid
- **Animations**: CSS Transitions and Transforms
- **Icons**: Font Awesome 6
- **PWA**: Service Worker API, Web App Manifest
- **Storage**: LocalStorage for chat history and settings
- **Internationalization**: Custom i18n system
- **API Integration**: Fetch API for Groq communication
- **Responsive Design**: Mobile-first approach with media queries

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
A: Check file size limits (max 5MB) and supported formats (JPG, PNG, GIF).

**Q: Toggle switch not working?**
A: The green toggle controls message streaming. Make sure your browser supports modern CSS.

**Q: Chat rename/delete buttons not visible?**
A: Hover over chat items in the sidebar to reveal the action buttons.

**Q: Dark theme not applying correctly?**
A: Try refreshing the page or clearing browser cache. The app supports light, dark, and AMOLED themes.

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
