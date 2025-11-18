import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import PdfEditor from '@/components/PdfEditor';

interface TextPosition {
  x: number;
  y: number;
  fontSize: number;
}

const Index = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    institution: '',
    coach: ''
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [positions, setPositions] = useState<{
    fullName: TextPosition;
    institution: TextPosition;
    coach: TextPosition;
  }>({
    fullName: { x: 50, y: 55, fontSize: 24 },
    institution: { x: 50, y: 45, fontSize: 16 },
    coach: { x: 50, y: 35, fontSize: 14 }
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setShowEditor(false);
      toast({
        title: "Шаблон загружен",
        description: `Файл "${file.name}" успешно загружен`,
      });
    } else {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, загрузите PDF файл",
        variant: "destructive"
      });
    }
  };

  const handlePositionsChange = useCallback((newPositions: {
    fullName: TextPosition;
    institution: TextPosition;
    coach: TextPosition;
  }) => {
    setPositions(newPositions);
  }, []);

  const handleGenerate = async () => {
    if (!pdfFile) {
      toast({
        title: "Загрузите шаблон",
        description: "Необходимо загрузить PDF шаблон диплома",
        variant: "destructive"
      });
      return;
    }

    if (!formData.fullName || !formData.institution || !formData.coach) {
      toast({
        title: "Заполните все поля",
        description: "Все поля формы обязательны для заполнения",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      pdfDoc.registerFontkit(fontkit);
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
      };

      const fontCache: Record<string, any> = {};
      
      const getFontUrl = (fontFamily: string, fontWeight: string, fontStyle: string) => {
        const isItalic = fontStyle === 'italic';
        const isBold = fontWeight === 'bold';
        
        if (isBold && isItalic) {
          return 'https://fonts.gstatic.com/s/roboto/v30/KFOjCnqEu92Fr1Mu51TzBic6CsQ.ttf'; // Bold Italic
        } else if (isBold) {
          return 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf'; // Bold
        } else if (isItalic) {
          return 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu51xIIzI.ttf'; // Italic
        } else {
          return 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf'; // Regular
        }
      };
      
      const loadFont = async (fontFamily: string, fontWeight: string, fontStyle: string) => {
        const cacheKey = `${fontFamily}-${fontWeight}-${fontStyle}`;
        if (fontCache[cacheKey]) {
          return fontCache[cacheKey];
        }
        
        const fontUrl = getFontUrl(fontFamily, fontWeight, fontStyle);
        const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
        const font = await pdfDoc.embedFont(fontBytes);
        fontCache[cacheKey] = font;
        return font;
      };

      const fullNameFont = await loadFont(positions.fullName.fontFamily, positions.fullName.fontWeight, positions.fullName.fontStyle);
      const fullNameColor = hexToRgb(positions.fullName.color);
      const fullNameWidth = fullNameFont.widthOfTextAtSize(formData.fullName, positions.fullName.fontSize);
      const fullNameX = (width * positions.fullName.x / 100) - (fullNameWidth / 2);
      const fullNameY = (height * positions.fullName.y / 100);
      
      console.log('PDF size:', { width, height });
      console.log('FullName position:', { 
        percent: positions.fullName, 
        pixels: { x: fullNameX, y: fullNameY },
        textWidth: fullNameWidth
      });
      
      firstPage.drawText(formData.fullName, {
        x: fullNameX,
        y: fullNameY,
        size: positions.fullName.fontSize,
        font: fullNameFont,
        color: rgb(fullNameColor.r, fullNameColor.g, fullNameColor.b),
      });
      
      const institutionFont = await loadFont(positions.institution.fontFamily, positions.institution.fontWeight, positions.institution.fontStyle);
      const institutionColor = hexToRgb(positions.institution.color);
      const institutionWidth = institutionFont.widthOfTextAtSize(formData.institution, positions.institution.fontSize);
      const institutionX = (width * positions.institution.x / 100) - (institutionWidth / 2);
      
      firstPage.drawText(formData.institution, {
        x: institutionX,
        y: (height * positions.institution.y / 100),
        size: positions.institution.fontSize,
        font: institutionFont,
        color: rgb(institutionColor.r, institutionColor.g, institutionColor.b),
      });
      
      const coachFont = await loadFont(positions.coach.fontFamily, positions.coach.fontWeight, positions.coach.fontStyle);
      const coachColor = hexToRgb(positions.coach.color);
      const coachText = `Тренер: ${formData.coach}`;
      const coachWidth = coachFont.widthOfTextAtSize(coachText, positions.coach.fontSize);
      const coachX = (width * positions.coach.x / 100) - (coachWidth / 2);
      
      firstPage.drawText(coachText, {
        x: coachX,
        y: (height * positions.coach.y / 100),
        size: positions.coach.fontSize,
        font: coachFont,
        color: rgb(coachColor.r, coachColor.g, coachColor.b),
      });
      
      const pdfBytes = await pdfDoc.save();
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diploma_${formData.fullName.replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Диплом сгенерирован",
        description: "Файл успешно скачан",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast({
        title: "Ошибка генерации",
        description: `Не удалось создать диплом: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Icon name="Award" size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">
            Генератор дипломов
          </h1>
          <p className="text-muted-foreground text-lg">
            Автоматическое заполнение сертификатов и дипломов
          </p>
        </div>

        <div className="grid gap-6 mb-6">
          <Card className="p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="Upload" size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary">Шаг 1. Загрузка шаблона</h2>
                <p className="text-sm text-muted-foreground">Выберите PDF шаблон диплома</p>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="pdf-upload"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Icon name="FileUp" size={28} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {pdfFile ? pdfFile.name : 'Нажмите для загрузки PDF'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Поддерживается формат PDF
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </Card>

          <Card className="p-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="FileText" size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary">Шаг 2. Заполнение данных</h2>
                <p className="text-sm text-muted-foreground">Введите информацию для диплома</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  ФИ получателя
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Иванов Иван"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="institution" className="text-sm font-medium text-foreground">
                  Учреждение
                </Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                  placeholder="ГБОУ СОШ №1"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="coach" className="text-sm font-medium text-foreground">
                  Тренер
                </Label>
                <Input
                  id="coach"
                  value={formData.coach}
                  onChange={(e) => handleInputChange('coach', e.target.value)}
                  placeholder="Петров П.П."
                  className="mt-1.5"
                />
              </div>
            </div>
          </Card>

          {pdfFile && formData.fullName && formData.institution && formData.coach && (
            <div className="animate-scale-in" style={{ animationDelay: '0.15s' }}>
              {!showEditor ? (
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon name="Settings" size={20} className="text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-primary">Настройка позиций</h2>
                        <p className="text-sm text-muted-foreground">Точная расстановка текста на дипломе</p>
                      </div>
                    </div>
                    <Button onClick={() => setShowEditor(true)} variant="outline">
                      <Icon name="Edit" size={16} className="mr-2" />
                      Открыть редактор
                    </Button>
                  </div>
                </Card>
              ) : (
                <PdfEditor 
                  pdfFile={pdfFile} 
                  formData={formData}
                  onPositionsChange={handlePositionsChange}
                />
              )}
            </div>
          )}

          <Card className="p-6 animate-scale-in" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="Download" size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary">Шаг 3. Генерация</h2>
                <p className="text-sm text-muted-foreground">Создайте готовый диплом</p>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              className="w-full h-12 text-base font-medium"
              size="lg"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Icon name="Sparkles" size={20} className="mr-2" />
                  Сгенерировать диплом
                </>
              )}
            </Button>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 Генератор дипломов. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;