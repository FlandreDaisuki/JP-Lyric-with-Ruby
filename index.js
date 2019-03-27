const $ = (s, doc = document) => {
  return doc.querySelector(s);
};

const $$ = (s, doc = document) => {
  return [...doc.querySelectorAll(s)];
};

const $el = (tag, attr = {}, cb = () => {}) => {
  const el = document.createElement(tag);
  Object.assign(el, attr);
  cb(el);
  return el;
};

if (!String.prototype.matchAll) {
  String.prototype.matchAll = function(regexp) {
    const self = this;
    return {
      *[Symbol.iterator]() {
        while((matches = regexp.exec(self)) !== null) {
          yield matches;
        }
      }
    };
  }
}

const getTextArray = () => {
  return $('#text-editor + label + .tab-content pre').innerHTML
    .split(/\n|<br\/?>/g)
    .map(r => r.trim());
};

const render = (str, pos) => {
  let result = '';
  for (let i = 0; i < pos.length - 1; ++i) {
      const substr = str.slice(pos[i], pos[i + 1]);
      const match = substr.match(/^([^(]+)\(([^)]+)\)$/);
      console.log(substr, match);
      if (match) {
          result += `<ruby>${match[1]}<rp>(</rp><rt>${match[2]}</rt><rp>)</rp></ruby>`;
      } else {
          result += substr;
      }
  }
  return `<div class="lyric-row">${result}</div>`;
};

const process = () => {
  const lines = getTextArray();

  const rendered = [];
  for (const line of lines) {
      /* 平仮名 3041-3093 */
      /* 片仮名 30A0-30FF*/
      const lineIter = line.matchAll(/[^\u{3041}-\u{3093}\u{30A0}-\u{30FF}\s「」？?、]+\([^)]+\)/gu);
      const collect = new Set([0, line.length]);
      for (const wordAnchor of lineIter) {
          collect.add(wordAnchor.index);
          collect.add(wordAnchor.index + wordAnchor[0].length);
      }
      const position = [...collect].sort((a, b) => a - b);
      // console.log(position);
      rendered.push(render(line, position));
  }
  console.log(rendered);
  const title = $('#text-editor + label + .tab-content h1');
  $('#ruby-rendered-lyrics').innerHTML = title.outerHTML + rendered.join('');
}

const toFullHTML = (html, text) => {
  const title = $('#ruby-rendered-lyrics h1').textContent;
  return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
          .lyric-row {
              min-height: 30px;
              line-height: 2rem;
          }
          </style>
      </head>
      <body>
          <div id="raw-text" style="display: none">
          ${getTextArray().join('\n')}
          </div>
          ${html}
      </body>
      </html>
  `.split('\n').map(l => l.trim()).join('\n');
}

$('#ruby-renderer').addEventListener('change', process);

new ClipboardJS('#copy-btn', {
  text: () => $('#ruby-rendered-lyrics').outerHTML,
});

$('#download-btn').addEventListener('click',() => {
  const blob = new Blob([toFullHTML($('#ruby-rendered-lyrics').outerHTML)], {type: 'text/html;charset=utf-8'});
  const title = $('#ruby-rendered-lyrics h1').textContent;
  saveAs(blob, `${title}.html`.replace(/\//g, '／'));
});

const teTitle = $('label[for="text-editor"] + .tab-content > h1');
const tePre = $('label[for="text-editor"] + .tab-content > pre');

window.addEventListener('load', () => {
  const title = localStorage.getItem('H1');
  if (title) {
    teTitle.innerHTML = LZString.decompressFromBase64(title);
  }

  const pre = localStorage.getItem('PRE');
  if (pre) {
    tePre.innerHTML = LZString.decompressFromBase64(pre);
  }
});

const onInputPlaceholder = (event) => {
  const el = event.target;
  if (!el.textContent.trim()) {
    el.innerHTML = '';
    el.classList.add('placeholder');
  } else {
    el.classList.remove('placeholder');
    localStorage.setItem(el.tagName, LZString.compressToBase64(el.innerHTML));
  }
}

teTitle.addEventListener('input', onInputPlaceholder);
tePre.addEventListener('input', onInputPlaceholder);

const onPasteClear = (event) => {
  event.preventDefault();

  const paste = (event.clipboardData || window.clipboardData).getData('text');

  const selection = window.getSelection();
  if (!selection.rangeCount) { return false };
  selection.deleteFromDocument();
  selection.getRangeAt(0).insertNode(document.createTextNode(paste));
  selection.collapseToEnd();

  const el = event.target;
  localStorage.setItem(el.tagName, el.innerHTML);
}

teTitle.addEventListener('paste', onPasteClear);
tePre.addEventListener('paste', onPasteClear);
