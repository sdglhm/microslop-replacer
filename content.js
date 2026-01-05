(() => {
  // Add more replacements here if you want:
  const REPLACEMENTS = [
    { from: /\bMicrosoft\b/g, to: "Microslop" },
    { from: /\bMICROSOFT\b/g, to: "MICROSLOP" },
    { from: /\bmicrosoft\b/g, to: "microslop" }
  ];

  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "CODE",
    "PRE"
  ]);

  function replaceInText(text) {
    let out = text;
    for (const r of REPLACEMENTS) out = out.replace(r.from, r.to);
    return out;
  }

  function shouldSkipNode(node) {
    const parent = node.parentNode;
    if (!parent || parent.nodeType !== Node.ELEMENT_NODE) return false;
    if (SKIP_TAGS.has(parent.tagName)) return true;

    // Also skip editable areas
    if (parent.isContentEditable) return true;

    return false;
  }

  function processTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    if (shouldSkipNode(node)) return;

    const original = node.nodeValue;
    const replaced = replaceInText(original);

    if (replaced !== original) node.nodeValue = replaced;
  }

  function walkAndReplace(root) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (n) => (shouldSkipNode(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      processTextNode(node);
    }
  }

  // Initial pass
  walkAndReplace(document.body || document.documentElement);

  // Handle dynamic content (SPA sites, infinite scroll, etc.)
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      // New text nodes or elements added
      for (const added of m.addedNodes) {
        if (added.nodeType === Node.TEXT_NODE) {
          processTextNode(added);
        } else if (added.nodeType === Node.ELEMENT_NODE) {
          // Don’t walk the whole page again; just new subtree
          walkAndReplace(added);
        }
      }

      // Text changes in existing nodes
      if (m.type === "characterData") {
        processTextNode(m.target);
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true
  });
})();

