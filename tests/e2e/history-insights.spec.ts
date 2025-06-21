import { test, expect } from '@playwright/test'

test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    // First log some moods to test with
    await page.goto('/')
    
    // Log today's mood
    await page.locator('.mood-option').nth(3).click() // Happy
    await page.locator('#mood-tags').fill('test, automated')
    await page.locator('#save-mood').click()
    await expect(page.locator('text=✓ Mood saved successfully!')).toBeVisible()
    
    // Navigate to history
    await page.locator('a[data-route="/history"]').click()
  })

  test('should display calendar with mood entries', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Mood History')

    // Check calendar is visible
    await expect(page.locator('.calendar-grid')).toBeVisible()

    // Check calendar has proper structure
    await expect(page.locator('.grid-cols-7')).toBeVisible()

    // Should show current month/year
    const currentDate = new Date()
    const monthYear = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
    await expect(page.locator('h2')).toContainText(monthYear)

    // Today should be highlighted
    await expect(page.locator('.calendar-day.today')).toBeVisible()

    // Today should have a mood indicator since we just logged one
    await expect(page.locator('.calendar-day.today.has-mood')).toBeVisible()
  })

  test('should navigate between months', async ({ page }) => {
    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })

    // Click previous month
    await page.locator('#prev-month').click()
    
    const prevDate = new Date(currentDate)
    prevDate.setMonth(prevDate.getMonth() - 1)
    const prevMonth = prevDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
    
    await expect(page.locator('h2')).toContainText(prevMonth)

    // Click next month to go back
    await page.locator('#next-month').click()
    await expect(page.locator('h2')).toContainText(currentMonth)
  })

  test('should show mood details when clicking a date', async ({ page }) => {
    // Click on today (which should have a mood)
    await page.locator('.calendar-day.today').click()

    // Should show mood detail panel
    await expect(page.locator('#mood-detail')).toBeVisible()

    // Should show the logged mood details
    await expect(page.locator('#mood-detail')).toContainText('Happy')
    await expect(page.locator('#mood-detail')).toContainText('test')
    await expect(page.locator('#mood-detail')).toContainText('automated')

    // Should have edit and delete buttons
    await expect(page.locator('#edit-mood')).toBeVisible()
    await expect(page.locator('#delete-mood')).toBeVisible()

    // Close detail panel
    await page.locator('#close-detail').click()
    await expect(page.locator('text=Select a date from the calendar')).toBeVisible()
  })

  test('should show monthly statistics', async ({ page }) => {
    // Should show stats for current month
    await expect(page.locator('text=Summary')).toBeVisible()
    await expect(page.locator('text=Days logged')).toBeVisible()
    await expect(page.locator('text=Average mood')).toBeVisible()
    await expect(page.locator('text=Most common mood')).toBeVisible()

    // Should show at least 1 day logged (today)
    const daysLogged = page.locator('text=Days logged').locator('xpath=preceding-sibling::div')
    await expect(daysLogged).toContainText('1')
  })
})

