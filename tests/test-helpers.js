/**
 * Test helper functions for Ball Droppings game
 */

/**
 * Wait for game to be fully loaded and ready
 */
export async function waitForGameReady(page) {
  // Wait for canvas to be visible
  await page.waitForSelector('#phaser canvas');
  
  // Wait for initial game setup
  await page.waitForTimeout(1000);
  
  // Wait for any loading states to complete
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#phaser canvas');
    return canvas && canvas.width > 0 && canvas.height > 0;
  });
}

/**
 * Start the game from menu
 */
export async function startGame(page) {
  await page.waitForSelector('.main-menu');
  await page.click('button:has-text("Start")');
  await page.waitForSelector('.main-menu', { state: 'hidden' });
  await waitForGameReady(page);
}

/**
 * Pause the game
 */
export async function pauseGame(page) {
  await page.click('.score-board');
  await page.waitForSelector('.main-menu');
}

/**
 * Resume the game
 */
export async function resumeGame(page) {
  await page.click('button:has-text("Resume")');
  await page.waitForSelector('.main-menu', { state: 'hidden' });
}

/**
 * Select a tool from the toolbar
 */
export async function selectTool(page, toolName) {
  await page.click(`.toolbar-tool:has-text("${toolName}")`);
  await page.waitForSelector(`.toolbar-tool.selected:has-text("${toolName}")`);
}

/**
 * Drop an object at specific coordinates
 */
export async function dropObject(page, x, y, wait = 1000) {
  const canvas = page.locator('#phaser canvas');
  await canvas.click({ position: { x, y } });
  if (wait > 0) {
    await page.waitForTimeout(wait);
  }
}

/**
 * Create a black hole by dragging
 */
export async function createBlackhole(page, startX, startY, endX, endY) {
  await selectTool(page, 'B.Hole');
  const canvas = page.locator('#phaser canvas');
  await canvas.dragTo(canvas, {
    sourcePosition: { x: startX, y: startY },
    targetPosition: { x: endX, y: endY }
  });
}

/**
 * Get current score from the UI
 */
export async function getCurrentScore(page) {
  const scoreText = await page.locator('.score').first().textContent();
  return parseInt(scoreText) || 0;
}

/**
 * Get current top score from the UI
 */
export async function getTopScore(page) {
  const scoreText = await page.locator('.top-score').first().textContent();
  return parseInt(scoreText) || 0;
}

/**
 * Switch to a specific map
 */
export async function switchToMap(page, mapNumber) {
  await pauseGame(page);
  await page.click(`button:has-text("${mapNumber}.")`);
  // Wait for navigation if it occurs
  await page.waitForTimeout(500);
}

/**
 * Track console errors during test execution
 */
export function trackConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
    }
  });
  return errors;
}

/**
 * Verify no console errors occurred
 */
export function expectNoConsoleErrors(errors) {
  if (errors.length > 0) {
    console.log('Console errors found:', errors);
    throw new Error(`Console errors detected: ${errors.map(e => e.text).join(', ')}`);
  }
}

/**
 * Take a comparison screenshot with retry logic
 */
export async function takeGameScreenshot(page, name, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.locator('#phaser').screenshot({ path: `test-results/${name}` });
      break;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(500);
    }
  }
}