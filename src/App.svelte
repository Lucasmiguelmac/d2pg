<script lang="ts">
  import { onMount } from 'svelte';
  import { D2 } from '@terrastruct/d2';
  
  const PROJECTS_KEY = 'd2-playground-projects';
  const CURRENT_PROJECT_KEY = 'd2-playground-current';
  const EDITOR_WIDTH_KEY = 'd2-playground-editor-width';
  const COLLAPSED_KEY = 'd2-playground-collapsed';
  
  interface Project {
    id: string;
    name: string;
    src: string;
    svg: string;
  }
  
  // Load projects from localStorage or create default
  let projects: Project[] = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]')
    : [];
  
  if (projects.length === 0) {
    projects = [{
      id: crypto.randomUUID(),
      name: 'Diagram 1',
      src: 'x -> y',
      svg: ''
    }];
  }
  
  let currentProjectId = typeof localStorage !== 'undefined'
    ? localStorage.getItem(CURRENT_PROJECT_KEY) || projects[0].id
    : projects[0].id;
  
  // Ensure currentProjectId is valid
  if (!projects.find(p => p.id === currentProjectId)) {
    currentProjectId = projects[0].id;
  }
  
  function getCurrentProject() {
    return projects.find(p => p.id === currentProjectId)!;
  }
  
  $: currentProject = getCurrentProject();
  let src = projects.find(p => p.id === currentProjectId)?.src || '';
  let svg = '';
  
  let loading = false;
  let editingProjectId: string | null = null;
  
  // Load editor preferences
  let collapsed = typeof localStorage !== 'undefined'
    ? localStorage.getItem(COLLAPSED_KEY) === 'true'
    : false;
  
  let editorWidth = typeof localStorage !== 'undefined'
    ? parseInt(localStorage.getItem(EDITOR_WIDTH_KEY) || '420')
    : 420;
  let zoomLevel = 1;
  let fitZoom = 1; // The zoom level that makes the SVG fit perfectly
  let minZoom = 1; // Dynamic minimum zoom (set to fitZoom)
  let maxZoom = 5;
  let previewContainer: HTMLElement;
  let svgContainer: HTMLElement;
  let svgNaturalWidth = 0;
  let svgNaturalHeight = 0;
  
  // Save projects to localStorage whenever they change
  $: if (typeof localStorage !== 'undefined' && projects) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
  
  // Save current project ID
  $: if (typeof localStorage !== 'undefined' && currentProjectId) {
    localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId);
  }
  
  // Update src and svg when switching projects
  $: {
    const project = projects.find(p => p.id === currentProjectId);
    if (project) {
      src = project.src;
      svg = project.svg;
    }
  }
  
  // Update current project's src when textarea changes
  function updateProjectSrc(newSrc: string) {
    src = newSrc;
    const idx = projects.findIndex(p => p.id === currentProjectId);
    if (idx !== -1) {
      projects[idx].src = newSrc;
      projects = [...projects];
    }
  }
  
  // Save editor preferences
  $: if (typeof localStorage !== 'undefined' && editorWidth !== undefined) {
    localStorage.setItem(EDITOR_WIDTH_KEY, editorWidth.toString());
  }
  
  $: if (typeof localStorage !== 'undefined' && collapsed !== undefined) {
    localStorage.setItem(COLLAPSED_KEY, collapsed.toString());
  }
  
  async function compileToSvg(src: string): Promise<string> {
    try {
      console.log("Starting compilation...", { src });

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
      loading = true;
      console.log("Starting compilation process...");
      const compiled = await compileToSvg(src);
      
      // Update the SVG in the current project
      const idx = projects.findIndex(p => p.id === currentProjectId);
      if (idx !== -1) {
        projects[idx].svg = compiled;
        projects = [...projects];
      }
      
      console.log("SVG updated successfully:", compiled.length, "characters");
      
      // Wait for DOM to update, then calculate fit zoom
      setTimeout(calculateFitZoom, 50);
    } catch (error) {
      console.error("Compilation failed:", error);
      alert("Compilation failed: " + error.message);
    } finally {
      loading = false;
    }
  }
  
  function addProject() {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: `Diagram ${projects.length + 1}`,
      src: 'x -> y',
      svg: ''
    };
    projects = [...projects, newProject];
    currentProjectId = newProject.id;
  }
  
  function switchProject(projectId: string) {
    currentProjectId = projectId;
    // Recalculate zoom for the new diagram
    setTimeout(calculateFitZoom, 50);
  }
  
  function deleteProject(projectId: string) {
    if (projects.length === 1) {
      alert("Cannot delete the last project");
      return;
    }
    
    const idx = projects.findIndex(p => p.id === projectId);
    if (idx === -1) return;
    
    projects = projects.filter(p => p.id !== projectId);
    
    // Switch to another project if we deleted the current one
    if (currentProjectId === projectId) {
      currentProjectId = projects[Math.max(0, idx - 1)].id;
    }
  }
  
  function startRename(projectId: string) {
    editingProjectId = projectId;
  }
  
  function finishRename(projectId: string, newName: string) {
    const idx = projects.findIndex(p => p.id === projectId);
    if (idx !== -1 && newName.trim()) {
      projects[idx].name = newName.trim();
      projects = [...projects];
    }
    editingProjectId = null;
  }
  
  function handleTabKeydown(e: KeyboardEvent, projectId: string) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      finishRename(projectId, input.value);
    } else if (e.key === 'Escape') {
      editingProjectId = null;
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

  // Compile diagram on mount
  onMount(() => {
    saveAndCompile();
  });
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
      <textarea value={src} on:input={(e) => updateProjectSrc(e.currentTarget.value)} spellcheck="false"></textarea>
      
      <div class="tabs-container">
        <div class="tabs">
          {#each projects as project (project.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="tab"
              class:active={project.id === currentProjectId}
              on:click={() => switchProject(project.id)}
              on:dblclick={() => startRename(project.id)}
              role="tab"
              tabindex="0"
            >
              {#if editingProjectId === project.id}
                <!-- svelte-ignore a11y_autofocus -->
                <input
                  type="text"
                  value={project.name}
                  on:blur={(e) => finishRename(project.id, e.currentTarget.value)}
                  on:keydown={(e) => handleTabKeydown(e, project.id)}
                  autofocus
                  class="tab-input"
                />
              {:else}
                <span class="tab-name">{project.name}</span>
                {#if projects.length > 1}
                  <button 
                    class="tab-close"
                    on:click|stopPropagation={() => deleteProject(project.id)}
                    title="Delete project"
                  >
                    ×
                  </button>
                {/if}
              {/if}
            </div>
          {/each}
          <button class="tab-add" on:click={addProject} title="New project">+</button>
        </div>
      </div>
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
    {#if loading}
      <div class="loader">
        <div class="spinner"></div>
      </div>
    {/if}
    
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
    position: relative;
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
    resize: none;
    padding: 0.75rem;
    border: 0;
    outline: none;
    background: #17181b;
    color: #e7e7ea;
    font-family: ui-monospace, Menlo, monospace;
  }
  .tabs-container {
    background: #0d0d0f;
    border-top: 1px solid #222329;
    padding: 0.5rem;
    flex-shrink: 0;
  }
  .tabs {
    display: flex;
    gap: 0.25rem;
    overflow-x: auto;
    overflow-y: hidden;
    align-items: center;
  }
  .tabs::-webkit-scrollbar {
    height: 4px;
  }
  .tabs::-webkit-scrollbar-thumb {
    background: #222329;
    border-radius: 2px;
  }
  .tab {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.4rem 0.6rem;
    background: #17181b;
    border: 1px solid #222329;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
    transition: all 0.15s ease;
    user-select: none;
  }
  .tab:hover {
    background: #1d1e21;
    border-color: #2a2b31;
  }
  .tab.active {
    background: white;
    border-color: white;
    color: #0b0b0c;
  }
  .tab-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tab-input {
    background: transparent;
    border: none;
    outline: none;
    color: inherit;
    font-size: inherit;
    font-family: inherit;
    padding: 0;
    width: 100px;
  }
  .tab-close {
    padding: 0;
    width: 16px;
    height: 16px;
    min-width: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    opacity: 0.7;
    transition: all 0.15s ease;
  }
  .tab-close:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.3);
  }
  .tab.active .tab-close:hover {
    background: rgba(0, 0, 0, 0.15);
  }
  .tab-add {
    padding: 0.4rem 0.6rem;
    min-width: 28px;
    height: 28px;
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
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
  .loader {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    pointer-events: none;
  }
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(100, 108, 255, 0.2);
    border-top-color: #646cff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
