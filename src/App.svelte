<script lang="ts">
  import { compileToSvg, type Layout } from './lib/d2';
  let src = `x -> y`;
  let svg = '';
  let layout: Layout = 'dagre';
  let sketch = false;
  let collapsed = false;
  let editorWidth = 420;

  async function saveAndCompile() { 
    console.log('=== COMPILE BUTTON CLICKED ===');
    alert('Compile button clicked! Check console for details.');
    try {
      console.log('Starting compilation process...');
      svg = await compileToSvg(src, { layout, sketch }); 
      console.log('SVG updated successfully:', svg.length, 'characters');
      alert('Compilation successful!');
    } catch (error) {
      console.error('Compilation failed:', error);
      alert('Compilation failed: ' + error.message);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault(); saveAndCompile();
    }
  }

  // splitter drag (min 260px, max 80vw)
  let dragging=false, startX=0, startW=0;
  function startDrag(e: PointerEvent){ dragging=true; startX=e.clientX; startW=(document.querySelector('aside') as HTMLElement).offsetWidth; (e.target as HTMLElement).setPointerCapture(e.pointerId); }
  function onMove(e: PointerEvent){ if(!dragging) return; const delta=e.clientX-startX; editorWidth=Math.min(Math.max(startW+delta,260), window.innerWidth*0.8); }
  function stopDrag(){ dragging=false; }

  function toggleCollapse(){
    if (!collapsed) editorWidth = (document.querySelector('aside') as HTMLElement).offsetWidth;
    collapsed = !collapsed;
  }
</script>

<div class="root" on:keydown={handleKeydown} role="application" tabindex="-1">
  <aside class:collapsed style={`width:${collapsed ? '12px' : editorWidth + 'px'}`}>
    <div class="toolbar">
      <button on:click={toggleCollapse}>{collapsed ? '›' : '‹'}</button>
      <label>Layout
        <select bind:value={layout}>
          <option value="dagre">dagre</option>
          <option value="elk">elk</option>
        </select>
      </label>
      <label><input type="checkbox" bind:checked={sketch}> Sketch</label>
      <button on:click={saveAndCompile} title="Ctrl/Cmd+S">Compile</button>
    </div>
    <textarea bind:value={src} spellcheck="false"></textarea>
  </aside>

  <div class="splitter" on:pointerdown={startDrag} on:pointermove={onMove} on:pointerup={stopDrag}></div>

  <section class="preview">
    {@html svg}
  </section>
</div>

<style>
  :global(html, body, #app, .root) { height: 100vh; margin: 0; overflow: hidden; }
  .root { 
    display: grid; 
    grid-template-columns: auto 6px 1fr; 
    background:#0b0b0c; 
    color:#e7e7ea; 
    height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
  }
  aside { 
    min-width:260px; 
    max-width:80vw; 
    background:#111214; 
    border-right:1px solid #222329; 
    overflow:hidden; 
    display: flex;
    flex-direction: column;
  }
  aside.collapsed { width:12px !important; }
  .toolbar { 
    display:flex; 
    gap:.5rem; 
    align-items:center; 
    padding:.5rem; 
    border-bottom:1px solid #222329; 
    flex-shrink: 0;
  }
  textarea { 
    width:100%; 
    flex: 1;
    min-height: 200px;
    resize:vertical; 
    padding:.75rem; 
    border:0; 
    outline:none; 
    background:#17181b; 
    color:#e7e7ea; 
    font-family: ui-monospace, Menlo, monospace; 
  }
  .splitter { cursor: col-resize; background:#e5e7eb0f; }
  .preview { 
    overflow:auto; 
    padding:16px; 
    background: #0b0b0c;
    position: relative;
  }
  .preview :global(svg) { 
    display:block; 
    margin:0 auto; 
    max-width:100%; 
    height:auto; 
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  button, select, input[type="checkbox"] { 
    color:#e7e7ea; 
    background:#17181b; 
    border:1px solid #222329; 
    border-radius:10px; 
    padding:6px 10px; 
    cursor: pointer;
  }
  button:hover, select:hover { background:#222329; }
</style>
