import os, re, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html_files = []
for dirpath, dirnames, filenames in os.walk(root):
    if '/qa' in dirpath:
        continue
    for f in filenames:
        # Partials are included too: their data-root-href/data-root-src
        # targets are root-relative regardless of which file references
        # them, and their only other href/src values are "#" placeholders
        # or absolute URLs, both already skipped below.
        if f.endswith('.html'):
            html_files.append(os.path.join(dirpath, f))

href_re = re.compile(r'(?<![-\w])(?:href|src)="([^"]+)"')
dataroot_re = re.compile(r'data-root-href="([^"]+)"')
dataroot_src_re = re.compile(r'data-root-src="([^"]+)"')

problems = []
checked = 0

for file in html_files:
    with open(file, encoding='utf-8') as fh:
        content = fh.read()
    page_dir = os.path.dirname(file)
    is_root_page = (os.path.dirname(file) == root)

    for m in href_re.finditer(content):
        url = m.group(1)
        if url.startswith(('http://', 'https://', 'mailto:', 'tel:', '#')) or url == '':
            continue
        checked += 1
        target = os.path.normpath(os.path.join(page_dir, url.split('#')[0].split('?')[0]))
        if not os.path.exists(target):
            problems.append(f'{file}: broken href/src "{url}" -> {target}')

    # data-root-href / data-root-src values are relative to the content root
    # (this script's grandparent folder) -- except "index.html", which since
    # the reorg lives one level further up, at the true site root.
    for m in list(dataroot_re.finditer(content)) + list(dataroot_src_re.finditer(content)):
        url = m.group(1)
        if url.startswith('#'):
            continue
        checked += 1
        base = os.path.dirname(root) if url == 'index.html' else root
        target = os.path.normpath(os.path.join(base, url.split('#')[0]))
        if not os.path.exists(target):
            problems.append(f'{file}: broken data-root-href/src "{url}" -> {target}')

print(f'Checked {checked} internal link references across {len(html_files)} HTML files.')
if problems:
    print(f'\n{len(problems)} PROBLEM(S):')
    for p in problems:
        print(' -', p)
    sys.exit(1)
else:
    print('No broken internal links found.')
