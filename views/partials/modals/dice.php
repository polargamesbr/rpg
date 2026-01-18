<!-- Modal de Dados -->
<div id="diceModal" class="hidden fixed inset-0 z-[200] modal-overlay bg-black/80 flex items-center justify-center p-6">
    <div class="relative w-full max-w-5xl bg-zinc-900/80 backdrop-blur-3xl border border-emerald-500/30 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row z-10 animate-in zoom-in-95 duration-500 ring-1 ring-white/10">
        <!-- Painel Esquerdo: D20 -->
        <div class="w-full md:w-[40%] p-8 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-emerald-500/30 bg-black/40">
            <div class="absolute inset-0 bg-emerald-500/10 opacity-20"></div>
            <div class="relative w-48 h-48 flex items-center justify-center group shrink-0 z-10">
                <div class="absolute inset-0 border-[2px] border-dashed border-white/10 rounded-full animate-spin-slow transition-all duration-[2000ms]"></div>
                <div class="relative w-40 h-40 transition-all duration-300 animate-float">
                    <div class="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full transition-all duration-500 opacity-40"></div>
                    <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-2xl overflow-visible">
                        <defs>
                            <linearGradient id="dieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#111"></stop>
                                <stop offset="100%" stop-color="#000"></stop>
                            </linearGradient>
                            <linearGradient id="borderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#10b981"></stop>
                                <stop offset="100%" stop-color="#000"></stop>
                            </linearGradient>
                        </defs>
                        <path d="M50 5 L93 28 L93 72 L50 95 L7 72 L7 28 Z" fill="url(#dieGradient)" stroke="url(#borderGradient)" stroke-width="2.5"></path>
                        <path d="M50 5 L50 50 L93 28" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"></path>
                        <path d="M50 5 L7 28 L50 50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"></path>
                        <path d="M7 28 L7 72 L50 50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"></path>
                        <path d="M93 28 L50 50 L93 72" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"></path>
                        <path d="M7 72 L50 95 L50 50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"></path>
                        <path d="M93 72 L50 50 L50 95" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"></path>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center z-10">
                        <span id="diceResult" class="text-6xl font-black cinzel transition-all duration-100 text-amber-500 opacity-100 scale-110">?</span>
                    </div>
                </div>
            </div>
            <div class="h-16 flex items-center justify-center mt-6 z-10 w-full">
                <div class="flex flex-col items-center gap-2">
                    <div class="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-black animate-pulse">O destino aguarda...</div>
                </div>
            </div>
        </div>
        
        <!-- Painel Direito: Detalhes -->
        <div class="flex-1 p-8 flex flex-col justify-center gap-6 min-h-0 relative">
            <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div id="attributeIcon" class="p-4 rounded-2xl border shadow-lg bg-emerald-500/10 border-emerald-500/30 text-emerald-400 transform -rotate-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye">
                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </div>
                        <div>
                            <h2 id="attributeName" class="text-3xl font-black tracking-widest uppercase cinzel text-emerald-400 drop-shadow-lg">Atributo</h2>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-slate-500 text-[10px] font-bold tracking-widest uppercase">ATRIBUTO BASE:</span>
                                <div class="flex items-center gap-1.5 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded shadow-inner">
                                    <span id="attributeBase" class="text-slate-200 font-mono font-bold text-sm tracking-tighter">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="relative overflow-hidden rounded-xl bg-black/60 border border-emerald-500/30 p-4 flex items-center justify-between shadow-inner">
                    <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <div class="flex flex-col">
                        <span class="text-slate-500 text-[9px] font-black tracking-[0.2em] uppercase mb-0.5">Dificuldade do Teste</span>
                        <span id="difficulty" class="text-white font-black text-xl tracking-wider font-mono uppercase">DIFICULDADE 10</span>
                    </div>
                    <div class="h-10 w-px bg-white/10"></div>
                    <div class="flex flex-col items-end">
                        <span class="text-slate-500 text-[9px] font-black tracking-[0.2em] uppercase mb-0.5">Risco Estimado</span>
                        <span id="risk" class="font-black text-xl tracking-[0.1em] uppercase text-blue-400">Provável</span>
                    </div>
                </div>
            </div>
            <div class="relative">
                <div class="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500/10 opacity-40 rounded-full"></div>
                <div class="pl-6 py-2">
                    <span class="text-slate-600 text-[9px] font-black tracking-[0.2em] uppercase block mb-3">Sua Escolha:</span>
                    <p id="userChoice" class="font-serif text-slate-300 italic text-lg md:text-xl leading-relaxed drop-shadow-md">""</p>
                </div>
            </div>
            <div class="mt-4 flex flex-col gap-3">
                <div class="flex items-center gap-3">
                    <button id="rollDiceBtn" class="flex-1 group relative overflow-hidden py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-500/30 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                        <div class="absolute inset-0 bg-emerald-500/10 opacity-100 group-hover:opacity-100 transition-opacity"></div>
                        <div class="relative z-10 flex items-center justify-center gap-4 text-white font-black text-lg tracking-[0.3em] uppercase drop-shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles text-emerald-400 animate-pulse">
                                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                                <path d="M20 2v4"></path>
                                <path d="M22 4h-4"></path>
                                <circle cx="4" cy="20" r="2"></circle>
                            </svg>
                            ROLANDO O DESTINO
                        </div>
                        <div class="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </button>
                    <button id="closeDiceModalBtn" class="px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-xl border border-white/5 transition-all text-xs font-black tracking-widest uppercase">Cancelar</button>
                </div>
            </div>
        </div>
    </div>
</div>

