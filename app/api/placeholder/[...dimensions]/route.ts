import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dimensions: string[] }> }
) {
  try {
    const { dimensions } = await params;
    let width = 40;
    let height = 40;
    
    if (dimensions && dimensions.length >= 2) {
      width = parseInt(dimensions[0]) || 40;
      height = parseInt(dimensions[1]) || 40;
    } else if (dimensions && dimensions.length === 1) {
      const size = parseInt(dimensions[0]) || 40;
      width = size;
      height = size;
    }
    
    // Limit dimensions for security
    width = Math.min(Math.max(width, 10), 1000);
    height = Math.min(Math.max(height, 10), 1000);
    
    // Generate a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="2" y="2" width="${width-4}" height="${height-4}" fill="#e5e7eb" stroke="#d1d5db" stroke-width="1"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.2}" fill="#9ca3af">
          ${width}×${height}
        </text>
      </svg>
    `.trim();
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
    
  } catch (error) {
    console.error('Placeholder image generation error:', error);
    
    // Return a minimal 40x40 placeholder on error
    const fallbackSvg = `
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="2" y="2" width="36" height="36" fill="#e5e7eb" stroke="#d1d5db" stroke-width="1"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="8" fill="#9ca3af">
          40×40
        </text>
      </svg>
    `.trim();
    
    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour on error
      },
    });
  }
}



