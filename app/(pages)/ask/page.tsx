"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  HelpCircle,
  AlertTriangle,
  BarChart3,
  Shield,
} from "lucide-react";
import { getAllSignals } from "@/lib/intake/demo-data";
import { normalizeSignals } from "@/lib/normalization/normalize";
import { scoreIncidents } from "@/lib/scoring/priority";
import { generateFallbackAnswer } from "@/lib/ask-fallback";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  groundedIn?: string[];
  confidence?: number;
}

const QUICK_QUESTIONS = [
  {
    icon: AlertTriangle,
    question: "Why is this ranked above the flood report?",
    color: "text-orange-400",
  },
  {
    icon: BarChart3,
    question: "What should my team do in the next 30 minutes?",
    color: "text-blue-400",
  },
  {
    icon: Shield,
    question: "What is the biggest risk if we delay?",
    color: "text-red-400",
  },
  {
    icon: HelpCircle,
    question: "Which incident should we ignore for now?",
    color: "text-slate-400",
  },
];


export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const incidents = normalizeSignals(getAllSignals());
  const scores = scoreIncidents(incidents);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const askQuestion = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const ranked = [...scores].sort((a, b) => a.rank - b.rank);
      const top5 = ranked.slice(0, 5).map((s) => {
        const inc = incidents.find((i) => i.id === s.incidentId)!;
        return `#${s.rank} [Score: ${s.compositeScore}] ${inc.title} — Severity ${inc.severity}/10, Urgency ${inc.urgency}/10, ${inc.affectedPopulation.toLocaleString()} affected, Zone ${inc.location.zone}`;
      });

      const contextLines = [
        `Total active incidents: ${incidents.length}`,
        "PRIORITY QUEUE (ranked):",
        ...top5,
      ].join("\n");

      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-secret": "f2487aebd6c1e8c4160e50b22d197437" },
        body: JSON.stringify({ question, context: contextLines }),
      });

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.answer || generateFallbackAnswer(question, incidents, scores).answer,
        groundedIn: data.groundedIn || [],
        confidence: data.confidence || 0.8,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: generateFallbackAnswer(question, incidents, scores).answer,
        groundedIn: ["Local system state"],
        confidence: 0.75,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Ask CivicPulse</h1>
            <p className="text-xs text-slate-400">Grounded answers from system state and enriched incident data</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <Bot className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-slate-300">How can I help?</h2>
              <p className="text-sm text-slate-500 mb-8">
                Ask questions about your incidents, priorities, or recommended actions
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
                {QUICK_QUESTIONS.map((qq, i) => (
                  <button
                    key={i}
                    onClick={() => askQuestion(qq.question)}
                    className="flex items-start gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors text-left"
                  >
                    <qq.icon className={`w-4 h-4 mt-0.5 shrink-0 ${qq.color}`} />
                    <span className="text-sm text-slate-300">{qq.question}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="p-2 rounded-lg bg-blue-500/10 h-fit shrink-0">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
              )}
              <div className={`max-w-[80%] p-4 rounded-xl ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 border border-slate-800"
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.groundedIn && msg.groundedIn.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-700/50">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Grounded in: </span>
                    <span className="text-[10px] text-slate-400">{msg.groundedIn.join(", ")}</span>
                    {typeof msg.confidence === "number" && (
                      <span className="text-[10px] text-slate-500 ml-2">
                        Confidence: {(msg.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="p-2 rounded-lg bg-slate-700 h-fit shrink-0">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 h-fit">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-sm text-slate-400">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askQuestion(input)}
            placeholder="Ask about incidents, priorities, actions, or risks..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={() => askQuestion(input)}
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
