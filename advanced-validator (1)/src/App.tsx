import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  CreditCard, 
  Play, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  AlertCircle,
  Copy,
  Lock,
  User as UserIcon,
  Phone
} from "lucide-react";

interface CardResult {
  card: string;
  status: "LIVE" | "DIE";
  message: string;
  name?: string;
  phone?: string;
  timestamp: string;
}

const ADM_USERNAME = "reset";
const ADM_PASS = "336498";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cardList, setCardList] = useState("");
  const [results, setResults] = useState<CardResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");

  // Auth logic
  useEffect(() => {
    const token = localStorage.getItem("validator_token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADM_USERNAME && password === ADM_PASS) {
      localStorage.setItem("validator_token", `token_${Date.now()}`);
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Credenciais inválidas");
    }
  };

  const generateRandomAddress = () => {
    const names = ["Gabriel", "Lucas", "Mateus", "Vitor", "Bruno", "Felipe", "Eduardo", "Danielle", "Juliana", "Patricia"];
    const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Pereira", "Lima", "Carvalho", "Ferreira", "Rodrigues", "Almeida"];
    const cities = ["Manchester", "London", "Liverpool", "Birmingham", "Leeds", "Glasgow", "Bristol"];
    
    // UK Phone patterns: +44 7... for mobile (most common for verification)
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000).toString();
    const telephone = "+447" + randomSuffix;

    return {
      firstname: names[Math.floor(Math.random() * names.length)],
      lastname: lastNames[Math.floor(Math.random() * lastNames.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      telephone: telephone,
      postcode: "M" + Math.floor(1 + Math.random() * 99) + " " + Math.floor(1 + Math.random() * 9) + "RH",
      company: "Ruia Holdings Ltd",
      street: ["Kearsley Mill, Crompton Road", "Radcliffe"],
      region: "Greater Manchester"
    };
  };

  const processCards = async () => {
    const rawCards = cardList.split("\n").filter(c => c.trim() !== "").slice(0, 400);
    if (rawCards.length === 0) {
      setError("Insira pelo menos um cartão na lista.");
      return;
    }

    setIsProcessing(true);
    setCurrentIndex(0);
    setError("");
    console.log("Iniciando processamento de " + rawCards.length + " cartões...");

    for (let i = 0; i < rawCards.length; i++) {
      if (!isProcessing) break; 
      
      const currentCard = rawCards[i];
      const address = generateRandomAddress();
      
      setCurrentIndex(i + 1);

      try {
        const response = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card: currentCard, address })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const newResult: CardResult = {
          ...data,
          timestamp: new Date().toLocaleTimeString('pt-BR')
        };

        setResults(prev => [newResult, ...prev]);
      } catch (err: any) {
        console.error("Erro no fetch:", err);
        setResults(prev => [{
          card: currentCard,
          status: "DIE",
          message: "Erro de Conexão ou 404 (Hospedagem Incompatível)",
          timestamp: new Date().toLocaleTimeString('pt-BR')
        }, ...prev]);
        
        // Se der erro 404 persistente, pode ser a hospedagem errada
        if (err.message.includes("404")) {
          setError("Erro 404: O servidor backend não foi encontrado. Certifique-se de não estar usando hospedagem estática como Netlify.");
          setIsProcessing(false);
          break;
        }
      }
      
      // Velocidade rápida (quase instantânea entre requisições)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsProcessing(false);
  };

  const clearResults = () => {
    setResults([]);
    setCurrentIndex(0);
  };

  const copyLives = () => {
    const lives = results
      .filter(r => r.status === "LIVE")
      .map(r => r.card)
      .join("\n");
    navigator.clipboard.writeText(lives);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#121212] border border-[#222] rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600/10 p-4 rounded-full">
              <ShieldCheck className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">Acesso Restrito</h1>
          <p className="text-gray-400 text-center text-sm mb-8">Identifique-se para continuar no sistema</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Usuário (ADM)</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Seu usuário..."
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Sua senha..."
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
            >
              Autenticar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const liveCards = results.filter(r => r.status === "LIVE");
  const dieCards = results.filter(r => r.status === "DIE");

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-blue-500/30">
      <nav className="border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
              VALIDATOR.CLOUD
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#222]">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              SYSTEM ACTIVE
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem("validator_token");
                setIsAuthenticated(false);
              }}
              className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors text-gray-500"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0f0f0f]">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  <h2 className="font-bold">Lista de Cartões</h2>
                </div>
                <span className="text-xs text-gray-500 font-mono">LIMITE: 400 LINHAS</span>
              </div>
              <textarea 
                value={cardList}
                onChange={(e) => setCardList(e.target.value)}
                placeholder="0000000000000000|00|0000|000"
                className="w-full h-64 bg-transparent p-6 text-sm font-mono focus:outline-none resize-none placeholder-gray-700 leading-relaxed"
              />
              <div className="px-6 py-4 border-t border-[#1a1a1a] flex items-center gap-3 bg-[#0f0f0f]">
                {error && (
                  <div className="mb-4 flex items-center gap-2 text-yellow-400 text-xs bg-yellow-400/10 p-3 rounded-xl border border-yellow-400/20">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
                <button 
                  onClick={processCards}
                  disabled={isProcessing || !cardList}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-95"
                >
                  <Play className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  {isProcessing ? `TESTE INICIADO (${currentIndex})` : 'INICIAR TESTE'}
                </button>
                <button 
                  onClick={() => setIsProcessing(false)}
                  disabled={!isProcessing}
                  className="px-6 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold py-3 rounded-xl transition-all border border-red-500/20"
                >
                  PARAR
                </button>
                <button 
                  onClick={clearResults}
                  className="p-3 bg-[#1a1a1a] hover:bg-[#222] rounded-xl transition-all text-gray-400"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-2xl">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total</p>
                <p className="text-2xl font-mono font-bold text-white">
                  {cardList.split("\n").filter(c => c.trim() !== "").length}
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-2xl">
                <p className="text-xs text-green-500/60 uppercase font-bold mb-1">Lives</p>
                <p className="text-2xl font-mono font-bold text-green-500">{liveCards.length}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-2xl">
                <p className="text-xs text-red-500/60 uppercase font-bold mb-1">Dies</p>
                <p className="text-2xl font-mono font-bold text-red-500">{dieCards.length}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-2xl">
                <p className="text-xs text-blue-500/60 uppercase font-bold mb-1">Fila</p>
                <p className="text-2xl font-mono font-bold text-blue-500">
                  {Math.max(0, cardList.split("\n").filter(c => c.trim() !== "").length - results.length)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-6 rounded-2xl">
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                Instruções
              </h3>
              <ul className="text-sm text-gray-400 space-y-2 list-disc ml-4">
                <li>Formato: Numero|Mes|Ano|Cvv</li>
                <li>Limite: 400 linhas por vez</li>
                <li>Address: Automático (UK based)</li>
                <li>Validação Cloud habilitada</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-bold">Aprovadas (LIVE)</h2>
              </div>
              <button 
                onClick={copyLives}
                className="text-xs bg-[#1a1a1a] hover:bg-[#222] text-gray-400 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all border border-[#222]"
              >
                <Copy className="w-3 h-3" />
                COPIAR TUDO
              </button>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {liveCards.length === 0 ? (
                  <p className="text-sm text-gray-600 italic">Nenhum cartão aprovado ainda...</p>
                ) : (
                  liveCards.map((res, idx) => (
                    <motion.div 
                      key={`${res.card}-${idx}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#0f1a0f] border border-green-500/40 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group hover:border-green-500/80 transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-green-50 text-sm md:text-lg tracking-widest">{res.card}</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-[10px] font-mono text-gray-400">{res.timestamp}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-[11px] items-center">
                        <span className="text-white font-black bg-green-600 px-2 py-0.5 rounded shadow-sm">LIVE</span>
                        {res.name && (
                          <div className="flex items-center gap-1 text-gray-300">
                            <UserIcon className="w-3 h-3 text-green-500" />
                            <span>{res.name}</span>
                          </div>
                        )}
                        {res.phone && (
                          <div className="flex items-center gap-1 text-gray-300 font-mono">
                            <Phone className="w-3 h-3 text-green-500" />
                            <span>{res.phone}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-red-100">Reprovadas (DIE)</h2>
              </div>
            </div>
            
            <div className="bg-[#1a0f0f] border border-red-500/20 rounded-2xl max-h-[500px] overflow-y-auto shadow-[0_0_15px_rgba(239,68,68,0.05)]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#251212] border-b border-red-500/20">
                  <tr className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                    <th className="px-4 py-3">Cartão</th>
                    <th className="px-4 py-3">Motivo</th>
                    <th className="px-4 py-3">Hora</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono">
                  {dieCards.map((res, idx) => (
                    <tr key={idx} className="border-b border-red-500/10 hover:bg-red-500/5 transition-colors">
                      <td className="px-4 py-3 text-red-200/60">{res.card}</td>
                      <td className="px-4 py-3">
                        <span className="text-red-500 font-bold">{res.message.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3 text-red-900">{res.timestamp}</td>
                    </tr>
                  ))}
                  {dieCards.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-700 italic">Nenhuma reprovação registrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
