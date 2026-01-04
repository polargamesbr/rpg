/**
 * AudioManager - Sistema de Áudio de Combate com Fallback
 * 
 * Gerencia reprodução de áudio com fallback automático em camadas:
 * 1. Skill específica → 2. Classe/Arma → 3. Tipo de entidade → 4. Som global
 */

class AudioManager {
    constructor(registry) {
        this.registry = registry || window.audioRegistry || {};
        this.volume = 1.0;
        this.muted = false;
        this.audioPool = new Map(); // Pool de instâncias de Audio por arquivo
        this.maxPoolSize = 3; // Máximo de instâncias por arquivo para evitar sobreposição excessiva
    }

    /**
     * Resolve qual arquivo de áudio tocar com base no evento e contexto
     * @param {string} event - Nome do evento (ex: 'hit', 'skill_start')
     * @param {Object} context - Contexto com skill, hero, attacker, target, etc.
     * @returns {string|null} Caminho do arquivo de áudio ou null se não encontrado
     */
    resolve(event, context = {}) {
        const { skill, hero, attacker, target, damageType } = context;

        // 1. Tentar skill específica
        if (skill?.id && this.registry.skill?.[skill.id]?.[event]) {
            const files = this.registry.skill[skill.id][event];
            if (files && files.length > 0) {
                return this.randomizeFile(files);
            }
        }

        // 2. Tentar classe do atacante (hero ou attacker)
        // NOTA: Para eventos de hit/attack_prepare, priorizamos arma sobre classe
        // Classe só é usada para skill_start e outros eventos específicos
        const entity = hero || attacker;
        const shouldPrioritizeWeapon = ['hit', 'attack_prepare'].includes(event);

        if (entity && !shouldPrioritizeWeapon) {
            const classKey = this.getEntityClassKey(entity);
            if (classKey && this.registry.class?.[classKey]?.[event]) {
                const files = this.registry.class[classKey][event];
                if (files && files.length > 0) {
                    return this.randomizeFile(files);
                }
            }
        }

        // 3. Tentar arma baseada na classe (prioridade para hit/attack_prepare)
        if (entity) {
            const weaponType = this.getWeaponType(entity);
            if (weaponType && this.registry.weapon?.[weaponType]?.[event]) {
                const files = this.registry.weapon[weaponType][event];
                if (files && files.length > 0) {
                    return this.randomizeFile(files);
                }
            }
        }

        // 3b. Se não encontrou na arma e é hit/attack_prepare, tentar classe
        if (entity && shouldPrioritizeWeapon) {
            const classKey = this.getEntityClassKey(entity);
            if (classKey && this.registry.class?.[classKey]?.[event]) {
                const files = this.registry.class[classKey][event];
                if (files && files.length > 0) {
                    return this.randomizeFile(files);
                }
            }
        }

        // 4. Tentar tipo de entidade (monster ou class)
        const targetEntity = target || entity;
        if (targetEntity) {
            const entityType = targetEntity.type || (targetEntity.isPlayer ? 'class' : 'monster');
            if (this.registry.entity?.[entityType]?.[event]) {
                const files = this.registry.entity[entityType][event];
                if (files && files.length > 0) {
                    return this.randomizeFile(files);
                }
            }
        }

        // 5. Fallback para som global
        if (this.registry.global?.[event]) {
            const files = this.registry.global[event];
            if (files && files.length > 0) {
                return this.randomizeFile(files);
            }
        }

        return null;
    }

    /**
     * Toca um som baseado no evento e contexto
     * @param {string} event - Nome do evento
     * @param {Object} context - Contexto com skill, hero, attacker, target, etc.
     * @returns {Promise<void>}
     */
    async play(event, context = {}) {
        if (this.muted || (window.combatSystem && window.combatSystem.skipUI())) return;

        let filePath = this.resolve(event, context);
        if (!filePath) {
            // Silenciosamente falha se não encontrar som (não quebra o jogo)
            return;
        }

        // Normalize path - ensure it's absolute from root
        if (filePath.startsWith('/public/')) {
            // Path is already correct
        } else if (filePath.startsWith('/')) {
            // Absolute path but not /public/ - prepend /public if it's assets
            if (filePath.startsWith('/assets/')) {
                filePath = '/public' + filePath;
            }
        } else if (filePath.startsWith('assets/')) {
            // Relative path - make it absolute
            filePath = '/public/' + filePath;
        }

        try {
            const audio = this.getAudioInstance(filePath);
            if (audio) {
                audio.volume = this.volume;
                audio.currentTime = 0; // Reset para começar do início
                await audio.play().catch(err => {
                    // Ignorar erros de autoplay (browser policy)
                    console.debug(`[AudioManager] Could not play ${filePath}:`, err.message);
                });
            }
        } catch (error) {
            console.warn(`[AudioManager] Error playing ${filePath}:`, error);
        }
    }

