export async function exportToPNG(
  targetEl: HTMLElement,
  scrollContainer: HTMLElement,
  isDark: boolean,
  filter: string
) {
  const html2canvas = (await import('html2canvas-pro')).default;

  await document.fonts.ready;

  const wasLight = !isDark;
  if (!wasLight) document.documentElement.setAttribute('data-theme', 'light');
  document.body.classList.add('exporting-mode');

  scrollContainer.scrollLeft = 0;
  scrollContainer.scrollTop = 0;
  const origOF = scrollContainer.style.overflow;
  scrollContainer.style.overflow = 'visible';

  await new Promise(r => setTimeout(r, 500));

  try {
    const canvas = await html2canvas(targetEl, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: targetEl.scrollWidth,
      height: targetEl.scrollHeight + 40,
    });

    scrollContainer.style.overflow = origOF;
    document.body.classList.remove('exporting-mode');
    if (!wasLight) document.documentElement.setAttribute('data-theme', 'dark');

    const link = document.createElement('a');
    link.download = `SaaS_Roadmap_${filter}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  } catch (e) {
    console.error('Export failed:', e);
    scrollContainer.style.overflow = origOF;
    document.body.classList.remove('exporting-mode');
    if (!wasLight) document.documentElement.setAttribute('data-theme', 'dark');
    alert('PNG export failed, please try again.');
  }
}
