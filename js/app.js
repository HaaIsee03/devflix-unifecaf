/* ==========================================================================
   1. CONFIGURAÇÃO (Sincronizada com seu HTML)
   ========================================================================== */
const config = {
    logos: { 
        "Netflix": "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg", 
        "Max": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Max_logo.svg", 
        "Disney+": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg", 
        "Prime Video": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png" 
    },
    series: {
        rick: { titulo: "Rick and Morty", context: "Rick_and_Morty", fandom: "rickandmorty", nota: "⭐ 9.2/10", streaming: ["Max", "Netflix"], imagem: "https://m.media-amazon.com/images/M/MV5BZjRjOTFkOTktZWUzMi00YzMyLThkMmYtMjEwNmQyNzliYTNmXkEyXkFqcGdeQXVyNzQ1ODk3MTQ@._V1_.jpg", desc: "Aventuras baseadas na Wikipedia Global." },
        pokemon: { titulo: "Pokémon", context: "Pokémon", fandom: "pokemon", nota: "⭐ 7.6/10", streaming: ["Netflix", "Prime Video"], imagem: "https://br.web.img3.acsta.net/pictures/19/05/07/16/23/0488273.jpg", desc: "Dados da PokéAPI e Wikipedia." },
        simpsons: { titulo: "The Simpsons", context: "The_Simpsons", fandom: "simpsons", nota: "⭐ 8.7/10", streaming: ["Disney+"], imagem: "https://upload.wikimedia.org/wikipedia/en/c/ca/The_Simpsons_cast_2011.png", desc: "Enciclopédia de Springfield." }
    }
};

let currentWikiSuffix = ""; 

/* ==========================================================================
   2. MOTOR DE TRADUÇÃO (MyMemory API - FIX: LIMITE 500 CHARS)
   ========================================================================== */
async function traduzirTexto(texto) {
    if (!texto) return "Biografia não disponível.";
    try {
        // Limpeza e corte estrito para evitar 'QUERY LENGTH LIMIT EXCEEDED'
        const limpo = texto.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        const textoSeguro = limpo.substring(0, 450); // Limite de segurança para API gratuita

        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoSeguro)}&langpair=en|pt`);
        const data = await res.json();
        return data.responseData.translatedText || textoSeguro;
    } catch (e) { 
        return texto.substring(0, 450); 
    }
}

/* ==========================================================================
   3. NAVEGAÇÃO E LISTAGEM
   ========================================================================== */
function abrirSerie(id) {
    const info = config.series[id];
    currentWikiSuffix = info.context;
    
    document.getElementById('tela-home').classList.add('hidden');
    document.getElementById('tela-detalhes').classList.remove('hidden');
    document.getElementById('titulo-serie').textContent = info.titulo;
    document.getElementById('desc-serie').textContent = info.desc;
    document.getElementById('nota-serie').textContent = info.nota;
    document.getElementById('img-capa').src = info.imagem;
    document.getElementById('logos-streaming').innerHTML = info.streaming.map(s => `<img src="${config.logos[s]}" class="stream-logo">`).join('');
    
    carregarAPI(id);
}

async function carregarAPI(id) {
    const grid = document.getElementById('grid-personagens');
    grid.innerHTML = '';
    document.getElementById('loading').classList.remove('hidden');
    try {
        if (id === 'rick') {
            const res = await fetch('https://rickandmortyapi.com/api/character');
            const data = await res.json();
            data.results.slice(0, 15).forEach(p => criarCard(p.name, p.image, p.status));
        } else if (id === 'pokemon') {
            const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=15');
            const data = await res.json();
            const pets = await Promise.all(data.results.map(p => fetch(p.url).then(r => r.json())));
            pets.forEach(p => criarCard(p.name.toUpperCase(), p.sprites.other['official-artwork'].front_default, `ID: ${p.id}`, p.id));
        } else if (id === 'simpsons') {
            const res = await fetch('https://thesimpsonsquoteapi.glitch.me/quotes?count=15');
            const data = await res.json();
            data.forEach(p => criarCard(p.character, p.image, "Springfield"));
        }
    } catch (e) { console.error(e); }
    document.getElementById('loading').classList.add('hidden');
}

function criarCard(nome, img, status, pokeId = null) {
    const card = document.createElement('div');
    card.className = 'card-person';
    card.onclick = () => abrirBio(nome, pokeId);
    card.innerHTML = `<img src="${img}" alt="${nome}"><h4>${nome}</h4><p>${status}</p>`;
    document.getElementById('grid-personagens').appendChild(card);
}

/* ==========================================================================
   4. LÓGICA DE BIO (Wikipedia Rest API - FIX: 404 URLs)
   ========================================================================== */
async function abrirBio(nome, pokeId) {
    const sidebar = document.querySelector('.sidebar-content');
    sidebar.innerHTML = `<h2>${nome}</h2><hr><p id="bio-txt">Sincronizando enciclopédia global (EN)...</p>`;
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('overlay').classList.remove('hidden');

    try {
        let originalText = "";

        if (currentWikiSuffix === 'Pokémon' && pokeId) {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokeId}`);
            const data = await res.json();
            originalText = data.flavor_text_entries.find(e => e.language.name === 'en').flavor_text.replace(/\f/g, ' ');
        } 
        else {
            // Tenta nomes limpos primeiro para evitar o erro 404 da image_18ba8b
            const formatado = nome.replace(/\s+/g, '_');
            const termos = [formatado, `${formatado}_(${currentWikiSuffix})`];

            for (let termo of termos) {
                const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termo)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.type !== 'disambiguation') {
                        originalText = data.extract;
                        break;
                    }
                }
            }
        }

        if (originalText) {
            const traducao = await traduzirTexto(originalText);
            document.getElementById('bio-txt').innerHTML = `
                <div style="font-size: 0.95rem; line-height: 1.6;">
                    <em style="color:var(--primary)">(Tradução Automática via Wikipedia Global)</em><br><br>
                    ${traducao}
                </div>`;
        } else {
            document.getElementById('bio-txt').textContent = "Biografia não encontrada na base de dados.";
        }
    } catch (e) { 
        document.getElementById('bio-txt').textContent = "Erro de conexão."; 
    }
}

function filtrarPersonagens() {
    const termo = document.getElementById('input-busca').value.toLowerCase();
    document.querySelectorAll('.card-person').forEach(c => {
        c.style.display = c.querySelector('h4').textContent.toLowerCase().includes(termo) ? "block" : "none";
    });
}
function fecharSidebar() { document.getElementById('sidebar').classList.remove('active'); document.getElementById('overlay').classList.add('hidden'); }
function voltarHome() { document.getElementById('tela-detalhes').classList.add('hidden'); document.getElementById('tela-home').classList.remove('hidden'); }