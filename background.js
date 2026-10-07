chrome.action.onClicked.addListener(async tab => {
  try {
    await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['cart-reset.js']});
  } catch (error) {
    console.error('Cart Reset could not open:', error);
  }
});
