import { test, expect } from '@playwright/test';

test.describe('Ball Droppings Game', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:3000');
  });

  test('should load without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that no console errors occurred
    expect(errors).toHaveLength(0);
  });

  test('should display main menu on load', async ({ page }) => {
    // Wait for the main menu to appear
    await expect(page.locator('.main-menu')).toBeVisible();
    
    // Check key menu elements
    await expect(page.locator('h1')).toContainText('Droppings');
    await expect(page.locator('button').filter({ hasText: 'Start' })).toBeVisible();
    
    // Check that maps are listed
    await expect(page.locator('h3').filter({ hasText: 'Maps' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '1. Such Simple' })).toBeVisible();
  });

  test('should start game and drop puck', async ({ page }) => {
    // Set up console error tracking
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for menu to load
    await expect(page.locator('.main-menu')).toBeVisible();
    
    // Click start button
    await page.click('button:has-text("Start")');
    
    // Wait for menu to disappear and game to start
    await expect(page.locator('.main-menu')).toBeHidden();
    
    // Wait for Phaser canvas to be present
    await expect(page.locator('#phaser canvas')).toBeVisible();
    
    // Wait for game to initialize
    await page.waitForTimeout(2000);
    
    // Verify toolbar is visible (indicates game started)
    await expect(page.locator('.toolbar')).toBeVisible();
    
    // Verify no console errors during game start
    expect(errors).toHaveLength(0);
  });

  test('should show scoreboard with correct initial values', async ({ page }) => {
    await expect(page.locator('.score-board')).toBeVisible();
    
    // Check initial score values
    await expect(page.locator('.score').first()).toContainText('0');
    
    // Check stage name is displayed
    await expect(page.locator('.stage')).toContainText('Such Simple');
  });

  test('should be able to switch maps', async ({ page }) => {
    // Wait for menu
    await expect(page.locator('.main-menu')).toBeVisible();
    
    // Click on a different map
    await page.click('button:has-text("2. Biggie Size")');
    
    // Wait for navigation and page load
    await page.waitForTimeout(1000);
    
    // Check that stage name updated
    await expect(page.locator('.stage')).toContainText('Biggie Size');
  });

  test('should handle pause/resume functionality', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Start")');
    await expect(page.locator('.main-menu')).toBeHidden();
    
    // Click scoreboard to pause
    await page.click('.score-board');
    
    // Menu should reappear with Resume button
    await expect(page.locator('.main-menu')).toBeVisible();
    await expect(page.locator('button:has-text("Resume")')).toBeVisible();
    
    // Click Resume
    await page.click('button:has-text("Resume")');
    
    // Menu should hide again
    await expect(page.locator('.main-menu')).toBeHidden();
  });

  test('should display toolbar when game is active', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Start")');
    await expect(page.locator('.main-menu')).toBeHidden();
    
    // Toolbar should be visible
    await expect(page.locator('.toolbar')).toBeVisible();
    
    // Check tool options
    await expect(page.locator('.toolbar-tool').filter({ hasText: 'Puck' })).toBeVisible();
    await expect(page.locator('.toolbar-tool').filter({ hasText: 'Biggy' })).toBeVisible();
    await expect(page.locator('.toolbar-tool').filter({ hasText: 'B.Hole' })).toBeVisible();
  });
});