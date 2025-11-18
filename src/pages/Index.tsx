import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    institution: '',
    coach: ''
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
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

  const handleGenerate = () => {
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

    toast({
      title: "Диплом сгенерирован",
      description: "Готовый диплом будет скачан автоматически",
    });
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

          <Card className="p-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
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
            >
              <Icon name="Sparkles" size={20} className="mr-2" />
              Сгенерировать диплом
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
