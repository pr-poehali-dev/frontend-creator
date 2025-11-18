import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface TextPosition {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
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
    fullName: { x: 50, y: 65, fontSize: 28, color: '#000000', fontFamily: 'Roboto', fontWeight: 'bold' as const, fontStyle: 'normal' as const },
    institution: { x: 50, y: 35, fontSize: 18, color: '#000000', fontFamily: 'Roboto', fontWeight: 'normal' as const, fontStyle: 'italic' as const },
    coach: { x: 50, y: 15, fontSize: 16, color: '#000000', fontFamily: 'Roboto', fontWeight: 'normal' as const, fontStyle: 'normal' as const }
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

  const handleColorChange = (field: keyof typeof positions, color: string) => {
    setPositions(prev => ({
      ...prev,
      [field]: { ...prev[field], color }
    }));
  };

  const handleFontFamilyChange = (field: keyof typeof positions, fontFamily: string) => {
    setPositions(prev => ({
      ...prev,
      [field]: { ...prev[field], fontFamily }
    }));
  };

  const handleFontWeightToggle = (field: keyof typeof positions) => {
    setPositions(prev => ({
      ...prev,
      [field]: { 
        ...prev[field], 
        fontWeight: prev[field].fontWeight === 'normal' ? 'bold' : 'normal'
      }
    }));
  };

  const handleFontStyleToggle = (field: keyof typeof positions) => {
    setPositions(prev => ({
      ...prev,
      [field]: { 
        ...prev[field], 
        fontStyle: prev[field].fontStyle === 'normal' ? 'italic' : 'normal'
      }
    }));
  };

  const resetPositions = () => {
    setPositions({
      fullName: { x: 50, y: 65, fontSize: 28, color: '#000000', fontFamily: 'Roboto', fontWeight: 'bold', fontStyle: 'normal' },
      institution: { x: 50, y: 35, fontSize: 18, color: '#000000', fontFamily: 'Roboto', fontWeight: 'normal', fontStyle: 'italic' },
      coach: { x: 50, y: 15, fontSize: 16, color: '#000000', fontFamily: 'Roboto', fontWeight: 'normal', fontStyle: 'normal' }
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
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="pointer-events-none">
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
        </div>

        {formData.fullName && (
          <div
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{
              left: `${positions.fullName.x}%`,
              bottom: `${positions.fullName.y}%`,
              transform: 'translate(-50%, 50%)',
              fontSize: `${positions.fullName.fontSize}px`,
              fontWeight: positions.fullName.fontWeight,
              fontStyle: positions.fullName.fontStyle,
              fontFamily: positions.fullName.fontFamily,
              color: positions.fullName.color,
              textShadow: '0 0 4px white, 0 0 8px white',
              whiteSpace: 'nowrap'
            }}
            onMouseDown={(e) => handleMouseDown('fullName', e)}
          >
            {formData.fullName}
            <div className="absolute -right-56 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col gap-2">
              <div className="bg-white rounded-md shadow-lg p-2">
                <div className="text-xs text-slate-600 mb-2">{positions.fullName.fontSize}px</div>
                <div className="flex gap-1 mb-2">
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontSizeChange('fullName', 2)}
                  >
                    <Icon name="Plus" size={14} />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontSizeChange('fullName', -2)}
                  >
                    <Icon name="Minus" size={14} />
                  </Button>
                </div>
                <div className="flex gap-1 mb-2">
                  <Button 
                    variant={positions.fullName.fontWeight === 'bold' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-6 h-6 p-0 font-bold"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontWeightToggle('fullName')}
                  >
                    B
                  </Button>
                  <Button 
                    variant={positions.fullName.fontStyle === 'italic' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-6 h-6 p-0 italic"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontStyleToggle('fullName')}
                  >
                    I
                  </Button>
                </div>
                <input 
                  type="color" 
                  value={positions.fullName.color}
                  onChange={(e) => handleColorChange('fullName', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full h-8 rounded cursor-pointer"
                />
                <select
                  value={positions.fullName.fontFamily}
                  onChange={(e) => handleFontFamilyChange('fullName', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full mt-2 text-xs border rounded p-1"
                >
                  <option value="Roboto">Roboto</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
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
              fontWeight: positions.institution.fontWeight,
              fontStyle: positions.institution.fontStyle,
              fontFamily: positions.institution.fontFamily,
              color: positions.institution.color,
              textShadow: '0 0 4px white, 0 0 8px white',
              whiteSpace: 'nowrap'
            }}
            onMouseDown={(e) => handleMouseDown('institution', e)}
          >
            {formData.institution}
            <div className="absolute -right-56 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col gap-2">
              <div className="bg-white rounded-md shadow-lg p-2">
                <div className="text-xs text-slate-600 mb-2">{positions.institution.fontSize}px</div>
                <div className="flex gap-1 mb-2">
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontSizeChange('institution', 2)}
                  >
                    <Icon name="Plus" size={14} />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontSizeChange('institution', -2)}
                  >
                    <Icon name="Minus" size={14} />
                  </Button>
                </div>
                <div className="flex gap-1 mb-2">
                  <Button 
                    variant={positions.institution.fontWeight === 'bold' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-6 h-6 p-0 font-bold"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontWeightToggle('institution')}
                  >
                    B
                  </Button>
                  <Button 
                    variant={positions.institution.fontStyle === 'italic' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-6 h-6 p-0 italic"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontStyleToggle('institution')}
                  >
                    I
                  </Button>
                </div>
                <input 
                  type="color" 
                  value={positions.institution.color}
                  onChange={(e) => handleColorChange('institution', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full h-8 rounded cursor-pointer"
                />
                <select
                  value={positions.institution.fontFamily}
                  onChange={(e) => handleFontFamilyChange('institution', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full mt-2 text-xs border rounded p-1"
                >
                  <option value="Roboto">Roboto</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
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
              fontWeight: positions.coach.fontWeight,
              fontStyle: positions.coach.fontStyle,
              fontFamily: positions.coach.fontFamily,
              color: positions.coach.color,
              textShadow: '0 0 4px white, 0 0 8px white',
              whiteSpace: 'nowrap'
            }}
            onMouseDown={(e) => handleMouseDown('coach', e)}
          >
            Тренер: {formData.coach}
            <div className="absolute -right-56 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col gap-2">
              <div className="bg-white rounded-md shadow-lg p-2">
                <div className="text-xs text-slate-600 mb-2">{positions.coach.fontSize}px</div>
                <div className="flex gap-1 mb-2">
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontSizeChange('coach', 2)}
                  >
                    <Icon name="Plus" size={14} />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontSizeChange('coach', -2)}
                  >
                    <Icon name="Minus" size={14} />
                  </Button>
                </div>
                <div className="flex gap-1 mb-2">
                  <Button 
                    variant={positions.coach.fontWeight === 'bold' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-6 h-6 p-0 font-bold"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontWeightToggle('coach')}
                  >
                    B
                  </Button>
                  <Button 
                    variant={positions.coach.fontStyle === 'italic' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-6 h-6 p-0 italic"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleFontStyleToggle('coach')}
                  >
                    I
                  </Button>
                </div>
                <input 
                  type="color" 
                  value={positions.coach.color}
                  onChange={(e) => handleColorChange('coach', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full h-8 rounded cursor-pointer"
                />
                <select
                  value={positions.coach.fontFamily}
                  onChange={(e) => handleFontFamilyChange('coach', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full mt-2 text-xs border rounded p-1"
                >
                  <option value="Roboto">Roboto</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
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