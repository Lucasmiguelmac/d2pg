export type Layout = 'dagre' | 'elk';

export async function compileToSvg(
  src: string,
  opts?: { layout?: Layout; sketch?: boolean }
): Promise<string> {
  try {
    console.log('Starting compilation...', { src, opts });
    
    // Dynamic import to handle potential loading issues
    const { D2 } = await import('@terrastruct/d2');
    console.log('D2 module imported successfully');
    
    const d2 = new D2();
    console.log('D2 instance created, compiling...');
    
    const compiled = await d2.compile(src);
    console.log('Compilation complete, rendering...');
    
    const svg = await d2.render(compiled.diagram, {
      sketch: !!opts?.sketch,
      center: true,
      pad: 32
    });
    console.log('SVG rendered successfully');
    return svg;
  } catch (error) {
    console.error('Error in compileToSvg:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}
