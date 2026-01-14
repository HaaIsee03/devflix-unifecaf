/* ==========================================================================
   📦 CONFIGURAÇÃO DE DADOS ESTÁTICOS (UI & UX)
   ========================================================================== */

const dbSeries = {
    rick: {
        titulo: "Rick and Morty",
        desc: "As aventuras interdimensionais de um cientista louco e seu neto.",
        nota: "⭐ 9.1/10",
        cor: "#97ce4c"
    },
    pokemon: {
        titulo: "Pokémon",
        desc: "Jornada para capturar e treinar criaturas chamadas Pokémon.",
        nota: "⭐ 7.5/10",
        cor: "#ffcb05"
    },
    simpsons: {
        titulo: "The Simpsons",
        desc: "A rotina satírica de uma família de classe média em Springfield.",
        nota: "⭐ 8.7/10",
        cor: "#fed90f"
    },
    superhero: {
        titulo: "Super Hero Universe",
        desc: "Enciclopédia completa de heróis e vilões de diversos universos.",
        nota: "⭐ 8.5/10",
        cor: "#3498db"
    },
    marvel: {
        titulo: "Marvel Comics",
        desc: "O vasto universo de heróis da Marvel, dos Vingadores aos X-Men.",
        nota: "⭐ 9.5/10",
        cor: "#ed1d24"
    }
};

const container = document.getElementById('card-container');
const loading = document.getElementById('loading');

/* ==========================================================================
   🎮 CONTROLADOR PRINCIPAL
   ========================================================================== */

/**
 * Função Mestre: Orquestra a troca de abas e chamadas de API
 */
function carregarAPI(tipo) {
    const info = dbSeries[tipo];
    if (!info) return;

    // 1. Atualização Visual do Cabeçalho
    const elTitulo = document.getElementById('titulo-serie');
    elTitulo.textContent = info.titulo;
    elTitulo.style.color = info.cor;
    document.getElementById('desc-serie').textContent = info.desc;
    document.getElementById('nota-serie').textContent = info.nota;

    // 2. Limpeza e Loading
    container.innerHTML = '';
    loading.classList.remove('hidden');

    // 3. Roteamento de API (Dicionário de funções para evitar muitos if/else)
    const roteador = {
        'rick': fetchRickAndMorty,
        'pokemon': fetchPokemon,
        'simpsons': fetchSimpsons,
        'superhero': fetchSuperHero,
        'marvel': fetchMarvel
    };

    if (roteador[tipo]) roteador[tipo]();
}

/* ==========================================================================
   🌐 INTEGRAÇÃO COM AS APIs
   ========================================================================== */

async function fetchRickAndMorty() {
    try {
        const res = await fetch('https://rickandmortyapi.com/api/character');
        const data = await res.json();
        finalizarCarga();
        data.results.slice(0, 12).forEach(p => criarCard(p.name, p.image, p.status));
    } catch (e) { erroAPI(e); }
}

async function fetchPokemon() {
    try {
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=12');
        const data = await res.json();
        
        // Buscando detalhes de cada Pokémon (imagem oficial)
        const promessas = data.results.map(p => fetch(p.url).then(r => r.json()));
        const pokemons = await Promise.all(promessas);

        finalizarCarga();
        pokemons.forEach(p => {
            const img = p.sprites.other['official-artwork'].front_default;
            criarCard(p.name.toUpperCase(), img, `Tipo: ${p.types[0].type.name}`);
        });
    } catch (e) { erroAPI(e); }
}

async function fetchSimpsons() {
    try {
        const res = await fetch('https://thesimpsonsquoteapi.glitch.me/quotes?count=10');
        const data = await res.json();
        finalizarCarga();
        data.forEach(p => criarCard(p.character, p.image, "Springfield"));
    } catch (e) { erroAPI(e); }
}

async function fetchSuperHero() {
    finalizarCarga();
    avisoConfig("Super Hero", "Requer Token Privado (superheroapi.com)");
}

async function fetchMarvel() {
    finalizarCarga();
    avisoConfig("Marvel", "Requer API Key + Hash MD5 (developer.marvel.com)");
}

/* ==========================================================================
   🏗️ COMPONENTES E AUXILIARES (DOM)
   ========================================================================== */

function criarCard(nome, imgUrl, infoExtra) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
        <img src="${imgUrl}" alt="${nome}" onerror="this.src='https://via.placeholder.com/150'">
        <div class="card-content">
            <h3>${nome}</h3>
            <p>${infoExtra}</p>
        </div>
    `;
    container.appendChild(card);
}

function finalizarCarga() {
    loading.classList.add('hidden');
}

function erroAPI(e) {
    loading.innerText = "⚠️ Erro na conexão. Verifique o console.";
    console.error("Erro detalhado:", e);
}

function avisoConfig(api, motivo) {
    const div = document.createElement('div');
    div.className = 'aviso-api'; // Requer CSS para estilizar
    div.innerHTML = `
        <div style="padding: 2rem; text-align: center; background: #222; border-radius: 8px;">
            <h3>🔐 Configuração Necessária: ${api}</h3>
            <p>${motivo}</p>
            <small>Configure suas chaves no arquivo <code>script.js</code> para ativar esta aba.</small>
        </div>
    `;
    container.appendChild(div);
}

// Início automático
carregarAPI('rick');