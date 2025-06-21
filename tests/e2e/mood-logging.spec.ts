import { test, expect } from '@playwright/test'

test.describe('Mood Logging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the home page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Mood Snapshot/)

    // Check main heading
    await expect(page.locator('h1')).toContainText('How are you feeling today?')

    // Check mood selector is present
    await expect(page.locator('.mood-selector')).toBeVisible()

    // Check all 5 mood options are present
    const moodOptions = page.locator('.mood-option')
    await expect(moodOptions).toHaveCount(5)

    // Check navigation is present
    await expect(page.locator('.bottom-nav')).toBeVisible()
    await expect(page.locator('.nav-item')).toHaveCount(4)
  })

  test('should allow mood selection and saving', async ({ page }) => {
    // Select a mood (happy face - 4th option)
    await page.locator('.mood-option').nth(3).click()

    // Check that the selected mood is highlighted
    await expect(page.locator('.mood-option').nth(3)).toHaveClass(/selected/)

    // Check that save button is enabled
    const saveButton = page.locator('#save-mood')
    await expect(saveButton).toBeEnabled()

    // Add some tags
    await page.locator('#mood-tags').fill('work, productive, focused')

    // Save the mood
    await saveButton.click()

    // Check for success message
    await expect(page.locator('text=✓ Mood saved successfully!')).toBeVisible()

    // Check that the page now shows "Update your mood" for today
    await page.reload()
    await expect(page.locator('h1')).toContainText('Update your mood')
  })

  test('should show tag suggestions', async ({ page }) => {
    // First save a mood with tags to create suggestions
    await page.locator('.mood-option').nth(2).click()
    await page.locator('#mood-tags').fill('work, stress')
    await page.locator('#save-mood').click()
    await expect(page.locator('text=✓ Mood saved successfully!')).toBeVisible()

    // Reload and start typing to see suggestions
    await page.reload()
    await page.locator('.mood-option').nth(3).click()
    
    // Type partial tag to trigger suggestions
    await page.locator('#mood-tags').fill('wo')
    
    // Wait for suggestions to appear
    await expect(page.locator('#tag-suggestions')).toBeVisible()
    await expect(page.locator('.suggestion-item')).toContainText('work')
  })

  test('should validate mood selection requirement', async ({ page }) => {
    // Try to save without selecting mood
    const saveButton = page.locator('#save-mood')
    await expect(saveButton).toBeDisabled()

    // Add tags but no mood
    await page.locator('#mood-tags').fill('test tags')
    await expect(saveButton).toBeDisabled()

    // Select mood
    await page.locator('.mood-option').nth(0).click()
    await expect(saveButton).toBeEnabled()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation through mood options
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab') // Should focus first mood option

    // Use Enter to select mood
    await page.keyboard.press('Enter')
    
    // Check that mood is selected
    await expect(page.locator('.mood-option').first()).toHaveClass(/selected/)

    // Tab to tags input
    await page.keyboard.press('Tab')
    await expect(page.locator('#mood-tags')).toBeFocused()

    // Type tags and press Enter to save
    await page.type('#mood-tags', 'keyboard test')
    await page.keyboard.press('Enter')

    // Should save the mood
    await expect(page.locator('text=✓ Mood saved successfully!')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')

    // Navigate to History
    await page.locator('a[data-route="/history"]').click()
    await expect(page.locator('h1')).toContainText('Mood History')

    // Navigate to Insights
    await page.locator('a[data-route="/insights"]').click()
    await expect(page.locator('h1')).toContainText('Mood Insights')

    // Navigate to Settings
    await page.locator('a[data-route="/settings"]').click()
    await expect(page.locator('h1')).toContainText('Settings')

    // Navigate back to Home
    await page.locator('a[data-route="/"]').click()
    await expect(page.locator('h1')).toContainText(/feeling today/)
  })

  test('should update active navigation state', async ({ page }) => {
    await page.goto('/')

    // Home should be active initially
    await expect(page.locator('a[data-route="/"]')).toHaveClass(/active/)

    // Navigate to history
    await page.locator('a[data-route="/history"]').click()
    await expect(page.locator('a[data-route="/history"]')).toHaveClass(/active/)
    await expect(page.locator('a[data-route="/"]')).not.toHaveClass(/active/)
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    await page.goto('/')

    // Check that mood selector is visible and usable
    await expect(page.locator('.mood-selector')).toBeVisible()
    const moodOptions = page.locator('.mood-option')
    await expect(moodOptions).toHaveCount(5)

    // Check that navigation is at bottom
    await expect(page.locator('.bottom-nav')).toBeVisible()

    // Test mood selection on mobile
    await moodOptions.nth(2).click()
    await expect(moodOptions.nth(2)).toHaveClass(/selected/)
  })

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad size
    await page.goto('/')

    // Check layout adapts to tablet size
    await expect(page.locator('.mood-selector')).toBeVisible()
    await expect(page.locator('.container')).toBeVisible()

    // Test that touch interactions work
    await page.locator('.mood-option').nth(4).click()
    await expect(page.locator('.mood-option').nth(4)).toHaveClass(/selected/)
  })
})

test.describe('Error Handling', () => {
  test('should handle invalid routes gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page')
    
    // Should show 404 page
    await expect(page.locator('h1')).toContainText('Page Not Found')
    await expect(page.locator('text=Go Home')).toBeVisible()

    // Click "Go Home" link
    await page.locator('a[data-route="/"]').click()
    await expect(page.locator('h1')).toContainText(/feeling today/)
  })
})