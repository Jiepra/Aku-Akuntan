import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from '@/contexts/AppContext';

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AIChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIChatDialog({ open, onOpenChange }: AIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { askAI } = useApp();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial greeting message
  useEffect(() => {
    if (open && messages.length === 0) {
      const initialMessage: Message = {
        role: "assistant",
        content: "Halo! Saya asisten keuangan Anda. Ada yang bisa saya bantu terkait informasi akuntansi Anda?",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages([initialMessage]);
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || !askAI) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Gunakan askAI dari AppContext
      const response = await askAI(input);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[400px] h-[600px] flex flex-col bg-background border rounded-lg shadow-2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 font-semibold">
            <Bot className="w-5 h-5" />
            Asisten Keuangan AI
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tanyakan tentang pemasukan, pengeluaran, atau data keuangan lainnya
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              <div
                className={cn(
                  "flex flex-col max-w-[70%]",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {message.timestamp}
                </span>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
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
      </ScrollArea>

      <div className="border-t px-6 py-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ketik pesan Anda..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}