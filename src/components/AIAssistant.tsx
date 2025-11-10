import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';
import { Bot, Send, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIAssistantProps {
  initialOpen?: boolean;
  showToggle?: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  initialOpen = false, 
  showToggle = true 
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { askAI } = useApp();

  // Auto-scroll ke bawah ketika pesan baru ditambahkan
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); // Tambahkan isLoading ke dependency agar menggulir saat loading selesai

  const scrollToBottom = () => {
    // Gunakan pendekatan yang lebih umum untuk menggulir ke bawah
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 50); // Tambahkan sedikit delay agar konten benar-benar dimuat
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !askAI) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      sender: 'user',
      timestamp: new Date()
    };

    // Tambahkan pesan pengguna
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      // Kirim pertanyaan ke AI
      const aiResponse = await askAI(question);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      // Tambahkan respons AI
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  if (!showToggle && !isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showToggle && !isOpen && (
        <Button
          onClick={toggleOpen}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
          size="lg"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-80 md:w-96 shadow-xl flex flex-col h-[500px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Asisten Keuangan AI
              </CardTitle>
              {showToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleOpen}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tanyakan tentang pemasukan, pengeluaran, atau data keuangan lainnya
            </p>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 p-0">
            <div className="flex-1 overflow-hidden" ref={messagesContainerRef}>
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4 h-full">
                  <div className="h-full">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground h-full flex flex-col justify-center">
                        <Bot className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm">Apa yang ingin Anda tanyakan?</p>
                        <p className="text-xs mt-2">
                          Contoh: "Berapa total pemasukan minggu ini?" atau "Barang apa yang terjual paling banyak?"
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.sender === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {message.sender === 'ai' ? (
                                  <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="text-sm break-words">{message.text}</div>
                              </div>
                              <div
                                className={`text-xs mt-1 ${
                                  message.sender === 'user'
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                              <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                <div className="text-sm">AI sedang memproses pertanyaan Anda...</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Tanyakan tentang keuangan Anda..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={isLoading || !question.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAssistant;