export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  const lines = markdown.split("\n");
  const parts: string[] = [];
  let i = 0;

  let inUl = false;
  let inOl = false;
  let inBlockquote = false;

  function closeLists() {
    if (inUl) {
      parts.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      parts.push("</ol>");
      inOl = false;
    }
  }

  function closeBlockquote() {
    if (inBlockquote) {
      parts.push("</blockquote>");
      inBlockquote = false;
    }
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      closeLists();
      closeBlockquote();
      i++;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      closeLists();
      if (!inBlockquote) {
        parts.push("<blockquote>");
        inBlockquote = true;
      }
      const content = trimmed.slice(2);
      parts.push(`<div>${inlineFormat(content)}</div>`);
      i++;
      continue;
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      closeLists();
      closeBlockquote();
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = inlineFormat(match[2]);
        parts.push(`<h${level}>${text}</h${level}>`);
      }
      i++;
      continue;
    }

    if (/^(\*|-|\+)\s/.test(trimmed)) {
      closeBlockquote();
      if (!inUl) {
        closeLists();
        parts.push("<ul>");
        inUl = true;
      }
      const content = trimmed.replace(/^(\*|-|\+)\s+/, "");
      parts.push(`<li>${inlineFormat(content)}</li>`);
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      closeBlockquote();
      if (!inOl) {
        closeLists();
        parts.push("<ol>");
        inOl = true;
      }
      const content = trimmed.replace(/^\d+\.\s+/, "");
      parts.push(`<li>${inlineFormat(content)}</li>`);
      i++;
      continue;
    }

    closeLists();
    closeBlockquote();

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      paragraph.push(lines[i]);
      i++;
    }
    if (paragraph.length > 0) {
      const text = inlineFormat(paragraph.join("<br>"));
      parts.push(`<div>${text}</div>`);
    }
  }

  closeLists();
  closeBlockquote();

  return parts.join("\n");
}

function inlineFormat(text: string): string {
  let result = escapeHtml(text);

  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/`(.+?)`/g, "<code>$1</code>");
  result = result.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  return result;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
}
