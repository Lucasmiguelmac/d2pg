<script lang="ts">
  let src = `x -> y`;
  let svg = "";
  let collapsed = false;
  let editorWidth = 420;
  let zoomLevel = 1;
  let fitZoom = 1; // The zoom level that makes the SVG fit perfectly
  let minZoom = 1; // Dynamic minimum zoom (set to fitZoom)
  let maxZoom = 5;
  let previewContainer: HTMLElement;
  let svgContainer: HTMLElement;
  let svgNaturalWidth = 0;
  let svgNaturalHeight = 0;
  
  async function compileToSvg(src: string): Promise<string> {
    try {
      console.log("Starting compilation...", { src });

      // Dynamic import to handle potential loading issues
      const { D2 } = await import("@terrastruct/d2");
      console.log("D2 module imported successfully");

      const d2 = new D2();
      console.log("D2 instance created, compiling...");

      const compiled = await d2.compile(src);
      console.log("Compilation complete, rendering...");

      const svg = await d2.render(compiled.diagram, {
        center: true,
        pad: 32,
      });
      console.log("SVG rendered successfully");
      return svg;
    } catch (error) {
      console.error("Error in compileToSvg:", error);
      console.error("Error stack:", error.stack);
      throw error;
    }
  }

  async function saveAndCompile() {
    try {
      console.log("Starting compilation process...");
      svg = await compileToSvg(src);
      console.log("SVG updated successfully:", svg.length, "characters");
      
      // Wait for DOM to update, then calculate fit zoom
      setTimeout(calculateFitZoom, 50);
    } catch (error) {
      console.error("Compilation failed:", error);
      alert("Compilation failed: " + error.message);
    }
  }

  function calculateFitZoom() {
    if (!previewContainer || !svgContainer) return;
    
    const svgElement = svgContainer.querySelector("svg");
    if (!svgElement) return;

    // Get natural SVG dimensions
    const svgWidth = svgElement.viewBox?.baseVal?.width || svgElement.width.baseVal.value;
    const svgHeight = svgElement.viewBox?.baseVal?.height || svgElement.height.baseVal.value;
    
    // Store natural dimensions
    svgNaturalWidth = svgWidth;
    svgNaturalHeight = svgHeight;
    
    // Get container dimensions (minus padding)
    const containerWidth = previewContainer.clientWidth - 32;
    const containerHeight = previewContainer.clientHeight - 32;
    
    if (!svgWidth || !svgHeight || !containerWidth || !containerHeight) return;

    // Calculate scale factors for both dimensions
    const scaleX = containerWidth / svgWidth;
    const scaleY = containerHeight / svgHeight;
    
    // Use the smaller scale to ensure it fits (like object-fit: contain)
    const newFitZoom = Math.min(scaleX, scaleY);
    
    fitZoom = newFitZoom;
    minZoom = newFitZoom;
    zoomLevel = newFitZoom;
    
    console.log("Fit zoom calculated:", {
      svgWidth,
      svgHeight,
      containerWidth,
      containerHeight,
      fitZoom: newFitZoom
    });
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveAndCompile();
    }
  }

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(Math.max(zoomLevel + delta, minZoom), maxZoom);
      console.log("Zoom change:", zoomLevel, "->", newZoom);
      zoomLevel = newZoom;
    }
  }

  function resetZoomToFit() {
    zoomLevel = fitZoom;
  }

  // splitter drag (min 260px, max 80vw)
  let dragging = false,
    startX = 0,
    startW = 0;
  function startDrag(e: PointerEvent) {
    dragging = true;
    startX = e.clientX;
    startW = (document.querySelector("aside") as HTMLElement).offsetWidth;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: PointerEvent) {
    if (!dragging) return;
    const delta = e.clientX - startX;
    editorWidth = Math.min(
      Math.max(startW + delta, 260),
      window.innerWidth * 0.8
    );
  }
  function stopDrag() {
    dragging = false;
    // Recalculate fit after resizing the editor panel
    if (svg) {
      setTimeout(calculateFitZoom, 50);
    }
  }

  // Pan/drag to scroll
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let scrollStartX = 0;
  let scrollStartY = 0;

  function startPan(e: MouseEvent) {
    // Only start panning with left mouse button and not on text selection
    if (e.button !== 0) return;
    
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    scrollStartX = previewContainer.scrollLeft;
    scrollStartY = previewContainer.scrollTop;
    
    // Change cursor to grabbing
    if (previewContainer) {
      previewContainer.style.cursor = 'grabbing';
    }
  }

  function onPan(e: MouseEvent) {
    if (!isPanning || !previewContainer) return;

    const deltaX = e.clientX - panStartX;
    const deltaY = e.clientY - panStartY;

    previewContainer.scrollLeft = scrollStartX - deltaX;
    previewContainer.scrollTop = scrollStartY - deltaY;
  }

  function stopPan() {
    isPanning = false;
    if (previewContainer) {
      previewContainer.style.cursor = 'grab';
    }
  }

  function toggleCollapse() {
    if (!collapsed)
      editorWidth = (document.querySelector("aside") as HTMLElement)
        .offsetWidth;
    collapsed = !collapsed;
    // Recalculate fit when collapsing/expanding
    setTimeout(calculateFitZoom, 350);
  }

  // Recalculate fit zoom on window resize
  function handleResize() {
    if (svg) {
      calculateFitZoom();
    }
  }

  // Add resize listener
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="root" on:keydown={handleKeydown} role="application" tabindex="-1">
  <aside
    class:collapsed
    style={`width:${collapsed ? "0px" : editorWidth + "px"}`}
  >
    <div class="toolbar">
      <button on:click={toggleCollapse}>{collapsed ? "›" : "‹"}</button>
      {#if !collapsed}
        <button on:click={saveAndCompile} title="Ctrl/Cmd+S">Compile</button>
        <button on:click={resetZoomToFit} title="Reset Zoom (Fit to View)"
          >Reset Zoom</button
        >
        <span class="zoom-indicator">{Math.round(zoomLevel * 100)}%</span>
      {/if}
    </div>
    {#if !collapsed}
      <textarea bind:value={src} spellcheck="false"></textarea>
    {/if}
  </aside>

  {#if collapsed}
    <button
      class="floating-expand-btn"
      on:click={toggleCollapse}
      title="Expand Editor"
    >
      ›
    </button>
  {/if}

  <div
    class="splitter"
    on:pointerdown={startDrag}
    on:pointermove={onMove}
    on:pointerup={stopDrag}
  ></div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <section 
    class="preview" 
    style="background-color: white;" 
    on:wheel={handleWheel} 
    on:mousedown={startPan}
    on:mousemove={onPan}
    on:mouseup={stopPan}
    on:mouseleave={stopPan}
    bind:this={previewContainer}
  >
    <div class="svg-container" bind:this={svgContainer}>
      <div
        class="svg-wrapper"
        style="width: {svgNaturalWidth * zoomLevel}px; height: {svgNaturalHeight * zoomLevel}px;"
      >
        {@html svg}
      </div>
    </div>
  </section>
</div>

<style>
  :global(html, body, #app, .root) {
    height: 100vh;
    margin: 0;
    overflow: hidden;
  }
  .root {
    display: grid;
    grid-template-columns: auto 6px 1fr;
    background: #0b0b0c;
    color: #e7e7ea;
    height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
  }
  aside {
    min-width: 260px;
    max-width: 80vw;
    background: #111214;
    border-right: 1px solid #222329;
    overflow: hidden;
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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    transition: all 0.2s ease;
  }
  .floating-expand-btn:hover {
    background: #222329;
    transform: scale(1.05);
  }
  .toolbar {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid #222329;
    flex-shrink: 0;
  }
  textarea {
    width: 100%;
    flex: 1;
    min-height: 200px;
    resize: vertical;
    padding: 0.75rem;
    border: 0;
    outline: none;
    background: #17181b;
    color: #e7e7ea;
    font-family: ui-monospace, Menlo, monospace;
  }
  .splitter {
    cursor: col-resize;
    background: #e5e7eb0f;
  }
  .preview {
    overflow: auto;
    padding: 16px;
    background: #0b0b0c;
    position: relative;
    height: 100%;
    cursor: grab;
    user-select: none;
  }
  .svg-container {
    min-height: 100%;
    min-width: 100%;
    display: grid;
    place-items: center;
  }
  .svg-wrapper {
    display: block;
  }
  .preview :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 8px;

  }
  button {
    color: #e7e7ea;
    background: #17181b;
    border: 1px solid #222329;
    border-radius: 10px;
    padding: 6px 10px;
    cursor: pointer;
  }
  button:hover {
    background: #222329;
  }
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
