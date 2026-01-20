<?php $activePage = 'game'; ?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RPG Game - Stormhaven</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * {
            font-family: 'Inter', sans-serif;
        }
        body {
            background: #0a0a0a;
            overflow-x: hidden;
            overflow-y: auto;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        .modal-overlay {
            backdrop-filter: blur(8px);
        }
        .d20-die {
            animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes pulse-glow {
            0%, 100% { opacity: 1; filter: drop-shadow(0 0 20px rgba(249, 115, 22, 0.3)); }
            50% { opacity: 0.8; filter: drop-shadow(0 0 30px rgba(249, 115, 22, 0.5)); }
        }
    </style>
</head>
<body class="bg-black text-white h-screen overflow-hidden">
    
    <!-- Header Full Width -->
    <header class="fixed top-0 left-0 w-full z-[100] p-6 px-10 border-b border-white/10 bg-gradient-to-b from-purple-900/20 via-zinc-950/80 to-zinc-950/90 backdrop-blur-2xl hidden md:flex justify-between items-center shadow-2xl overflow-hidden group/header">
        <!-- Bordas decorativas -->
        <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"></div>
        <div class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        
        <!-- Efeitos de brilho animados -->
        <div class="absolute -top-32 -right-32 w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[5000ms]"></div>
        <div class="absolute -bottom-32 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[7000ms]"></div>
        
        <!-- Lado Esquerdo: Info do Jogador -->
        <div class="relative z-10 flex items-center gap-6">
            <!-- Level -->
            <div class="flex flex-col items-center justify-center w-12 h-12 bg-zinc-900 rounded-lg border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] relative overflow-hidden group">
                <div class="absolute inset-0 bg-amber-500/10 group-hover:bg-amber-500/20 transition-all"></div>
                <span class="text-[9px] text-amber-500 uppercase tracking-widest font-bold">Lvl</span>
                <span class="text-xl font-black text-amber-100 leading-none">7</span>
            </div>
            
            <!-- Avatar -->
            <div class="w-14 h-14 rounded-full bg-zinc-900 overflow-hidden relative z-10 ring-2 ring-black border-2 border-white/10">
                <img class="w-full h-full object-cover" src="assets/img/avatar.webp" alt="Player">
            </div>
            
            <!-- Nome e Stats -->
            <div class="flex flex-col gap-0.5">
                <span class="font-black text-2xl tracking-wide text-white drop-shadow-md font-sans">WC</span>
                <div class="flex items-center gap-4 text-xs font-mono tracking-widest uppercase">
                    <div class="flex items-center gap-2 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path>
                        </svg>
                        <span class="font-bold text-xl">850</span>
                        <span class="text-[10px] opacity-70 mt-1">HP</span>
                    </div>
                    <div class="w-px h-5 bg-white/10"></div>
                    <div class="flex items-center gap-2 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
                        <span class="font-bold text-xl">320</span>
                        <span class="text-[10px] opacity-70 mt-1 uppercase">Mana</span>
                    </div>
                    <div class="w-px h-5 bg-white/10"></div>
                    <div class="flex items-center gap-2 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                        <span class="font-bold text-xl">3</span>
                        <span class="text-[10px] opacity-70 mt-1 uppercase">Turno</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Lado Direito: Ações -->
        <div class="relative z-10 flex gap-4">
            <div class="flex items-center bg-white/5 rounded-xl p-1.5 border border-white/5 backdrop-blur-sm gap-2">
                <!-- Bestiário -->
                <button onclick="openCombatModal()" class="p-2.5 rounded-lg hover:bg-white/10 transition-all hover:scale-105 active:scale-95 group relative" title="Combate">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-swords text-red-400 group-hover:text-red-300">
                        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline>
                        <line x1="13" x2="19" y1="19" y2="13"></line>
                        <line x1="16" x2="20" y1="16" y2="20"></line>
                        <line x1="19" x2="21" y1="21" y2="19"></line>
                        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"></polyline>
                        <line x1="5" x2="9" y1="14" y2="18"></line>
                        <line x1="7" x2="4" y1="17" y2="20"></line>
                        <line x1="3" x2="5" y1="19" y2="21"></line>
                    </svg>
                </button>
                <div class="w-px h-6 bg-white/10 mx-1"></div>
                
                <!-- Som -->
                <div class="flex items-center gap-1 group/music relative">
                    <button class="p-2 rounded-lg hover:bg-white/10 transition-all hover:scale-105 active:scale-95" title="Parar Música">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume2 text-emerald-400">
                            <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path>
                            <path d="M16 9a5 5 0 0 1 0 6"></path>
                            <path d="M19.364 18.364a9 9 0 0 0 0-12.728"></path>
                        </svg>
                    </button>
                    <div class="w-0 group-hover/music:w-24 opacity-0 group-hover/music:opacity-100 overflow-hidden transition-all duration-500 ease-out flex items-center">
                        <input min="0" max="1" step="0.05" class="w-20 mx-2" type="range" value="0.3">
                    </div>
                </div>
            </div>
            
            <div class="w-px h-10 bg-white/5 mx-1 self-center"></div>
            
            <!-- Mochila, Inventário, Mapa -->
            <div class="flex items-center bg-white/5 rounded-xl p-1.5 border border-white/5 backdrop-blur-sm">
                <button class="p-2.5 rounded-lg hover:bg-white/10 hover:text-cyan-400 transition-all hover:scale-105 active:scale-95" title="Mochila">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path>
                        <path d="M8 10h8"></path>
                        <path d="M8 18h8"></path>
                        <path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"></path>
                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
                <button class="p-2.5 rounded-lg hover:bg-white/10 hover:text-purple-400 transition-all hover:scale-105 active:scale-95" title="Inventário">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 7h-3a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"></path>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        <rect x="1" y="7" width="9" height="14"></rect>
                    </svg>
                </button>
                <button class="p-2.5 rounded-lg hover:bg-white/10 hover:text-amber-400 transition-all hover:scale-105 active:scale-95" title="Mapa">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"></path>
                        <path d="M15 5.764v15"></path>
                        <path d="M9 3.236v15"></path>
                    </svg>
                </button>
            </div>
            
            <!-- Exit -->
            <button class="ml-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 hover:border-red-500/50 transition-all" title="Desistir">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                </svg>
            </button>
        </div>
    </header>
    
    <!-- Conteúdo Principal -->
    <div class="hidden md:flex flex-col h-screen pt-[88px] pb-[280px]">
        <div class="flex-1 flex min-h-0 overflow-hidden">
            <!-- Coluna Esquerda: Narrativa -->
            <div class="flex-1 overflow-y-auto pl-10 pr-20 py-10 custom-scrollbar border-r border-white/5 relative bg-[#0a0a0a]">
                <div class="leading-relaxed font-serif text-lg md:text-2xl text-slate-300 typewriter-text relative">
                    
                    <!-- Parágrafo 1 -->
                    <div class="mb-6">
                        Você está na entrada da taverna de Stormhaven, o sol se põe no horizonte pintando o céu de laranja e roxo. O ar está fresco e você pode ouvir os sons distantes da cidade se preparando para a noite. A taverna em frente parece acolhedora, com luzes quentes vazando pelas janelas.
                    </div>
                    
                    <!-- Parágrafo 2 -->
                    <div class="mb-6">
                        Um grupo de aventureiros está sentado em uma mesa próxima, discutindo algo em voz baixa. Eles parecem nervosos, e você nota que um deles está segurando um pergaminho com força. Na porta da taverna, o dono, um homem robusto com um avental, observa a rua com atenção.
                    </div>
                    
                    <!-- Parágrafo 3 -->
                    <div class="mb-6">
                        Você sente que algo está prestes a acontecer. A escolha é sua: entrar na taverna e descobrir o que está acontecendo, ou continuar observando de fora para reunir mais informações antes de tomar uma decisão.
                    </div>
                    
                </div>
                <div class="h-20"></div>
            </div>
            
            <!-- Coluna Direita: Imagem da Cena -->
            <div class="w-[45%] relative bg-black flex-none overflow-hidden">
                <img class="w-full h-full object-cover transition-opacity duration-1000" alt="Scene" src="assets/img/tavern-1.webp" style="width: 100%; height: 100%; object-fit: cover;">
                <div class="absolute inset-0 z-20 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            </div>
        </div>
    </div>
    
    <!-- Footer: Escolhas (Fixo) -->
    <footer class="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-white/10 p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-20">
        <div class="flex justify-center mb-6">
            <span class="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] bg-zinc-950/80 px-8 py-2 rounded-full border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]">SUA VEZ - ESCOLHA UM CAMINHO</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1600px] mx-auto">
            
            <!-- Opção 1: Carisma -->
            <button onclick="openDiceModal('CARISMA', 8, 10, 'Provável', 'Entrar na taverna e abordar o grupo de aventureiros com confiança, usando sua presença carismática para obter informações.')" class="choice-btn relative group w-full text-left rounded-2xl bg-zinc-900 border border-white/5 p-5 hover:bg-zinc-800 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] transition-all duration-300 overflow-hidden backdrop-blur-md">
                <div class="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div class="relative z-10 flex items-center justify-between gap-4 h-full">
                    <div class="flex flex-col gap-2 flex-1">
                        <div class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-purple-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path>
                                <path d="M5 21h14"></path>
                            </svg>
                            <span>CARISMA 8</span>
                        </div>
                        <div class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gradient-to-r text-blue-400 border-blue-500/30 from-blue-500/20 to-transparent text-white w-fit shadow-lg shadow-black/20">Provável (DIFICULDADE 10)</div>
                        <span class="text-sm font-semibold text-slate-300 group-hover:text-white leading-tight mt-1 line-clamp-3">Entrar na taverna e abordar o grupo de aventureiros com confiança, usando sua presença carismática para obter informações.</span>
                    </div>
                    <div class="p-3 rounded-full bg-white/5 border border-white/5 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400 transition-all duration-300 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m9 18 6-6-6-6"></path>
                        </svg>
                    </div>
                </div>
            </button>
            
            <!-- Opção 2: Percepção -->
            <button onclick="openDiceModal('PERCEPÇÃO', 7, 12, 'Provável', 'Observar atentamente a cena de fora, tentando ler os lábios e captar detalhes importantes antes de agir.')" class="choice-btn relative group w-full text-left rounded-2xl bg-zinc-900 border border-white/5 p-5 hover:bg-zinc-800 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] transition-all duration-300 overflow-hidden backdrop-blur-md">
                <div class="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div class="relative z-10 flex items-center justify-between gap-4 h-full">
                    <div class="flex flex-col gap-2 flex-1">
                        <div class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>PERCEPÇÃO 7</span>
                        </div>
                        <div class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gradient-to-r text-blue-400 border-blue-500/30 from-blue-500/20 to-transparent text-white w-fit shadow-lg shadow-black/20">Provável (DIFICULDADE 12)</div>
                        <span class="text-sm font-semibold text-slate-300 group-hover:text-white leading-tight mt-1 line-clamp-3">Observar atentamente a cena de fora, tentando ler os lábios e captar detalhes importantes antes de agir.</span>
                    </div>
                    <div class="p-3 rounded-full bg-white/5 border border-white/5 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400 transition-all duration-300 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m9 18 6-6-6-6"></path>
                        </svg>
                    </div>
                </div>
            </button>
            
            <!-- Opção 3: Inteligência -->
            <button onclick="openDiceModal('INTELIGÊNCIA', 7, 8, 'Provável', 'Analisar a situação e buscar uma entrada alternativa ou uma maneira estratégica de obter informações sem se expor.')" class="choice-btn relative group w-full text-left rounded-2xl bg-zinc-900 border border-white/5 p-5 hover:bg-zinc-800 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] transition-all duration-300 overflow-hidden backdrop-blur-md">
                <div class="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div class="relative z-10 flex items-center justify-between gap-4 h-full">
                    <div class="flex flex-col gap-2 flex-1">
                        <div class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 18V5"></path>
                                <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"></path>
                                <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"></path>
                                <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"></path>
                                <path d="M18 18a4 4 0 0 0 2-7.464"></path>
                                <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"></path>
                                <path d="M6 18a4 4 0 0 1-2-7.464"></path>
                                <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"></path>
                            </svg>
                            <span>INTELIGÊNCIA 7</span>
                        </div>
                        <div class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gradient-to-r text-blue-400 border-blue-500/30 from-blue-500/20 to-transparent text-white w-fit shadow-lg shadow-black/20">Provável (DIFICULDADE 8)</div>
                        <span class="text-sm font-semibold text-slate-300 group-hover:text-white leading-tight mt-1 line-clamp-3">Analisar a situação e buscar uma entrada alternativa ou uma maneira estratégica de obter informações sem se expor.</span>
                    </div>
                    <div class="p-3 rounded-full bg-white/5 border border-white/5 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400 transition-all duration-300 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m9 18 6-6-6-6"></path>
                        </svg>
                    </div>
                </div>
            </button>
            
            <!-- Opção 4: Força -->
            <button onclick="openDiceModal('FORÇA', 6, 15, 'Arriscado', 'Entrar com determinação, usando sua presença física para intimidar e obter respeito imediato dos presentes.')" class="choice-btn relative group w-full text-left rounded-2xl bg-zinc-900 border border-white/5 p-5 hover:bg-zinc-800 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] transition-all duration-300 overflow-hidden backdrop-blur-md">
                <div class="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div class="relative z-10 flex items-center justify-between gap-4 h-full">
                    <div class="flex flex-col gap-2 flex-1">
                        <div class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m11 19-6-6"></path>
                                <path d="m5 21-2-2"></path>
                                <path d="m8 16-4 4"></path>
                                <path d="M9.5 17.5 21 6V3h-3L6.5 14.5"></path>
                            </svg>
                            <span>FORÇA 6</span>
                        </div>
                        <div class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gradient-to-r text-red-400 border-red-500/30 from-red-500/20 to-transparent text-white w-fit shadow-lg shadow-black/20">Arriscado (DIFICULDADE 15)</div>
                        <span class="text-sm font-semibold text-slate-300 group-hover:text-white leading-tight mt-1 line-clamp-3">Entrar com determinação, usando sua presença física para intimidar e obter respeito imediato dos presentes.</span>
                    </div>
                    <div class="p-3 rounded-full bg-white/5 border border-white/5 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400 transition-all duration-300 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m9 18 6-6-6-6"></path>
                        </svg>
                    </div>
                </div>
            </button>
            
        </div>
    </footer>
    
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
                            <span id="diceResult" class="text-6xl font-black cinzel transition-all duration-100 text-amber-500 opacity-100 scale-110">20</span>
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
                                <h2 id="attributeName" class="text-3xl font-black tracking-widest uppercase cinzel text-emerald-400 drop-shadow-lg">Percepção</h2>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="text-slate-500 text-[10px] font-bold tracking-widest uppercase">ATRIBUTO BASE:</span>
                                    <div class="flex items-center gap-1.5 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded shadow-inner">
                                        <span id="attributeBase" class="text-slate-200 font-mono font-bold text-sm tracking-tighter">7</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="relative overflow-hidden rounded-xl bg-black/60 border border-emerald-500/30 p-4 flex items-center justify-between shadow-inner">
                        <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        <div class="flex flex-col">
                            <span class="text-slate-500 text-[9px] font-black tracking-[0.2em] uppercase mb-0.5">Dificuldade do Teste</span>
                            <span id="difficulty" class="text-white font-black text-xl tracking-wider font-mono uppercase">DIFICULDADE 12</span>
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
                        <p id="userChoice" class="font-serif text-slate-300 italic text-lg md:text-xl leading-relaxed drop-shadow-md">"Aventurar-se na trilha menos óbvia na floresta, em busca de segredos e descobertas."</p>
                    </div>
                </div>
                <div class="mt-4 flex flex-col gap-3">
                    <div class="flex items-center gap-3">
                        <button onclick="rollDice()" class="flex-1 group relative overflow-hidden py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-500/30 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
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
                        <button onclick="closeDiceModal()" class="px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-xl border border-white/5 transition-all text-xs font-black tracking-widest uppercase">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Ícones dos atributos
        const attributeIcons = {
            'CARISMA': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg>`,
            'PERCEPÇÃO': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
            'INTELIGÊNCIA': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18V5"></path><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"></path><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"></path><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"></path><path d="M18 18a4 4 0 0 0 2-7.464"></path><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"></path><path d="M6 18a4 4 0 0 1-2-7.464"></path><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"></path></svg>`,
            'FORÇA': `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 19-6-6"></path><path d="m5 21-2-2"></path><path d="m8 16-4 4"></path><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"></path></svg>`
        };
        
        const attributeColorClasses = {
            'CARISMA': { icon: 'bg-purple-400/10 border-purple-400/30', text: 'text-purple-400', iconText: 'text-purple-400' },
            'PERCEPÇÃO': { icon: 'bg-emerald-400/10 border-emerald-400/30', text: 'text-emerald-400', iconText: 'text-emerald-400' },
            'INTELIGÊNCIA': { icon: 'bg-blue-400/10 border-blue-400/30', text: 'text-blue-400', iconText: 'text-blue-400' },
            'FORÇA': { icon: 'bg-red-500/10 border-red-500/30', text: 'text-red-500', iconText: 'text-red-500' }
        };
        
        function openDiceModal(attribute, base, difficulty, risk, choice) {
            const modal = document.getElementById('diceModal');
            const colors = attributeColorClasses[attribute];
            
            document.getElementById('attributeName').textContent = attribute;
            document.getElementById('attributeBase').textContent = base;
            document.getElementById('difficulty').textContent = `DIFICULDADE ${difficulty}`;
            document.getElementById('risk').textContent = risk.toUpperCase();
            document.getElementById('userChoice').textContent = `"${choice}"`;
            
            const iconEl = document.getElementById('attributeIcon');
            iconEl.innerHTML = attributeIcons[attribute];
            iconEl.className = `p-4 rounded-2xl border shadow-lg ${colors.icon} ${colors.iconText} transform -rotate-3`;
            
            document.getElementById('attributeName').className = `text-3xl font-black tracking-widest uppercase cinzel ${colors.text} drop-shadow-lg`;
            modal.classList.remove('hidden');
        }
        
        function closeDiceModal() {
            document.getElementById('diceModal').classList.add('hidden');
        }
        
        function rollDice() {
            // Simular rolagem de dados
            const result = Math.floor(Math.random() * 20) + 1;
            const diceElement = document.getElementById('diceResult');
            diceElement.textContent = result;
            diceElement.parentElement.style.animation = 'none';
            setTimeout(() => {
                diceElement.parentElement.style.animation = 'pulse-glow 2s ease-in-out infinite';
            }, 10);
        }
        
        // Fechar modal ao clicar fora
        document.getElementById('diceModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeDiceModal();
            }
        });
    </script>
    
    <?php include 'modal-worldmap.php'; ?>
    <?php include 'modal-character.php'; ?>
    <?php include 'modal-combat.php'; ?>
    
</body>
</html>

