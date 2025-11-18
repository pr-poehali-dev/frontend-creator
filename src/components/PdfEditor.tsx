import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface TextPosition {
  x: number;
  y: number;
  fontSize: number;
}

interface PdfEditorProps {
  pdfFile: File;
  formData: {
    fullName: string;
    institution: string;
    coach: string;
  };
  onPositionsChange: (positions: {
    fullName: TextPosition;
    institution: TextPosition;
    coach: TextPosition;
  }) => void;
}

const PdfEditor = ({ pdfFile, formData, onPositionsChange }: PdfEditorProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(595);
  const [pageHeight, setPageHeight] = useState<number>(842);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [positions, setPositions] = useState({
    fullName: { x: 50, y: 55, fontSize: 24 },
    institution: { x: 50, y: 45, fontSize: 16 },
    coach: { x: 50, y: 35, fontSize: 14 }
  });
  
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    onPositionsChange(positions);
  }, [positions, onPositionsChange]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleMouseDown = (field: string, e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragging(field);
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - offset.x;
    const y = e.clientY - containerRect.top - offset.y;

    const percentX = (x / containerRect.width) * 100;
    const percentY = ((containerRect.height - y) / containerRect.height) * 100;

    setPositions(prev => ({
      ...prev,
      [dragging]: { 
        ...prev[dragging as keyof typeof prev], 
        x: Math.max(0, Math.min(100, percentX)),
        y: Math.max(0, Math.min(100, percentY))
      }
    }));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleFontSizeChange = (field: keyof typeof positions, delta: number) => {
    setPositions(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        fontSize: Math.max(8, Math.min(48, prev[field].fontSize + delta))
      }
    }));
  };

  const resetPositions = () => {
    setPositions({
      fullName: { x: 50, y: 55, fontSize: 24 },
      institution: { x: 50, y: 45, fontSize: 16 },
      coach: { x: 50, y: 35, fontSize: 14 }
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Move" size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-primary">Настройка позиций</h2>
            <p className="text-sm text-muted-foreground">Перетащите поля в нужное место</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={resetPositions}>
          <Icon name="RotateCcw" size={16} className="mr-2" />
          Сбросить
        </Button>
      </div>

      <div 
        ref={containerRef}
        className="relative border-2 border-border rounded-lg overflow-hidden bg-slate-50"
        style={{ cursor: dragging ? 'grabbing' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-96">
              <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
            </div>
          }
        >
          <Page 
            pageNumber={1} 
            width={containerRef.current?.clientWidth || 595}
            onLoadSuccess={(page) => {
              setPageWidth(page.width);
              setPageHeight(page.height);
            }}
          />
        </Document>

        {formData.fullName && (
          <div
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{
              left: `${positions.fullName.x}%`,
              bottom: `${positions.fullName.y}%`,
              transform: 'translate(-50%, 50%)',
              fontSize: `${positions.fullName.fontSize}px`,
              fontWeight: 'bold',
              color: '#e11d48',
              textShadow: '0 0 4px white, 0 0 8px white',
              whiteSpace: 'nowrap'
            }}
            onMouseDown={(e) => handleMouseDown('fullName', e)}
          >
            {formData.fullName}
            <div className="absolute -right-20 top-1/2 -translate-y-1/2 flex gap-1 bg-white rounded-md shadow-lg p-1">
              <button 
                onClick={(e) => { e.stopPropagation(); handleFontSizeChange('fullName', 2); }}
                className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded"
              >
                <Icon name="Plus" size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleFontSizeChange('fullName', -2); }}
                className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded"
              >
                <Icon name="Minus" size={14} />
              </button>
            </div>
          </div>
        )}

        {formData.institution && (
          <div
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{
              left: `${positions.institution.x}%`,
              bottom: `${positions.institution.y}%`,
              transform: 'translate(-50%, 50%)',
              fontSize: `${positions.institution.fontSize}px`,
              color: '#0ea5e9',
              textShadow: '0 0 4px white, 0 0 8px white',
              whiteSpace: 'nowrap'
            }}
            onMouseDown={(e) => handleMouseDown('institution', e)}
          >
            {formData.institution}
            <div className="absolute -right-20 top-1/2 -translate-y-1/2 flex gap-1 bg-white rounded-md shadow-lg p-1">
              <button 
                onClick={(e) => { e.stopPropagation(); handleFontSizeChange('institution', 2); }}
                className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded"
              >
                <Icon name="Plus" size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleFontSizeChange('institution', -2); }}
                className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded"
              >
                <Icon name="Minus" size={14} />
              </button>
            </div>
          </div>
        )}

        {formData.coach && (
          <div
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{
              left: `${positions.coach.x}%`,
              bottom: `${positions.coach.y}%`,
              transform: 'translate(-50%, 50%)',
              fontSize: `${positions.coach.fontSize}px`,
              color: '#8b5cf6',
              textShadow: '0 0 4px white, 0 0 8px white',
              whiteSpace: 'nowrap'
            }}
            onMouseDown={(e) => handleMouseDown('coach', e)}
          >
            Тренер: {formData.coach}
            <div className="absolute -right-20 top-1/2 -translate-y-1/2 flex gap-1 bg-white rounded-md shadow-lg p-1">
              <button 
                onClick={(e) => { e.stopPropagation(); handleFontSizeChange('coach', 2); }}
                className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded"
              >
                <Icon name="Plus" size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleFontSizeChange('coach', -2); }}
                className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded"
              >
                <Icon name="Minus" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Icon name="Info" size={16} />
          Перетаскивайте текст мышью и используйте кнопки +/- для изменения размера шрифта
        </p>
      </div>
    </Card>
  );
};

export default PdfEditor;
