# Visual Searcher

A Chrome extension that enhances Google Search with a customizable sidebar displaying relevant image results from DuckDuckGo.

## Features

- **Real-time Image Results**: Automatically shows relevant images for your Google searches
- **Theme Support**: Adapts to light and dark mode based on browser settings
- **Customizable Sidebar**: Resize the sidebar by dragging the left edge to your preference
- **Memory**: Remembers your preferred sidebar width between sessions
- **Seamless Integration**: Blends naturally with Google's interface
- **Privacy-Focused**: Uses DuckDuckGo as the image source

## How It Works

When you search on Google, Visual Searcher:

1. Extracts your search query
2. Fetches relevant images from DuckDuckGo
3. Displays them in a clean sidebar next to your Google results

The extension runs entirely in your browser - no servers or API keys required.

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the repository folder
5. The extension will be active on Google Search pages

## Technical Details

- Built using vanilla JavaScript
- Uses Chrome Extension Manifest V3
- Communicates with DuckDuckGo image search to fetch results
- Responsive design that adapts to user preferences and screen size

## Privacy & Terms of Use

This extension:

- Does not collect any user data
- Does not use any analytics or tracking
- Respects Google and DuckDuckGo's terms of service

For detailed information, please see our [Privacy Policy](PRIVACY.md).
