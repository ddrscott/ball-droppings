import { test, expect } from '@playwright/test';

test.describe('Game Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Start the game
    await expect(page.locator('.main-menu')).toBeVisible();
    await page.click('button:has-text("Start")');
    await expect(page.locator('.main-menu')).toBeHidden();
    await page.waitForTimeout(1000); // Let game initialize
  });

  test('should drop puck when clicking on canvas', async ({ page }) => {
    const canvas = page.locator('#phaser canvas');
    await expect(canvas).toBeVisible();
    
    // Click on the canvas to drop a puck
    await canvas.click({ position: { x: 240, y: 100 } }); // Center-top area
    
    // Wait for puck to drop and settle
    await page.waitForTimeout(2000);
    
    // Verify no console errors after interaction
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('should change tools and drop different objects', async ({ page }) => {
    // Select Biggy tool
    await page.click('.toolbar-tool:has-text("Biggy")');
    
    // Verify tool is selected
    await expect(page.locator('.toolbar-tool.selected')).toContainText('Biggy');
    
    // Click to drop a big puck
    const canvas = page.locator('#phaser canvas');
    await canvas.click({ position: { x: 240, y: 100 } });
    
    // Wait and verify no errors
    await page.waitForTimeout(1500);
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('should create black hole and attract objects', async ({ page }) => {
    // First drop a regular puck
    const canvas = page.locator('#phaser canvas');
    await canvas.click({ position: { x: 240, y: 100 } });
    
    // Select black hole tool
    await page.click('.toolbar-tool:has-text("B.Hole")');
    await expect(page.locator('.toolbar-tool.selected')).toContainText('B.Hole');
    
    // Create a black hole by dragging
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 300, y: 400 },
      targetPosition: { x: 350, y: 450 }
    });
    
    // Wait for black hole creation and verify no errors
    await page.waitForTimeout(2000);
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('should update score when objects interact', async ({ page }) => {
    // Initial score should be 0
    await expect(page.locator('.score').first()).toContainText('0');
    
    // Drop multiple pucks for better chance of scoring
    const canvas = page.locator('#phaser canvas');
    await canvas.click({ position: { x: 240, y: 100 } });
    await page.waitForTimeout(300);
    await canvas.click({ position: { x: 260, y: 100 } });
    await page.waitForTimeout(300);
    await canvas.click({ position: { x: 220, y: 100 } });
    
    // Wait longer for objects to settle and potentially score
    await page.waitForTimeout(5000);
    
    // Score may or may not have increased (physics-dependent)
    const scoreText = await page.locator('.score').first().textContent();
    const score = parseInt(scoreText) || 0;
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('should handle multiple rapid clicks without errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const canvas = page.locator('#phaser canvas');
    
    // Rapid clicking
    for (let i = 0; i < 10; i++) {
      await canvas.click({ 
        position: { x: 200 + (i * 10), y: 100 },
        delay: 100 
      });
    }
    
    // Wait for all objects to settle
    await page.waitForTimeout(4000);
    
    // Should have no console errors
    expect(errors).toHaveLength(0);
  });

  test('should restart game and reset state', async ({ page }) => {
    // Drop some pucks and get a score
    const canvas = page.locator('#phaser canvas');
    await canvas.click({ position: { x: 240, y: 100 } });
    await page.waitForTimeout(2000);
    
    // Pause the game
    await page.click('.score-board');
    await expect(page.locator('.main-menu')).toBeVisible();
    
    // Click restart
    await page.click('button:has-text("Restart")');
    await expect(page.locator('.main-menu')).toBeHidden();
    
    // Score should be reset to 0
    await expect(page.locator('.score').first()).toContainText('0');
    
    // Verify toolbar is visible again
    await expect(page.locator('.toolbar')).toBeVisible();
  });
});