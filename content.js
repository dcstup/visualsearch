// content.js - Handles integration with Google search page and image display with theme support

// Extract search query from Google search URL or input field
function extractGoogleQuery() {
  // Try to get query from URL first
  const urlParams = new URLSearchParams(window.location.search);
  let query = urlParams.get('q');
  
  // If not found in URL, try to get from search input
  if (!query) {
    const searchInput = document.querySelector('input[name="q"]');
    query = searchInput ? searchInput.value : '';
  }
  
  return query;
}

// Get saved sidebar width from storage or use default
function getSavedWidth() {
  return new Promise(resolve => {
    chrome.storage.local.get(['sidebarWidth'], result => {
      resolve(result.sidebarWidth || 240); // Default width if not set
    });
  });
}

// Save sidebar width to storage
function saveSidebarWidth(width) {
  chrome.storage.local.set({ sidebarWidth: width });
}

// Create sidebar HTML structure
async function createSidebar() {
  // Check if sidebar already exists
  if (document.getElementById('visual-searcher-sidebar')) {
    return;
  }
  
  // Get saved width
  const savedWidth = await getSavedWidth();
  
  // Create sidebar container
  const sidebar = document.createElement('div');
  sidebar.id = 'visual-searcher-sidebar';
  sidebar.dataset.theme = getCurrentTheme(); // Set initial theme
  sidebar.style.width = `${savedWidth}px`; // Apply saved width
  
  // Add heading
  const heading = document.createElement('h3');
  heading.textContent = 'Visual Results';
  sidebar.appendChild(heading);
  
  // Add images container
  const imagesContainer = document.createElement('div');
  imagesContainer.id = 'visual-searcher-images';
  imagesContainer.className = 'loading';
  imagesContainer.textContent = 'Loading images...';
  sidebar.appendChild(imagesContainer);
  
  // Add sidebar to page
  document.body.appendChild(sidebar);
  
  // Create resize handle (outside the sidebar for independent scrolling)
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'visual-searcher-resize-handle';
  document.body.appendChild(resizeHandle);
  
  // Position the resize handle initially
  updateResizeHandlePosition(sidebar, resizeHandle);
  
  // Set up resize functionality
  setupResizeHandling(sidebar, resizeHandle);
  
  // Begin monitoring for theme changes
  setupThemeDetection();
  
  return sidebar;
}

// Update the position of the resize handle based on sidebar position
function updateResizeHandlePosition(sidebar, handle) {
  const sidebarRect = sidebar.getBoundingClientRect();
  handle.style.left = (sidebarRect.left - 5) + 'px'; // Position 5px to the left of sidebar
}

