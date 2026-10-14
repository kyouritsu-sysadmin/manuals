import React from 'react';

export default function FlipbookViewer({ pdfUrl }) {
  return (
    <div style={{ margin: '20px 0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      {/* Example using an iframe pointing to your static template viewer */}
      <iframe 
        src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`}
        width="100%" 
        height="600px" 
        style={{ border: 'none' }}
        allowFullScreen
      />
    </div>
  );
}
