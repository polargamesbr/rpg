<!-- Quest Preview Modal -->
<div id="quest-preview-modal" class="fixed inset-0 z-[100] hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity opacity-0" id="quest-preview-backdrop"></div>

    <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div class="relative transform overflow-hidden rounded-2xl bg-[#0a0a0a] border border-amber-900/30 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" id="quest-preview-panel">
                <button type="button" class="absolute top-4 right-4 z-20 text-white/50 hover:text-white transition-colors" onclick="closeQuestModal()">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>

                <div class="relative h-64 w-full overflow-hidden">
                    <img id="quest-preview-image" src="" alt="Quest Image" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent"></div>

                    <div class="absolute top-6 left-6">
                        <span id="quest-preview-type" class="px-3 py-1 rounded-full bg-black/60 backdrop-blur border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
                            Quest
                        </span>
                    </div>

                    <div class="absolute bottom-6 left-6 right-6">
                        <div class="flex items-end justify-between">
                            <div>
                                <h2 id="quest-preview-title" class="text-3xl font-bold text-white font-display mb-2 drop-shadow-lg">
                                    Quest Title
                                </h2>
                                <div class="flex items-center gap-3">
                                    <div class="flex items-center gap-1" id="quest-preview-stars"></div>
                                    <span class="w-1 h-1 rounded-full bg-white/30"></span>
                                    <span id="quest-preview-difficulty" class="text-sm font-medium text-amber-400">Difficulty</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-8">
                    <div class="mb-8">
                        <h3 class="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">Mission Briefing</h3>
                        <p id="quest-preview-desc" class="text-lg text-stone-300 leading-relaxed font-serif italic"></p>
                    </div>

                    <div class="grid grid-cols-2 gap-6 mb-8">
                        <div class="bg-white/5 rounded-xl p-4 border border-white/5">
                            <h4 class="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Rewards</h4>
                            <div class="space-y-3" id="quest-preview-rewards"></div>
                        </div>

                        <div class="bg-white/5 rounded-xl p-4 border border-white/5">
                            <h4 class="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Requirements</h4>
                            <div class="space-y-2">
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-stone-400">Class</span>
                                    <span class="text-white font-medium">Any</span>
                                </div>
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-stone-400">Min Level</span>
                                    <span class="text-white font-medium">1</span>
                                </div>
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-stone-400">Est. Time</span>
                                    <span id="quest-preview-time" class="text-white font-medium">~15 min</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 pt-6 border-t border-white/10">
                        <button type="button" onclick="closeQuestModal()" class="flex-1 py-3.5 px-4 rounded-xl border border-white/10 text-stone-400 font-bold hover:bg-white/5 hover:text-white transition-all uppercase tracking-wider text-sm">
                            Decline
                        </button>
                        <button id="quest-preview-start-btn" type="button" class="flex-[2] py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-bold shadow-lg shadow-amber-900/40 hover:shadow-amber-900/60 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 group">
                            <span>Accept Quest</span>
                            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

