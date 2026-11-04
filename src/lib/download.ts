/** Characters Windows, macOS or Linux do not allow in file names, plus control characters. */
// eslint-disable-next-line no-control-regex
const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|\u0000-\u001f]+/g;

/**
 * A file name built from user text (a project name). Keeps letters of every script, so
 * "網站 改版" becomes "網站-改版" instead of an empty string; falls back when nothing is left.
 */
export function safeFileName(name: string, fallback: string): string {
  const cleaned = name.replace(UNSAFE_FILENAME_CHARS, '').trim().replace(/\s+/g, '-');
  return cleaned || fallback;
}

/** Base name for exported files: the project name, plus the phase filter when one is active. */
export function exportBaseName(projectName: string, filter = 'ALL'): string {
  const base = safeFileName(projectName, 'gantt');
  return filter === 'ALL' ? base : `${base}-${safeFileName(filter, 'phase')}`;
}

/** Save `blob` through the browser's download prompt. */
export function downloadBlob(blob: Blob, filename: string): void {
  downloadUrl(URL.createObjectURL(blob), filename, true);
}

/**
 * Save a URL (object URL or data URL) as a file. The link is attached to the page while it is
 * clicked (Firefox ignores detached links) and an object URL is released on the next tick, after
 * the browser has started the download.
 */
export function downloadUrl(url: string, filename: string, revoke = false): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(url), 0);
}
