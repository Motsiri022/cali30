#!/usr/bin/env python3
"""Optional real-browser check (needs: pip install playwright && playwright install chromium).
   Opens the app in Chromium at 5 screen widths, visits every mobile screen and reports:
   - console errors / failed requests / Content-Security-Policy violations
   - horizontal overflow (anything wider than the screen)
   It can also save screenshots:  python3 scripts/browser-check.py --shots docs/screenshots
   Run it from the project root. Exit code 1 if any problem is found."""
import sys, json, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'index.html').as_uri()
ROUTES = ['#/overview', '#/workouts', '#/plan/b-d2', '#/session/b-d1', '#/library', '#/exercise/dead-hang', '#/progress', '#/skills', '#/schedule', '#/profile', '#/profile/privacy', '#/profile/help']
shots = pathlib.Path(sys.argv[sys.argv.index('--shots') + 1]) if '--shots' in sys.argv else None
problems, seen = [], set()

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in (320, 360, 390, 430, 768):
        ctx = browser.new_context(viewport={'width': width, 'height': 800}, is_mobile=width < 600, has_touch=width < 600)
        page = ctx.new_page()
        def note(kind, text, w=width):
            key = (kind, text)
            if key not in seen: seen.add(key); problems.append(f'[{w}px] {kind}: {text}')
        page.on('pageerror', lambda e: note('page error', str(e)[:160]))
        page.on('console', lambda m: note('console ' + m.type, m.text[:160]) if m.type in ('error', 'warning') else None)
        page.on('requestfailed', lambda r: note('request failed', r.url[-80:]))
        page.goto(URL); page.wait_for_selector('#app *')
        for route in ROUTES:
            page.evaluate(f"location.hash='{route}'"); page.wait_for_timeout(150)
            if page.evaluate('document.documentElement.scrollWidth') > width + 1:
                note('horizontal overflow', route)
            if shots and width == 390:
                shots.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(shots / f"{route.strip('#/').replace('/', '-')}.png"), full_page=True)
        if page.evaluate('Log.errorCount()'): note('app error log', 'the in-app log has errors (Profile > Help & feedback)')
        ctx.close()
    browser.close()

print('Browser check: 5 widths x', len(ROUTES), 'screens')
print('PROBLEMS:\n  ' + '\n  '.join(problems) if problems else 'No problems found.')
sys.exit(1 if problems else 0)
