import type { ReactNode } from 'react';

/* Минимальный безопасный рендер markdown (без HTML): заголовки, абзацы, списки, таблицы, цитаты,
 * **жирный**, *курсив*, `код`. Используется в панели «Перевод на русский». */

function inline(s: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\s][^*]*)\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = key;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[2] ?? m[3]) out.push(<strong key={k++}>{m[2] ?? m[3]}</strong>);
    else if (m[4]) out.push(<em key={k++}>{m[4]}</em>);
    else if (m[5]) out.push(<code key={k++}>{m[5]}</code>);
    last = re.lastIndex;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

const withBreaks = (s: string) => s.split('\n').flatMap((l, i) => (i ? [<br key={`b${i}`} />, ...inline(l, i * 100)] : inline(l)));
const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(l);
    if (h) {
      const lvl = Math.min(6, h[1].length + 2);
      const Tag = `h${lvl}` as 'h3';
      blocks.push(<Tag key={k++}>{inline(h[2])}</Tag>);
      i++;
      continue;
    }
    if (/^\s*\|/.test(l)) {
      const rows: string[] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      const sep = rows.length > 1 && /^[\s|:-]+$/.test(rows[1]);
      const head = sep ? cells(rows[0]) : null;
      const body = (sep ? rows.slice(2) : rows).map(cells);
      blocks.push(
        <div className="md__table" key={k++}>
          <table>
            {head && (
              <thead>
                <tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr>
              </thead>
            )}
            <tbody>
              {body.map((r, j) => (
                <tr key={j}>{r.map((c, n) => <td key={n}>{inline(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    const li = /^\s*([-*+]|\d+[.)])\s+/;
    if (li.test(l)) {
      const ordered = /^\s*\d/.test(l);
      const items: string[] = [];
      while (i < lines.length && li.test(lines[i])) {
        let item = lines[i++].replace(li, '');
        while (i < lines.length && lines[i].trim() && !li.test(lines[i]) && /^\s{2,}/.test(lines[i])) item += '\n' + lines[i++].trim();
        items.push(item);
      }
      const L = ordered ? 'ol' : 'ul';
      blocks.push(<L key={k++}>{items.map((t, j) => <li key={j}>{withBreaks(t)}</li>)}</L>);
      continue;
    }
    if (/^>\s?/.test(l)) {
      const q: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={k++}>{withBreaks(q.join('\n'))}</blockquote>);
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(l)) {
      blocks.push(<hr key={k++} />);
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*\||\s*([-*+]|\d+[.)])\s+|>)/.test(lines[i])) para.push(lines[i++]);
    if (!para.length) para.push(lines[i++]);
    blocks.push(<p key={k++}>{withBreaks(para.join('\n'))}</p>);
  }
  return <div className="md">{blocks}</div>;
}
