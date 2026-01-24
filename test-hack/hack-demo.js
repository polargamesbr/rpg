/**
 * 🔓 Script de Demonstração de Ataque
 * 
 * Este script demonstra como um atacante poderia:
 * 1. Interceptar a chave de sessão
 * 2. Capturar payloads criptografados
 * 3. Descriptografar e modificar
 * 4. Tentar re-enviar (será bloqueado pelo servidor)
 * 
 * Execute no console do navegador durante uma sessão ativa do jogo.
 */

(function() {
    'use strict';

    console.log('%c🔓 SIMULAÇÃO DE ATAQUE INICIADA', 'color: red; font-size: 16px; font-weight: bold;');
    console.log('Este script demonstra vulnerabilidades do sistema atual.\n');

    // Interceptar requisições fetch
    const originalFetch = window.fetch;
    let interceptedKey = null;
    let interceptedPayloads = [];

    window.fetch = async function(...args) {
        const url = args[0];
        const options = args[1] || {};

        // Interceptar requisição de chave
        if (url.includes('/game/explore/get-key')) {
            console.log('%c📡 Interceptando requisição de chave...', 'color: yellow;');
            
            const response = await originalFetch.apply(this, args);
            const clonedResponse = response.clone();
            
            clonedResponse.json().then(data => {
                if (data.success && data.key) {
                    interceptedKey = data.key;
                    console.log('%c✅ Chave interceptada:', 'color: green;', data.key);
                    console.log('   Token:', data.token);
                }
            });
            
            return response;
        }

        // Interceptar payloads criptografados
        if (url.includes('/game/explore/state') && options.method === 'POST') {
            const body = options.body;
            if (body && typeof body === 'string') {
                try {
                    const payload = JSON.parse(body);
                    if (payload.encrypted && payload.iv) {
                        interceptedPayloads.push({
                            url,
                            payload,
                            timestamp: new Date().toISOString()
                        });
                        console.log('%c📦 Payload criptografado capturado:', 'color: cyan;', payload);
                        
                        // Tentar descriptografar se tiver a chave
                        if (interceptedKey) {
                            tryDecrypt(payload, interceptedKey);
                        }
                    }
                } catch (e) {
                    // Não é JSON, ignorar
                }
            }
        }

        return originalFetch.apply(this, args);
    };

    // Função para descriptografar
    function tryDecrypt(encryptedPayload, key) {
        if (typeof CryptoJS === 'undefined') {
            console.log('%c❌ CryptoJS não está disponível. Carregue via CDN primeiro.', 'color: red;');
            return;
        }

        try {
            const keyWordArray = CryptoJS.enc.Hex.parse(key);
            const ivWordArray = CryptoJS.enc.Base64.parse(encryptedPayload.iv);
            const encryptedWordArray = CryptoJS.enc.Base64.parse(encryptedPayload.encrypted);

            const decrypted = CryptoJS.AES.decrypt(
                { ciphertext: encryptedWordArray },
                keyWordArray,
                {
                    iv: ivWordArray,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }
            );

            const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
            const data = JSON.parse(plaintext);

            console.log('%c🔓 PAYLOAD DESCRIPTOGRAFADO:', 'color: green; font-weight: bold;');
            console.log('Turn:', data.state?.turn);
            console.log('Phase:', data.state?.phase);
            console.log('Player HP:', data.state?.player?.hp);
            console.log('Player SP:', data.state?.player?.sp);
            console.log('Position:', `(${data.state?.player?.x}, ${data.state?.player?.y})`);
            console.log('Enemies:', data.state?.enemies?.length);
            console.log('\n📄 Dados completos:', data);

            // Simular modificação
            console.log('\n%c⚔️  SIMULANDO MODIFICAÇÃO...', 'color: orange; font-weight: bold;');
            const modified = JSON.parse(JSON.stringify(data));
            modified.state.player.hp = 99999;
            modified.state.player.sp = 99999;
            console.log('Novo HP:', modified.state.player.hp);
            console.log('Novo SP:', modified.state.player.sp);
            console.log('\n⚠️  Se tentar enviar isso, o servidor vai REJEITAR!');
            console.log('O CombatValidator detecta valores inválidos.');

        } catch (err) {
            console.log('%c❌ Erro ao descriptografar:', 'color: red;', err.message);
        }
    }

    // Expor funções globais para uso manual
    window.HackDemo = {
        getInterceptedKey: () => interceptedKey,
        getInterceptedPayloads: () => interceptedPayloads,
        decrypt: (encryptedPayload, key) => {
            if (typeof CryptoJS === 'undefined') {
                console.error('CryptoJS não está disponível');
                return null;
            }
            tryDecrypt(encryptedPayload, key || interceptedKey);
        },
        clear: () => {
            interceptedKey = null;
            interceptedPayloads = [];
            console.log('Dados limpos');
        }
    };

    console.log('\n%c✅ Interceptação ativa!', 'color: green;');
    console.log('Use window.HackDemo para acessar funções:');
    console.log('  - HackDemo.getInterceptedKey()');
    console.log('  - HackDemo.getInterceptedPayloads()');
    console.log('  - HackDemo.decrypt(payload, key)');
    console.log('  - HackDemo.clear()');
    console.log('\nAguarde requisições do jogo...\n');

})();