    /**
     * Precarrega um som
     * @param {string} event - Nome do evento
     * @param {Object} context - Contexto
     */
    preload(event, context = {}) {
        const filePath = this.resolve(event, context);
        if (filePath) {
            this.getAudioInstance(filePath, true); // Preload apenas
        }
    }

    /**
     * Obtém ou cria instância de Audio do pool
     * @param {string} filePath - Caminho do arquivo
     * @param {boolean} preloadOnly - Se true, apenas precarrega sem retornar
     * @returns {HTMLAudioElement|null}
     */
    getAudioInstance(filePath, preloadOnly = false) {
        if (!this.audioPool.has(filePath)) {
            this.audioPool.set(filePath, []);
        }

        const pool = this.audioPool.get(filePath);

        // Encontrar instância disponível (não tocando)
        const available = pool.find(audio => audio.paused || audio.ended);

        if (available) {
            if (preloadOnly) {
                available.load();
            }
            return preloadOnly ? null : available;
        }

        // Criar nova instância se pool não estiver cheio
        if (pool.length < this.maxPoolSize) {
            const audio = new Audio(filePath);
            audio.preload = 'auto';
            pool.push(audio);

            if (preloadOnly) {
                audio.load();
                return null;
            }

            return audio;
        }

        // Se pool cheio, usar a primeira instância (pode interromper som anterior)
        return pool[0] || null;
    }

    /**
     * Randomiza entre múltiplos arquivos
     * @param {string[]} files - Array de caminhos de arquivos
     * @returns {string} Caminho escolhido aleatoriamente
     */
    randomizeFile(files) {
        if (files.length === 1) return files[0];
        return files[Math.floor(Math.random() * files.length)];
    }

    /**
     * Obtém chave da classe da entidade para lookup no registry
     * @param {Object} entity - Entidade (hero ou enemy)
     * @returns {string|null}
     */
    getEntityClassKey(entity) {
        if (!entity) return null;

        // Primeiro tentar usar o nome da classe (mais confiável)
        if (entity.name) {
            const nameLower = entity.name.toLowerCase();
            // Mapear nomes para chaves do registry
            const nameMap = {
                'swordman': 'hero_swordman',
                'archer': 'hero_archer',
                'mage': 'hero_mage',
                'thief': 'hero_thief',
                'acolyte': 'hero_acolyte',
                'blacksmith': 'hero_blacksmith'
            };
            if (nameMap[nameLower]) {
                return nameMap[nameLower];
            }
            // Fallback: tentar hero_ + nome
            return `hero_${nameLower}`;
        }

        // Tentar ID da entidade (ex: hero_swordman ou hero_1)
        if (entity.id) {
            const idParts = entity.id.split('_');
            // Se for hero_1, hero_2, etc, não podemos determinar a classe pelo ID
            // Mas se for hero_archer, hero_swordman, etc, podemos usar
            if (idParts.length > 1 && idParts[1] && !/^\d+$/.test(idParts[1])) {
                return `hero_${idParts[1]}`;
            }
        }

        return null;
    }

    /**
     * Determina tipo de arma baseado na classe
     * @param {Object} entity - Entidade
     * @returns {string|null}
     */
    getWeaponType(entity) {
        if (!entity) return null;

        const classKey = this.getEntityClassKey(entity);
        if (!classKey) return null;

        const classMap = {
            'hero_swordman': 'sword',
            'hero_archer': 'bow',
            'hero_mage': 'staff',
            'hero_thief': 'dagger',
            'hero_acolyte': 'staff',
            'hero_blacksmith': 'hammer'
        };

        return classMap[classKey] || null;
    }

    /**
     * Define volume global (0.0 a 1.0)
     * @param {number} volume - Volume entre 0 e 1
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Define mute
     * @param {boolean} muted - Se true, muta todos os sons
     */
    setMuted(muted) {
        this.muted = muted;
    }

    /**
     * Limpa pool de áudio (útil para liberar memória)
     */
    clearPool() {
        this.audioPool.forEach(pool => {
            pool.forEach(audio => {
                audio.pause();
                audio.src = '';
            });
        });
        this.audioPool.clear();
    }
}

// Exportar globalmente
window.AudioManager = AudioManager;

