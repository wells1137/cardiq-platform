import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Bot, BrainCircuit, MessageCircle, Send, Sparkles, Scale, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY_PREFIX = "card-advisor-history:";

function getStorageKey(cardId?: number) {
  return `${STORAGE_KEY_PREFIX}${cardId || "global"}`;
}

export function CardAdvisorDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingSuggestions, setPendingSuggestions] = useState<string[]>([]);
  const [relatedCards, setRelatedCards] = useState<any[]>([]);
  const [compareCardId, setCompareCardId] = useState<number | undefined>();
  const [location] = useLocation();
  const [, params] = useRoute("/card/:id");
  const currentCardId = params?.id ? Number(params.id) : undefined;
  const currentCardQuery = trpc.cards.getById.useQuery({ id: currentCardId || 0 }, { enabled: !!currentCardId });
  const playerCardsQuery = trpc.cards.getByPlayer.useQuery({ playerId: currentCardQuery.data?.playerId || 0 }, { enabled: !!currentCardQuery.data?.playerId });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const compareCandidates = useMemo(
    () => (playerCardsQuery.data || []).filter((item: any) => item.id !== currentCardId).slice(0, 5),
    [playerCardsQuery.data, currentCardId],
  );
  const selectedCompareCard = useMemo(
    () => compareCandidates.find((item: any) => item.id === compareCardId),
    [compareCandidates, compareCardId],
  );

  const chatMutation = trpc.cards.chatAdvisor.useMutation({
    onSuccess: (data) => {
      const nextMessages = [...messagesRef.current, { role: "assistant" as const, content: data.answer }];
      setMessages(nextMessages);
      messagesRef.current = nextMessages;
      persistConversation(currentCardId, nextMessages);
      setPendingSuggestions(data.suggestions?.length ? data.suggestions : []);
      setRelatedCards(data.relatedCards || []);
    },
    onError: () => {
      const fallback = [...messagesRef.current, { role: "assistant" as const, content: "我暂时没连上分析引擎，不过你可以换个问法，或者打开具体卡片详情页后再问我。" }];
      setMessages(fallback);
      messagesRef.current = fallback;
      persistConversation(currentCardId, fallback);
    },
  });

  const messagesRef = useRef<ChatMessage[]>([]);
  const title = useMemo(() => (currentCardId ? "当前卡片对话" : "球星卡顾问"), [currentCardId]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    const stored = loadConversation(currentCardId);
    if (stored.length > 0) {
      setMessages(stored);
      messagesRef.current = stored;
    } else {
      const defaults = [
        {
          role: "assistant" as const,
          content: currentCardId
            ? "我已绑定你当前打开的这张卡。现在可以直接问我：值不值得买、为什么涨跌、风险点、和同球员其他品牌怎么比。"
            : "你好，我是你的球星卡 AI 顾问。打开任意卡片详情页后提问，我会结合该卡的走势和 AI 分析回答。",
        },
      ];
      setMessages(defaults);
      messagesRef.current = defaults;
      persistConversation(currentCardId, defaults);
    }
    setPendingSuggestions(
      currentCardId
        ? ["这张卡值不值得买？", "它最近为什么涨/跌？", "这张卡适合长期持有吗？"]
        : ["Prizm 和 Select 有什么区别？", "什么样的卡更保值？", "怎么看一张卡是不是高位？"],
    );
    setRelatedCards([]);
    setCompareCardId(undefined);
  }, [currentCardId, location]);

  function send(nextMessage?: string) {
    const finalMessage = (nextMessage ?? message).trim();
    if (!finalMessage || chatMutation.isPending) return;
    const nextMessages = [...messagesRef.current, { role: "user" as const, content: finalMessage }];
    setMessages(nextMessages);
    messagesRef.current = nextMessages;
    persistConversation(currentCardId, nextMessages);
    setMessage("");
    chatMutation.mutate({
      message: finalMessage,
      cardId: currentCardId,
      compareCardId,
      history: nextMessages.slice(-8),
    });
  }

  function clearConversation() {
    const defaults = [
      {
        role: "assistant" as const,
        content: currentCardId
          ? "会话已清空。你可以重新问我这张卡值不值得买、和别的卡怎么比。"
          : "会话已清空。你可以重新问我品牌、系列、价格或投资逻辑。",
      },
    ];
    setMessages(defaults);
    messagesRef.current = defaults;
    persistConversation(currentCardId, defaults);
    setRelatedCards([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-3 rounded-full border border-primary/30 bg-[linear-gradient(135deg,rgba(56,189,248,0.92),rgba(139,92,246,0.92))] px-5 py-3 text-sm font-black text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition hover:scale-[1.02] hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
          <BrainCircuit className="h-4 w-4" /> AI 卡片顾问
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] border-white/10 bg-[#0b1020] p-0 text-white shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-3xl">
        <DialogHeader className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_26%),linear-gradient(135deg,rgba(17,24,39,0.96),rgba(11,16,32,0.98))] px-6 py-5 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2 text-white"><Bot className="h-5 w-5 text-primary" /> {title}</DialogTitle>
              <DialogDescription className="text-white/60">{currentCardId ? "基于当前卡片价格、趋势、AI 研判来回答。" : "支持品牌、系列、价格逻辑和买卖时机问答。"}</DialogDescription>
            </div>
            <button onClick={clearConversation} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/65 hover:bg-white/10">清空记录</button>
          </div>
          {selectedCompareCard && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Scale className="h-3.5 w-3.5" /> 正在对比：{selectedCompareCard.year} {selectedCompareCard.brand} {selectedCompareCard.set}
              <button onClick={() => setCompareCardId(undefined)} className="text-primary/80 hover:text-primary"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </DialogHeader>

        {compareCandidates.length > 0 && (
          <div className="border-b border-white/10 px-6 py-3">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">快捷对比</div>
            <div className="flex flex-wrap gap-2">
              {compareCandidates.map((card: any) => (
                <button
                  key={card.id}
                  onClick={() => setCompareCardId(card.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${compareCardId === card.id ? "border-primary/30 bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                >
                  对比 {card.brand} {card.set}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={scrollRef} className="max-h-[48vh] space-y-4 overflow-y-auto px-6 py-5">
          {messages.map((item, index) => (
            <div key={`${item.role}-${index}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-[24px] px-4 py-3 text-sm leading-6 ${item.role === "user" ? "bg-primary text-primary-foreground" : "border border-white/10 bg-white/5 text-white/80"}`}>
                {item.content}
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                <Sparkles className="h-4 w-4 animate-pulse text-primary" /> 正在分析...
              </div>
            </div>
          )}
        </div>

        {relatedCards.length > 0 && (
          <div className="border-t border-white/10 px-6 py-3">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">相关推荐</div>
            <div className="grid gap-2 md:grid-cols-3">
              {relatedCards.map((card) => (
                <Link key={card.cardId} href={`/card/${card.cardId}`} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm hover:bg-white/10">
                  <div className="font-bold text-white">{card.playerName}</div>
                  <div className="mt-1 text-xs text-white/50">{card.title}</div>
                  <div className="mt-2 text-xs text-primary">{card.reason}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-white/10 px-6 py-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {pendingSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => send(suggestion)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1 rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 focus-within:border-primary/35">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                rows={3}
                placeholder={selectedCompareCard ? "比如：这两张哪张更适合短线？" : currentCardId ? "比如：这张卡现在能买吗？" : "比如：Prizm 和 Select 哪个更适合新手？"}
                className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/35"
              />
            </div>
            <button
              onClick={() => send()}
              disabled={chatMutation.isPending || !message.trim()}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
            >
              {chatMutation.isPending ? <MessageCircle className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function loadConversation(cardId?: number): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(cardId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-20) : [];
  } catch {
    return [];
  }
}

function persistConversation(cardId: number | undefined, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(cardId), JSON.stringify(messages.slice(-20)));
}
