<script lang="ts">
  import { compileToSvg } from './lib/d2';
  let src = `x -> y`;
  let svg = '';
  let collapsed = false;
  let editorWidth = 420;
  let zoomLevel = 1;
  let minZoom = 0.1;
  let maxZoom = 5;
  let svgElement: SVGElement | null = null;
  let baseWidth = 0;
  let baseHeight = 0;

  async function saveAndCompile() { 
    try {
      console.log('Starting compilation process...');
      svg = await compileToSvg(src); 
      console.log('SVG updated successfully:', svg.length, 'characters');
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

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(Math.max(zoomLevel + delta, minZoom), maxZoom);
      console.log('Zoom change:', zoomLevel, '->', newZoom);
      zoomLevel = newZoom;
    }
  }

  function resetZoomToFit() {
    zoomLevel = 1;
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
  <aside class:collapsed style={`width:${collapsed ? '0px' : editorWidth + 'px'}`}>
    <div class="toolbar">
      <button on:click={toggleCollapse}>{collapsed ? '›' : '‹'}</button>
      {#if !collapsed}
        <button on:click={saveAndCompile} title="Ctrl/Cmd+S">Compile</button>
        <button on:click={resetZoomToFit} title="Reset Zoom (Fit to View)">Reset Zoom</button>
        <span class="zoom-indicator">{Math.round(zoomLevel * 100)}%</span>
      {/if}
    </div>
    {#if !collapsed}
      <textarea bind:value={src} spellcheck="false"></textarea>
    {/if}
  </aside>

  {#if collapsed}
    <button class="floating-expand-btn" on:click={toggleCollapse} title="Expand Editor">
      ›
    </button>
  {/if}

  <div class="splitter" on:pointerdown={startDrag} on:pointermove={onMove} on:pointerup={stopDrag}></div>

  <section class="preview" on:wheel={handleWheel}>
    <div class="svg-container">
      <div style="width: {zoomLevel * 100}%; height: {zoomLevel * 100}%; display: flex; align-items: center; justify-content: center;">
        {@html svg}
      </div>
    </div>
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
    transition: width 0.3s ease;
  }
  aside.collapsed { 
    width: 0px !important; 
    min-width: 0 !important;
    border-right: none;
  }
  .floating-expand-btn {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1001;
    background: #17181b;
    color: #e7e7ea;
    border: 1px solid #222329;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    transition: all 0.2s ease;
  }
  .floating-expand-btn:hover {
    background: #222329;
    transform: scale(1.05);
  }
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
    overflow: auto; 
    padding: 16px; 
    background: #0b0b0c;
    position: relative;
    min-height: 100%;
  }
  .svg-container {
    min-height: 100%;
    min-width: 100%;
  }
  .preview :global(svg) { 
    display: block; 
    width: 100%;
    height: auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  button { 
    color:#e7e7ea; 
    background:#17181b; 
    border:1px solid #222329; 
    border-radius:10px; 
    padding:6px 10px; 
    cursor: pointer;
  }
  button:hover { background:#222329; }
  .zoom-indicator {
    color: #888;
    font-size: 12px;
    padding: 4px 8px;
    background: #17181b;
    border: 1px solid #222329;
    border-radius: 6px;
    min-width: 40px;
    text-align: center;
  }
</style>