// Set up resize handling for the sidebar
function setupResizeHandling(sidebar, handle) {
  let startX, startWidth, initialRight;
  
  // Update handle position when window is resized
  window.addEventListener('resize', () => {
    updateResizeHandlePosition(sidebar, handle);
  });
  
  const startDrag = (e) => {
    // Prevent text selection during drag
    e.preventDefault();
    
    // Get initial values
    startX = e.clientX || e.touches[0].clientX;
    startWidth = parseInt(window.getComputedStyle(sidebar).width, 10);
    initialRight = parseInt(window.getComputedStyle(sidebar).right, 10);
    
    // Add dragging classes
    sidebar.classList.add('resizing');
    handle.classList.add('dragging');
    
    // Add event listeners for drag and end
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('touchmove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  };
  
  const doDrag = (e) => {
    if (!sidebar.classList.contains('resizing')) return;
    
    // Calculate new width based on drag distance
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || startX;
    const dragDistance = startX - clientX;
    let newWidth = startWidth + dragDistance;
    
    // Apply min/max constraints
    newWidth = Math.max(180, Math.min(500, newWidth));
    
    // Apply new width
    sidebar.style.width = `${newWidth}px`;
    
    // Update handle position to match the new sidebar width
    updateResizeHandlePosition(sidebar, handle);
  };
  
  const stopDrag = () => {
    // Remove dragging classes
    sidebar.classList.remove('resizing');
    handle.classList.remove('dragging');
    
    // Remove event listeners
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('touchmove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
    
    // Save the new width
    const newWidth = parseInt(window.getComputedStyle(sidebar).width, 10);
    saveSidebarWidth(newWidth);
    
    // Ensure handle is in the correct position
    updateResizeHandlePosition(sidebar, handle);
  };
  
  // Add event listeners for drag start
  handle.addEventListener('mousedown', startDrag);
  handle.addEventListener('touchstart', startDrag);
}

// Detect current theme based on color scheme preference
function getCurrentTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Set up a listener for theme changes
function setupThemeDetection() {
  const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Apply theme changes when detected
  const handleThemeChange = (e) => {
    const sidebar = document.getElementById('visual-searcher-sidebar');
    if (sidebar) {
      sidebar.dataset.theme = e.matches ? 'dark' : 'light';
    }
  };
  
  // Use the correct event based on browser support
  if (colorSchemeQuery.addEventListener) {
    colorSchemeQuery.addEventListener('change', handleThemeChange);
  } else if (colorSchemeQuery.addListener) {
    // Deprecated but needed for older browsers
    colorSchemeQuery.addListener(handleThemeChange);
  }
}

// Display images in the sidebar
function displayImages(images) {
  const imagesContainer = document.getElementById('visual-searcher-images');
  
  if (!imagesContainer) {
    return;
  }
  
  // Clear loading state
  imagesContainer.className = '';
  imagesContainer.textContent = '';
  
  // If no images found
  if (!images || images.length === 0) {
    imagesContainer.textContent = 'No images found';
    return;
  }
  
  // Add each image to the container
  images.forEach(image => {
    // Create image wrapper (for linking)
    const link = document.createElement('a');
    link.href = image.url || image.image;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Create image element
    const img = document.createElement('img');
    img.src = image.thumbnail || image.image;
    img.alt = image.title || 'Image result';
    img.title = image.title || '';
    
    // Add image to link and link to container
    link.appendChild(img);
    imagesContainer.appendChild(link);
  });
}

// Show error message in sidebar
function showError(message) {
  const imagesContainer = document.getElementById('visual-searcher-images');
  
  if (!imagesContainer) {
    return;
  }
  
  imagesContainer.className = '';
  imagesContainer.textContent = `Error: ${message}`;
}

// Initialize sidebar and request images
async function initVisualSearch() {
  // Don't proceed if we're not on a Google search page
  if (!window.location.href.includes('google.com/search')) {
    return;
  }
  
  // Extract query
  const query = extractGoogleQuery();
  
  // Don't proceed if no query found
  if (!query) {
    return;
  }
  
  // Create sidebar (now async)
  await createSidebar();
  
  // Request images from background script
  chrome.runtime.sendMessage({
    action: 'fetchImages',
    query: query
  }, response => {
    // Response handled by background.js
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'displayImages') {
    displayImages(request.images);
  } else if (request.action === 'fetchError') {
    showError(request.error);
  } else if (request.action === 'pageUpdated') {
    // Wait for Google search results to fully render
    setTimeout(() => {
      initVisualSearch().catch(() => {});
    }, 500);
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initVisualSearch().catch(() => {});
});

// Also handle dynamic page updates (Google sometimes updates content without a full page reload)
// This helps with SPA-like behavior in Google search
const observer = new MutationObserver(mutations => {
  // Check if the URL contains the search parameter
  if (window.location.href.includes('google.com/search')) {
    // Only trigger if significant changes happened to the DOM
    const significantChanges = mutations.some(mutation => 
      mutation.addedNodes.length > 0 && 
      [...mutation.addedNodes].some(node => 
        node.nodeType === Node.ELEMENT_NODE &&
        (node.id === 'search' || node.id === 'rcnt')
      )
    );
    
    if (significantChanges) {
      initVisualSearch().catch(() => {});
    }
  }
});

// Start observing changes to the DOM
observer.observe(document.body, { childList: true, subtree: true });
