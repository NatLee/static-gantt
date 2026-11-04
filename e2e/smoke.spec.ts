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

/** Task ids with their phase, in list order, as autosaved to localStorage. */
function savedOrder(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('gantt-app-v1') ?? 'null');
    const tasks: { id: string; phase: string }[] = saved?.projects?.[0]?.state?.tasks ?? [];
    return tasks.map(t => `${t.id}@${t.phase}`);
  });
}

/** Press on a bar's centre, move by (dx, dy) in small steps, release. */
async function dragBar(page: Page, id: string, dx: number, dy: number, holdMs = 0) {
  const target = bar(page, id);
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  if (holdMs) await page.waitForTimeout(holdMs);
}

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

test('dragging a bar sideways changes its dates only', async ({ page }) => {
  await openApp(page);
  // Hold longer than the 500 ms hover delay; the tooltip used to open in the middle of the drag.
  await dragBar(page, 'p2a', 50, 0, 800);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  // Staying in its own row is not a refused drop: no red "can't drop here" band.
  await expect(page.locator('.bar-drag-forbidden-indicator').first()).toBeHidden();
  await page.mouse.up();
  // 50 px at the default week zoom (10 px per day) is five days later.
  await expect(bar(page, 'p2a')).toHaveAttribute('aria-label', /2026\/03\/18 to/);
  // The drop row used to be measured from the wrong element, one row too low, so this sideways
  // drag also moved the task into the next sub-phase ("Phase 2 UI").
  await expect.poll(() => savedOrder(page)).toContain('p2a@Phase 2 UX');
  expect((await savedOrder(page)).slice(4, 6)).toEqual(['p2a@Phase 2 UX', 'p2b@Phase 2 UX']);
});

test('dragging a bar down one row puts it below its neighbour', async ({ page }) => {
  await openApp(page);
  // p2a's centre moved 60 px down lands in the lower half of p2b's row (rows are 48 px).
  await dragBar(page, 'p2a', 0, 60);
  await page.mouse.up();
  await expect.poll(async () => (await savedOrder(page)).slice(4, 6)).toEqual(['p2b@Phase 2 UX', 'p2a@Phase 2 UX']);
});

/** Drag from the connector dot at the right end of `from` onto `to` (creates "to after from"). */
async function connect(page: Page, from: string, to: string) {
  await bar(page, from).scrollIntoViewIfNeeded();
  await bar(page, from).hover();
  const dot = (await page.locator(`[data-task-id="${from}"] ~ .bar-add-btn.right.dep`).first().boundingBox())!;
  const target = (await bar(page, to).boundingBox())!;
  await page.mouse.move(dot.x + dot.width / 2, dot.y + dot.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 });
  await page.mouse.up();
}

const savedAfter = (page: Page, id: string) =>
  page.evaluate(i => {
    const saved = JSON.parse(localStorage.getItem('gantt-app-v1') ?? 'null');
    return saved?.projects?.[0]?.state?.tasks?.find((t: { id: string }) => t.id === i)?.after ?? null;
  }, id);

test("dragging from a bar's connector dot draws a dependency, and refuses a cycle", async ({ page }) => {
  await openApp(page);
  // This never worked in the released version: the connect drag got tasks without row numbers
  // and quietly gave up before drawing anything.
  await connect(page, 'p1d', 'p2d');
  await expect.poll(() => savedAfter(page, 'p2d')).toBe('p2c,p1d');

  // p1a → … → p2a already; making p1a wait for p2a would be a cycle.
  await connect(page, 'p2a', 'p1a');
  await page.waitForTimeout(600);
  expect(await savedAfter(page, 'p1a')).toBeNull();
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