test.describe('Insights Page', () => {
  test.beforeEach(async ({ page }) => {
    // Log multiple moods to create data for insights
    await page.goto('/')
    
    // Log today's mood
    await page.locator('.mood-option').nth(3).click()
    await page.locator('#mood-tags').fill('work, productive')
    await page.locator('#save-mood').click()
    await expect(page.locator('text=✓ Mood saved successfully!')).toBeVisible()
    
    // Navigate to insights
    await page.locator('a[data-route="/insights"]').click()
  })

  test('should display insights overview', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Mood Insights')

    // Check timeframe selector
    await expect(page.locator('.timeframe-btn')).toHaveCount(3)
    await expect(page.locator('text=Last 7 days')).toBeVisible()
    await expect(page.locator('text=Last 30 days')).toBeVisible()
    await expect(page.locator('text=All time')).toBeVisible()

    // Default should be 30 days
    await expect(page.locator('.timeframe-btn.active')).toContainText('Last 30 days')
  })

  test('should show statistics cards', async ({ page }) => {
    // Should show stats cards
    await expect(page.locator('text=Days logged')).toBeVisible()
    await expect(page.locator('text=Average mood')).toBeVisible()
    await expect(page.locator('text=Day streak')).toBeVisible()
    await expect(page.locator('text=Unique tags')).toBeVisible()

    // Should show at least 1 day logged
    const statsCards = page.locator('.grid-cols-2.md\\:grid-cols-4 .card')
    await expect(statsCards).toHaveCount(4)
  })

  test('should display charts when data is available', async ({ page }) => {
    // Should show chart containers
    await expect(page.locator('text=Mood Trend')).toBeVisible()
    await expect(page.locator('text=Mood Distribution')).toBeVisible()

    // Should have canvas elements for charts
    await expect(page.locator('#trend-chart')).toBeVisible()
    await expect(page.locator('#frequency-chart')).toBeVisible()
  })

  test('should show tag insights', async ({ page }) => {
    // Should show tag insights section
    await expect(page.locator('text=Tag Insights')).toBeVisible()

    // Should show the tags we logged
    await expect(page.locator('text=work')).toBeVisible()
    await expect(page.locator('text=productive')).toBeVisible()
  })

  test('should switch between timeframes', async ({ page }) => {
    // Click "Last 7 days"
    await page.locator('text=Last 7 days').click()
    await expect(page.locator('.timeframe-btn.active')).toContainText('Last 7 days')

    // Click "All time"
    await page.locator('text=All time').click()
    await expect(page.locator('.timeframe-btn.active')).toContainText('All time')

    // Data should update (though in this case might be the same since we only have today's data)
    await expect(page.locator('.grid-cols-2.md\\:grid-cols-4 .card')).toHaveCount(4)
  })

  test('should handle empty state', async ({ page }) => {
    // Clear any existing data by going to settings and clearing
    await page.locator('a[data-route="/settings"]').click()
    
    // Scroll to danger zone and clear data
    await page.locator('#clear-all-data').scrollIntoViewIfNeeded()
    await page.locator('#clear-all-data').click()
    
    // Type DELETE to confirm
    await page.locator('input[type="text"]').last().fill('DELETE')
    await page.keyboard.press('Enter')
    
    // Go back to insights
    await page.locator('a[data-route="/insights"]').click()
    
    // Should show empty state
    await expect(page.locator('text=No data to analyze')).toBeVisible()
    await expect(page.locator('text=Log Your First Mood')).toBeVisible()
  })
})

test.describe('Data Flow Integration', () => {
  test('should show mood data across all pages', async ({ page }) => {
    // Start on home page and log a mood
    await page.goto('/')
    await page.locator('.mood-option').nth(4).click() // Very happy
    await page.locator('#mood-tags').fill('integration, test, happy')
    await page.locator('#save-mood').click()
    await expect(page.locator('text=✓ Mood saved successfully!')).toBeVisible()

    // Check history page shows the mood
    await page.locator('a[data-route="/history"]').click()
    await expect(page.locator('.calendar-day.today.has-mood')).toBeVisible()
    
    // Click on today to see details
    await page.locator('.calendar-day.today').click()
    await expect(page.locator('#mood-detail')).toContainText('Very Happy')
    await expect(page.locator('#mood-detail')).toContainText('integration')

    // Check insights page shows the data
    await page.locator('a[data-route="/insights"]').click()
    await expect(page.locator('text=1')).toBeVisible() // Days logged
    await expect(page.locator('text=integration')).toBeVisible()
    await expect(page.locator('text=test')).toBeVisible()
    await expect(page.locator('text=happy')).toBeVisible()

    // Check that charts are rendered
    await expect(page.locator('#trend-chart')).toBeVisible()
    await expect(page.locator('#frequency-chart')).toBeVisible()
  })
})