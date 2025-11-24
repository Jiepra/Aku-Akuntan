import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';
import { Bot, Send, User, X } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen: externalOpen,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Gunakan state eksternal jika disediakan, jika tidak gunakan state internal
  const isComponentOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || ((open: boolean) => setInternalOpen(open));

  const { askAI } = useApp();

  // Auto-scroll ke bawah ketika pesan baru ditambahkan
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial greeting message saat dibuka
  useEffect(() => {
    if (isComponentOpen && messages.length === 0) {
      const initialMessage: Message = {
        id: 'initial-' + Date.now(),
        text: 'Halo! Saya asisten keuangan Anda. Ada yang bisa saya bantu terkait informasi akuntansi Anda?',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [isComponentOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 50);
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

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      const aiResponse = await askAI(question);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  if (!isComponentOpen) {
    // Tombol untuk membuka chat jika tertutup
    return (
      <Button 
        onClick={() => setOpen(true)} 
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2"
        size="sm"
      >
        <Bot className="h-4 w-4" />
        AI
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-20 right-4 w-80 md:w-96 shadow-xl flex flex-col h-[500px] z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Asisten Keuangan AI
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
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
                        className={`flex items-start gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.sender === 'ai' && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 flex-shrink-0">
                            <Bot className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        
                        <div
                          className={`flex flex-col max-w-[75%] ${
                            message.sender === 'user' ? 'items-end order-2' : 'items-start order-1'
                          }`}
                        >
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              message.sender === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {message.sender === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1 flex-shrink-0 order-3">
                            <User className="w-4 h-4 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                          <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" />
                            <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.2s]" />
                            <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.4s]" />
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
              placeholder="Ketik pesan Anda..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !question.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistant;