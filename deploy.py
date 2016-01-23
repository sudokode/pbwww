#!/usr/bin/env python

import sys

from lxml import html

def main(index_html, index_js, index_css):
    with open(index_html) as f:
        tree = html.parse(f)

    script, = tree.xpath("//script[@id='index-script']")

    with open(index_js) as f:
        script.text = f.read()
        del script.attrib['src']

    style, = tree.xpath("//style[@id='index-style']")

    with open(index_css) as f:
        style.text = f.read()

    sys.stdout.write(html.tostring(tree).decode('utf-8'))

if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit("{} [index.html] [index.js] [index.css]".format(sys.argv[0]))

    main(*sys.argv[1:])
