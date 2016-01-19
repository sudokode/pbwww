#!/usr/bin/env python

import sys

from lxml import html

def main(index_html, index_js):
    with open(index_html) as f:
        tree = html.parse(f)

    script, = tree.xpath("//script[@id='index']")

    with open(index_js) as f:
        script.text = f.read()

    sys.stdout.write(html.tostring(tree).decode('utf-8'))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("{} [index.html] [index.js]".format(sys.argv[0]))

    main(*sys.argv[1:])
