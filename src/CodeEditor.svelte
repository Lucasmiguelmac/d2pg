<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { EditorState, Range } from '@codemirror/state';
  import { Decoration, ViewPlugin, type DecorationSet } from '@codemirror/view';
  import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
  import { tags } from '@lezer/highlight';
  
  export let value: string = '';
  export let onChange: (newValue: string) => void;
  
  let editorElement: HTMLElement;
  let editorView: EditorView | null = null;
  
  // D2 syntax highlighting using decorations with inline styles
  const commentMark = Decoration.mark({ 
    class: "cm-d2-comment",
    attributes: { style: "color: #5c6370; font-style: italic;" }
  });
  const operatorMark = Decoration.mark({ 
    class: "cm-d2-operator",
    attributes: { style: "color: #56b6c2; font-weight: 500;" }
  });
  const nodeMark = Decoration.mark({ 
    class: "cm-d2-node",
    attributes: { style: "color: #4a9eff;" }
  });
  const stringMark = Decoration.mark({ 
    class: "cm-d2-string",
    attributes: { style: "color: #e5c07b;" }
  });
  const propertyMark = Decoration.mark({ 
    class: "cm-d2-property",
    attributes: { style: "color: #4a9eff; font-weight: 500;" }
  });
  const braceMark = Decoration.mark({ 
    class: "cm-d2-brace",
    attributes: { style: "color: #5c6370;" }
  });
  const keywordMark = Decoration.mark({ 
    class: "cm-d2-keyword",
    attributes: { style: "color: #c678dd; font-weight: 500;" }
  });
  
  function d2Decorations(view: EditorView) {
    const decorations: Range<Decoration>[] = [];
    const text = view.state.doc.toString();
    const lines = text.split('\n');
    let pos = 0;
    
    console.log("Applying D2 decorations to text:", text.substring(0, 50));
    
    for (const line of lines) {
      // Track positions that are inside strings to skip them later
      const stringRanges: Array<{start: number, end: number}> = [];
      
      // Comments (# or //)
      const commentMatch = line.match(/^(\s*)(#|\/\/)(.*)$/);
      if (commentMatch) {
        const commentStart = pos + commentMatch[1].length;
        decorations.push(commentMark.range(commentStart, pos + line.length));
        pos += line.length + 1;
        continue; // Skip rest of processing for comment lines
      }
      
      // Strings (quoted) - do this first and track their positions
      const stringRegex = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
      let match;
      while ((match = stringRegex.exec(line)) !== null) {
        decorations.push(stringMark.range(pos + match.index, pos + match.index + match[0].length));
        stringRanges.push({
          start: match.index,
          end: match.index + match[0].length
        });
      }
      
      // Helper function to check if position is inside a string
      const isInsideString = (index: number) => {
        return stringRanges.some(range => index >= range.start && index < range.end);
      };
      
      // Arrows (-> <-- <- --> <->)
      const arrowRegex = /(->|<--|<-|-->|<->)/g;
      while ((match = arrowRegex.exec(line)) !== null) {
        if (!isInsideString(match.index)) {
          decorations.push(operatorMark.range(pos + match.index, pos + match.index + match[0].length));
        }
      }
      
      // Properties (only actual D2 properties like shape:, style.fill:, etc.)
      const propRegex = /(\w+\.\w+)(\s*):|(\b(?:shape|fill|stroke|opacity|stroke-width|stroke-dash|border-radius|font-size|font-color|shadow|multiple|animated|bold|italic|underline|width|height|top|left|grid-rows|grid-columns|grid-gap|vertical-gap|horizontal-gap)\b)(\s*):/g;
      while ((match = propRegex.exec(line)) !== null) {
        if (!isInsideString(match.index)) {
          const propName = match[1] || match[3];
          if (propName) {
            decorations.push(propertyMark.range(pos + match.index, pos + match.index + propName.length));
          }
        }
      }
      
      // Braces
      const braceRegex = /[{}]/g;
      while ((match = braceRegex.exec(line)) !== null) {
        if (!isInsideString(match.index)) {
          decorations.push(braceMark.range(pos + match.index, pos + match.index + 1));
        }
      }
      
      // Keywords (but NOT when followed by : which makes them properties)
      const keywordRegex = /\b(style|shape|label|link|tooltip|icon|near|class|constraint|direction|width|height)\b(?!\s*:)/g;
      while ((match = keywordRegex.exec(line)) !== null) {
        if (!isInsideString(match.index)) {
          decorations.push(keywordMark.range(pos + match.index, pos + match.index + match[0].length));
        }
      }
      
      // Node names (identifiers that aren't properties or keywords)
      // Match word characters and underscores, optionally followed by : (for labels)
      const nodeRegex = /\b([a-zA-Z_][\w_]*)\b(?=\s*(?:->|<-|--|<->|:|\{|$))/g;
      while ((match = nodeRegex.exec(line)) !== null) {
        if (!isInsideString(match.index)) {
          // Check if this isn't already highlighted as a property or keyword
          const matchText = match[1];
          const knownKeywords = ['style', 'shape', 'label', 'link', 'tooltip', 'icon', 'near', 'class', 'constraint', 'direction', 'width', 'height'];
          if (!knownKeywords.includes(matchText)) {
            decorations.push(nodeMark.range(pos + match.index, pos + match.index + matchText.length));
          }
        }
      }
      
      pos += line.length + 1; // +1 for newline
    }
    
    // Sort decorations by position (required by CodeMirror)
    decorations.sort((a, b) => a.from - b.from);
    
    console.log("Total decorations applied:", decorations.length);
    return Decoration.set(decorations);
  }
  
  const d2Plugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    
    constructor(view: EditorView) {
      this.decorations = d2Decorations(view);
      console.log("ViewPlugin constructor - decorations:", this.decorations.size);
    }
    
    update(update: any) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = d2Decorations(update.view);
        console.log("ViewPlugin update - decorations:", this.decorations.size);
      }
    }
  }, {
    decorations: (plugin: any) => plugin.decorations
  });
  
  // D2 syntax highlighting styles
  const d2Highlighting = HighlightStyle.define([
    { tag: tags.keyword, color: "#c678dd" },
    { tag: tags.operator, color: "#56b6c2" },
    { tag: tags.string, color: "#98c379" },
    { tag: tags.comment, color: "#5c6370", fontStyle: "italic" },
    { tag: tags.propertyName, color: "#e06c75" },
    { tag: tags.brace, color: "#abb2bf" },
    { tag: tags.bracket, color: "#abb2bf" },
    { tag: tags.punctuation, color: "#abb2bf" },
    { tag: tags.literal, color: "#d19a66" },
    { tag: tags.number, color: "#d19a66" },
  ]);
  
  // Simple D2 syntax highlighting theme
  const d2Theme = EditorView.theme({
    "&": {
      fontSize: "14px",
      fontFamily: "ui-monospace, Menlo, Monaco, 'Cascadia Code', 'Source Code Pro', monospace",
      height: "100%",
      textAlign: "left"
    },
    ".cm-content": {
      minHeight: "200px",
      caretColor: "#e7e7ea",
      padding: "0.75rem 0",
      textAlign: "left",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word"
    },
    "&.cm-focused": {
      outline: "none"
    },
    ".cm-scroller": {
      overflowX: "hidden",
      overflowY: "auto",
      fontFamily: "inherit",
      lineHeight: "1.5",
      textAlign: "left"
    },
    ".cm-gutters": {
      backgroundColor: "#0d0d0f",
      color: "#4b5263",
      border: "none",
      paddingRight: "8px"
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#222329",
      color: "#abb2bf"
    },
    ".cm-activeLine": {
      backgroundColor: "#2c313c"
    },
    ".cm-line": {
      padding: "0 8px 0 4px",
      textAlign: "left"
    },
    ".cm-cursor": {
      borderLeftColor: "#e7e7ea"
    }
  }, { dark: true });
  
  onMount(() => {
    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        d2Theme,
        d2Plugin,
        syntaxHighlighting(d2Highlighting),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        })
      ]
    });
    
    console.log("CodeEditor mounted with D2 syntax highlighting");
    
    editorView = new EditorView({
      state: startState,
      parent: editorElement
    });
  });
  
  onDestroy(() => {
    if (editorView) {
      editorView.destroy();
    }
  });
  
  // Update editor when value changes externally
  $: if (editorView && value !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: value
      }
    });
  }
</script>

<div bind:this={editorElement}></div>

<style>
  div :global(.cm-editor) {
    width: 100%;
    height: 100%;
    background: #17181b;
    color: #e7e7ea;
  }
  
  div :global(.cm-content),
  div :global(.cm-gutter) {
    min-height: 100%;
  }
  
  /* D2 syntax highlighting */
  div :global(.cm-d2-comment) {
    color: #5c6370 !important;
    font-style: italic !important;
  }
  
  div :global(.cm-d2-operator) {
    color: #56b6c2 !important;
    font-weight: 500 !important;
  }
  
  div :global(.cm-d2-string) {
    color: #e5c07b !important;
  }
  
  div :global(.cm-d2-property) {
    color: #4a9eff !important;
    font-weight: 500 !important;
  }
  
  div :global(.cm-d2-brace) {
    color: #5c6370 !important;
  }
  
  div :global(.cm-d2-keyword) {
    color: #c678dd !important;
    font-weight: 500 !important;
  }
  
  div :global(.cm-d2-node) {
    color: #4a9eff !important;
  }
  
  /* Override CodeMirror default text color */
  div :global(.cm-line) {
    color: #e7e7ea;
  }
</style>
