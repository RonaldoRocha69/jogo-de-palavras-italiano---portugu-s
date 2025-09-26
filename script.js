document.addEventListener('DOMContentLoaded', () => {
    
    // Elementos do DOM (removido o inputArquivo pois não existe mais)
    const gameContainer = document.getElementById('game-container');
    const statusContainer = document.getElementById('status-container');
    const resultadoFinalContainer = document.getElementById('resultado-final-container');
    const colunaPt = document.getElementById('coluna-portugues');
    const colunaIt = document.getElementById('coluna-italiano');
    const somSucesso = document.getElementById('som-sucesso');
    const somErro = document.getElementById('som-erro');
    const rodadaAtualEl = document.getElementById('rodada-atual');
    const errosAtuaisEl = document.getElementById('erros-atuais');
    const totalErrosFinalEl = document.getElementById('total-erros-final');
    const notaFinalEl = document.getElementById('nota-final');
    const btnJogarNovamente = document.getElementById('btn-jogar-novamente');
    const mensagemFinalEl = document.getElementById('mensagem-final');

    const imagensDeFundo = [
        'fundo0.jpg', 'fundo1.jpg', 'fundo2.jpg', 'fundo3.jpg', 'fundo4.jpg',
        'fundo5.jpg', 'fundo6.jpg', 'fundo7.jpg', 'fundo8.jpg', 'fundo9.jpg'
    ];

    let todosOsParesMaster = []; 
    let palavrasDoJogo = []; 
    let palavraSelecionadaPt = null;
    let palavraSelecionadaIt = null;
    let paresRestantes = 0;
    let aguardandoVerificacao = false;

    const TOTAL_RODADAS = 10; 
    let rodadaAtual = 0; 
    let totalErros = 0;

    // --- NOVA LÓGICA DE CARREGAMENTO AUTOMÁTICO ---
    // Esta função busca o arquivo CSV do servidor assim que a página carrega.
    function carregarPalavrasAutomaticamente() {
        fetch('palavras.csv') // Busca o arquivo 'palavras.csv' que está junto com o index.html
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro de rede ao buscar palavras.csv');
                }
                return response.text(); // Converte a resposta em texto
            })
            .then(texto => { // Quando o texto estiver pronto...
                const separador = texto.includes(';') ? ';' : ',';
                todosOsParesMaster = texto.split('\n').filter(row => row.trim() !== '').map(linha => {
                    const colunas = linha.split(separador);
                    if (colunas.length >= 2) return { pt: colunas[0].trim(), it: colunas[1].trim() };
                    return null;
                }).filter(par => par !== null);

                if (todosOsParesMaster.length < 100) {
                    alert(`Erro! O arquivo palavras.csv precisa ter pelo menos 100 pares de palavras. Encontrados: ${todosOsParesMaster.length}.`);
                    return;
                }
                
                prepararEIniciarJogo(); // Inicia o jogo!
            })
            .catch(error => {
                console.error('Erro ao carregar o arquivo de palavras:', error);
                alert('Não foi possível carregar o arquivo de palavras. Verifique se o arquivo "palavras.csv" está na pasta do projeto e tente novamente.');
            });
    }

    // Chama a nova função para iniciar o processo.
    carregarPalavrasAutomaticamente();
    
    // --- O RESTO DO CÓDIGO PERMANECE O MESMO ---

    function prepararEIniciarJogo() {
        rodadaAtual = 0;
        totalErros = 0;
        
        embaralhar(todosOsParesMaster);
        palavrasDoJogo = todosOsParesMaster.slice(0, 100);

        resultadoFinalContainer.style.display = 'none';
        gameContainer.style.display = 'flex';
        statusContainer.style.display = 'flex';
        
        iniciarRodada();
    }
    
    btnJogarNovamente.addEventListener('click', prepararEIniciarJogo);

    function iniciarRodada() {
        const indiceImagem = rodadaAtual % imagensDeFundo.length; 
        const imagemDaVez = imagensDeFundo[indiceImagem];
        
        document.body.style.backgroundImage = `linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url('${imagemDaVez}')`;

        colunaPt.innerHTML = '<h2>Português</h2>';
        colunaIt.innerHTML = '<h2>Italiano</h2>';
        atualizarStatus();

        const inicioSlice = rodadaAtual * 10;
        const fimSlice = inicioSlice + 10;
        const paresDaRodada = palavrasDoJogo.slice(inicioSlice, fimSlice);
        paresRestantes = paresDaRodada.length;

        const palavrasPt = paresDaRodada.map(par => par.pt);
        const palavrasIt = paresDaRodada.map(par => par.it);
        
        embaralhar(palavrasPt);
        embaralhar(palavrasIt);

        palavrasPt.forEach(palavra => criarElementoPalavra(palavra, 'pt', colunaPt));
        palavrasIt.forEach(palavra => criarElementoPalavra(palavra, 'it', colunaIt));
    }

    function verificarPar() {
        aguardandoVerificacao = true;
        const idPt = palavraSelecionadaPt.dataset.parId;
        const idIt = palavraSelecionadaIt.dataset.parId;
        const tempPt = palavraSelecionadaPt;
        const tempIt = palavraSelecionadaIt;

        if (idPt && idIt && idPt === idIt) { 
            somSucesso.play();
            tempPt.classList.add('correto');
            tempIt.classList.add('correto');
            setTimeout(() => {
                tempPt.classList.add('desaparecer');
                tempIt.classList.add('desaparecer');
                paresRestantes--;
                verificarFimDaRodada();
                aguardandoVerificacao = false;
            }, 800);
        } else { 
            totalErros++;
            atualizarStatus();
            somErro.play();
            tempPt.classList.add('incorreto');
            tempIt.classList.add('incorreto');
            setTimeout(() => {
                tempPt.classList.remove('incorreto', 'selecionada');
                tempIt.classList.remove('incorreto', 'selecionada');
                aguardandoVerificacao = false;
            }, 1000);
        }
        palavraSelecionadaPt = null;
        palavraSelecionadaIt = null;
    }

    function verificarFimDaRodada() {
        if (rodadaAtual < TOTAL_RODADAS) {
            setTimeout(iniciarRodada, 2000);
        } else {
            exibirResultadoFinal();
        }
    }

    function exibirResultadoFinal() {
        gameContainer.style.display = 'none';
        statusContainer.style.display = 'none';
        resultadoFinalContainer.style.display = 'block';

        const nota = parseFloat(Math.max(0, 10 - (totalErros / 10)).toFixed(1));
        totalErrosFinalEl.textContent = totalErros;
        notaFinalEl.textContent = nota.toFixed(1);

        let mensagem = '';
        if (nota >= 9) {
            mensagem = "Terrone ou Polentone?";
        } else if (nota >= 7) {
            mensagem = "Quase um Italiano!";
        } else if (nota >= 4) {
            mensagem = "Não desista!";
        } else {
            mensagem = "Você pode melhorar!";
        }
        mensagemFinalEl.textContent = mensagem;

        if (nota >= 8.0) notaFinalEl.style.color = '#28a745';
        else if (nota >= 5.0) notaFinalEl.style.color = '#ffc107';
        else notaFinalEl.style.color = '#dc3545';
    }

    function atualizarStatus() {
        rodadaAtualEl.textContent = rodadaAtual + 1;
        errosAtuaisEl.textContent = totalErros;
    }

    function criarElementoPalavra(texto, idioma, coluna) {
        const divPalavra = document.createElement('div');
        divPalavra.className = 'palavra';
        divPalavra.textContent = texto;
        divPalavra.dataset.idioma = idioma;
        const parCorrespondente = palavrasDoJogo.find(p => p.pt === texto || p.it === texto);
        if (parCorrespondente) divPalavra.dataset.parId = parCorrespondente.pt;
        divPalavra.addEventListener('click', selecionarPalavra);
        coluna.appendChild(divPalavra);
    }

    function selecionarPalavra(event) {
        const palavraClicada = event.target;
        if (aguardandoVerificacao || palavraClicada.classList.contains('desaparecer')) return;

        if (palavraClicada.dataset.idioma === 'pt') {
            if (palavraSelecionadaPt) palavraSelecionadaPt.classList.remove('selecionada');
            palavraSelecionadaPt = palavraClicada;
        } else {
            if (palavraSelecionadaIt) palavraSelecionadaIt.classList.remove('selecionada');
            palavraSelecionadaIt = palavraClicada;
        }
        palavraClicada.classList.add('selecionada');
        if (palavraSelecionadaPt && palavraSelecionadaIt) verificarPar();
    }

    function embaralhar(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
});