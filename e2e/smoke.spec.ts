import { expect, test, type Page } from '@playwright/test';

/** Errors the page reports (uncaught exceptions and console.error), e.g. React's hydration errors. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

/** Start like a returning visitor: welcome dialog already seen, English UI. */
async function openApp(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('gantt-welcome-seen', '1');
    localStorage.setItem('gantt-locale', 'en');
  });
  await page.goto('./');
  await expect(page.locator('[data-task-id]').first()).toBeVisible();
}

const bar = (page: Page, id: string) => page.locator(`[data-task-id="${id}"]`);

test('first visit: welcome dialog, then the sample project with no errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => localStorage.setItem('gantt-locale', 'en'));
  await page.goto('./');

  const welcome = page.getByRole('dialog', { name: /Welcome/ });
  await expect(welcome).toBeVisible();
  await expect(page.getByRole('button', { name: "Let's go" })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(welcome).toBeHidden();

  await expect(page.locator('[data-task-id]')).toHaveCount(18);
  // The prebuilt HTML used to disagree with the first client render (React error #418).
  expect(errors).toEqual([]);
});

test('a task bar can be edited, moved and resized from the keyboard', async ({ page }) => {
  await openApp(page);
  const p1a = bar(page, 'p1a');
  await expect(p1a).toHaveAttribute('aria-label', /Market & competitor research, 2026\/03\/01 to 2026\/03\/08/);

  await p1a.focus();
  await page.keyboard.press('ArrowRight');
  await expect(p1a).toHaveAttribute('aria-label', /2026\/03\/02 to 2026\/03\/09/);
  await page.keyboard.press('Shift+ArrowRight');
  await expect(p1a).toHaveAttribute('aria-label', /2026\/03\/02 to 2026\/03\/10/);
  await page.keyboard.press('Control+z');
  await page.keyboard.press('Control+z');
  await expect(p1a).toHaveAttribute('aria-label', /2026\/03\/01 to 2026\/03\/08/);

  await p1a.focus();
  await page.keyboard.press('Enter');
  const editor = page.getByRole('dialog', { name: 'Edit Task' });
  await expect(editor).toBeVisible();
  const name = editor.getByRole('textbox', { name: 'Task Name' });
  await expect(name).toBeFocused();
  await name.fill('Customer interviews');
  await page.keyboard.press('Enter');
  await expect(editor).toBeHidden();
  await expect(p1a).toHaveAttribute('aria-label', /^Customer interviews,/);
  // Focus goes back to the bar that opened the editor.
  await expect(p1a).toBeFocused();
});

test('menus open and close from the keyboard', async ({ page }) => {
  await openApp(page);
  const file = page.getByRole('button', { name: 'File', exact: true });
  await file.focus();
  await page.keyboard.press('ArrowDown');
  await expect(file).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menu', { name: 'File' }).getByRole('menuitem').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(file).toHaveAttribute('aria-expanded', 'false');
  await expect(file).toBeFocused();
});

test('switching to Mermaid and back keeps every dependency and the edits', async ({ page }) => {
  await openApp(page);
  const before = await bar(page, 'p4a').getAttribute('aria-label');

  await page.getByRole('button', { name: 'Mermaid', exact: true }).click();
  const code = page.locator('.cm-content');
  await expect(code).toContainText('after p3b p3c');
  await expect(code).toContainText('section Milestones');
  await expect(page.locator('#mermaid-split-container svg[id^="mermaid-render"]')).toBeVisible();
  await expect(page.getByText('Render Error')).toHaveCount(0);

  await page.getByRole('button', { name: 'Visual', exact: true }).click();
  await expect(bar(page, 'p4a')).toHaveAttribute('aria-label', before!);
  await expect(page.locator('[data-task-id]')).toHaveCount(18);
});

test('edits are saved in the browser and survive a reload', async ({ page }) => {
  await openApp(page);
  await bar(page, 'p1a').focus();
  await page.keyboard.press('ArrowRight');
  await expect(bar(page, 'p1a')).toHaveAttribute('aria-label', /2026\/03\/02/);
  await page.reload();
  await expect(bar(page, 'p1a')).toHaveAttribute('aria-label', /2026\/03\/02/);
});

test('Excel export downloads an .xlsx named after the project', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Excel (.xlsx)' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('Default-Project.xlsx');
  // An .xlsx is a zip archive: it starts with "PK".
  const stream = await file.createReadStream();
  const first = await new Promise<Buffer>(resolve => stream.once('data', chunk => resolve(chunk as Buffer)));
  expect(first.subarray(0, 2).toString()).toBe('PK');
});
