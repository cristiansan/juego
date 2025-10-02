class MusikquizkampenGame {
    constructor() {
        this.score = 0;
        this.timeline = []; // Timeline dinámico que se construye con cartas adivinadas
        this.guessedCards = []; // Cartas ya adivinadas correctamente
        this.randomYear = this.getRandomYear(); // Año aleatorio entre 1950-2025
        this.selectedCard = null;
        this.selectedQRIndex = null;
        this.selectedDirection = null; // 'before' o 'after'
        this.gameState = 'selecting'; // selecting, choosing_direction, revealed
        this.audioWindows = {}; // Para trackear ventanas de audio abiertas
        this.timer = null; // Timer interval
        this.timeRemaining = 60; // 60 segundos (1 minuto)
        this.timerActive = false;
        this.players = []; // Array de jugadores {name: string, score: number, cardsPlayed: number}
        this.currentPlayerIndex = 0; // Índice del jugador actual
        this.playerCount = 0; // Cantidad de jugadores
        this.maxCardsPerPlayer = 5; // Máximo de cartas por jugador
        this.allCards = [
            {
                id: 1,
                year: 1978,
                artist: "Boney M",
                song: "Rasputin",
                qrImage: "images/1978.png",
                spotifyId: "5lWSa1rmuSL6OBPOnkAqoa",
                audioLink: "https://shabam.dk/link/rgcRN2"
            },
            {
                id: 2,
                year: 1945,
                artist: "Vaughn Monroe",
                song: "Let It Snow!",
                qrImage: "images/1945.png",
                spotifyId: "0JsOdLtiQ8S44BpOyKcIui",
                audioLink: "https://shabam.dk/link/hrR0v0"
            },
            {
                id: 3,
                year: 2013,
                artist: "Daft Punk",
                song: "Get Lucky",
                qrImage: "images/2013.png",
                spotifyId: "69kOkLUCkxIZYexIgSG8rq",
                audioLink: "https://shabam.dk/link/CuqvIR"
            },
            {
                id: 4,
                year: 1965,
                artist: "The Beatles",
                song: "Here Comes The Sun",
                qrImage: "images/1965.png",
                spotifyId: "6dGnYIeXmHdcikdzNNDMm2",
                audioLink: "https://shabam.dk/link/QZwOPJ"
            },
            {
                id: 5,
                year: 1995,
                artist: "TLC",
                song: "Waterfalls",
                qrImage: "images/1995.png",
                spotifyId: "2FRnf9qhLbvw8fu4IBXx78",
                audioLink: "https://shabam.dk/link/t0gRQn"
            },
            {
                id: 6,
                year: 1973,
                artist: "Marvin Gaye",
                song: "Let's Get It On",
                qrImage: "images/1973.png",
                spotifyId: "4e85pMgZ87WyHdVfgM0fOv",
                audioLink: "https://shabam.dk/link/S5nWeQ"
            },
            {
                id: 7,
                year: 1968,
                artist: "Simon & Garfunkel",
                song: "Mrs. Robinson",
                qrImage: "images/1968.png",
                spotifyId: "6TIBCzMlVzGNIXRJWNZOL4",
                audioLink: "https://shabam.dk/link/9KMTR5"
            },
            {
                id: 8,
                year: 2018,
                artist: "George Ezra",
                song: "Shotgun",
                qrImage: "images/2018.png",
                spotifyId: "3DamFFqW32WihKkTVlwTYQ",
                audioLink: "https://shabam.dk/link/14gihZ"
            }
        ];
        this.allCardsPool = [...this.allCards]; // Pool de todas las cartas disponibles
        this.cardDatabase = []; // Se inicializará por jugador
        this.currentRound = []; // Cartas para elegir esta ronda
        this.init();
    }

    getRandomCards(count, excludeCards = []) {
        // Filtrar cartas que no estén en la lista de exclusión
        let availableCards = this.allCards.filter(card =>
            !excludeCards.some(excluded => excluded.id === card.id)
        );

        // Si no hay suficientes cartas disponibles, usar todas las cartas
        if (availableCards.length < count) {
            console.log('No hay suficientes cartas únicas, usando todas las cartas disponibles');
            availableCards = [...this.allCards];
        }

        // Hacer una copia del array y mezclarlo
        const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
        // Retornar las primeras 'count' cartas
        return shuffled.slice(0, count);
    }

    getPlayerCards(playerIndex, count) {
        // Generar cartas únicas para cada jugador
        const usedCards = [];

        // Recopilar cartas ya asignadas a otros jugadores EN ESTA RONDA
        this.players.forEach((player, index) => {
            if (index !== playerIndex && player.assignedCards && player.cardsPlayed < this.maxCardsPerPlayer) {
                // Solo excluir cartas de jugadores que aún están jugando
                usedCards.push(...player.assignedCards);
            }
        });

        console.log(`Asignando ${count} cartas al jugador ${playerIndex}. Cartas en uso por otros: ${usedCards.length}`);

        // Obtener cartas aleatorias que no estén en uso (o todas si no hay suficientes)
        return this.getRandomCards(count, usedCards);
    }

    getRandomYear() {
        return Math.floor(Math.random() * (2025 - 1950 + 1)) + 1950;
    }

    init() {
        this.bindEvents();
        // No precargamos embeds aquí, se hará cuando se asignen cartas a jugadores
        this.showPlayerSelection();
    }

    showPlayerSelection() {
        const playerButtons = document.getElementById('playerButtons');
        playerButtons.innerHTML = '';

        for (let i = 1; i <= 10; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn-player-count';
            btn.textContent = i;

            // Si es modo invitado, solo permitir 1 jugador
            if (isGuestMode && i > 1) {
                btn.classList.add('disabled');
                btn.style.opacity = '0.4';
                btn.style.cursor = 'not-allowed';
                btn.onclick = () => {
                    alert('Inicia sesión con Google para jugar con más jugadores');
                };
            }
            // Si está registrado con Google, solo permitir hasta 2 jugadores
            else if (!isGuestMode && currentUser && !currentUser.isGuest && i > 2) {
                btn.classList.add('disabled');
                btn.style.opacity = '0.4';
                btn.style.cursor = 'not-allowed';
                btn.onclick = () => {
                    alert('Disponible en la versión paga. Por ahora máximo 2 jugadores.');
                };
            }
            else {
                btn.onclick = () => this.selectPlayerCount(i);
            }

            playerButtons.appendChild(btn);
        }
    }

    selectPlayerCount(count) {
        this.playerCount = count;
        document.getElementById('playerSelectionModal').style.display = 'none';

        if (count === 1) {
            this.players = [{name: 'Jugador 1', score: 0, cardsPlayed: 0, assignedCards: []}];
            this.showReadyScreen();
        } else {
            this.showPlayerNamesInput();
        }
    }

    showPlayerNamesInput() {
        const modal = document.getElementById('playerNamesModal');
        const inputs = document.getElementById('playerNamesInputs');
        inputs.innerHTML = '';

        for (let i = 0; i < this.playerCount; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'player-name-input';
            input.placeholder = `Jugador ${i + 1}`;
            input.value = `Jugador ${i + 1}`;
            input.id = `playerName${i}`;
            input.maxLength = 8;
            inputs.appendChild(input);
        }

        modal.style.display = 'flex';

        document.getElementById('btnStartGame').onclick = () => this.startMultiplayerGame();
    }

    startMultiplayerGame() {
        this.players = [];

        for (let i = 0; i < this.playerCount; i++) {
            const input = document.getElementById(`playerName${i}`);
            const name = input.value.trim() || `Jugador ${i + 1}`;
            this.players.push({name, score: 0, cardsPlayed: 0, assignedCards: []});
        }

        document.getElementById('playerNamesModal').style.display = 'none';
        this.showReadyScreen();
    }

    showReadyScreen() {
        const modal = document.getElementById('readyModal');
        const playerName = document.getElementById('readyPlayerName');

        if (this.playerCount === 1) {
            playerName.textContent = '¿Listo para jugar?';
        } else {
            playerName.textContent = `${this.players[this.currentPlayerIndex].name}, ¿listo?`;
        }

        modal.style.display = 'flex';

        document.getElementById('btnPlay').onclick = () => {
            modal.style.display = 'none';

            // Si el jugador aún no tiene cartas asignadas, asignarlas
            const player = this.players[this.currentPlayerIndex];
            if (!player.currentRound || player.currentRound.length === 0) {
                this.resetPlayerRound();
            } else {
                // Cargar el estado guardado del jugador
                this.loadPlayerState();
            }

            this.startRound();
        };
    }

    preloadSpotifyEmbeds() {
        // Precargar los iframes de Spotify en segundo plano
        this.cardDatabase.forEach(card => {
            const iframe = document.createElement('iframe');
            iframe.src = `https://open.spotify.com/embed/track/${card.spotifyId}?utm_source=generator&theme=0`;
            iframe.style.display = 'none';
            iframe.width = '100%';
            iframe.height = '152';
            iframe.frameBorder = '0';
            iframe.loading = 'eager';
            iframe.setAttribute('allow', 'autoplay; clipboard-write; fullscreen; picture-in-picture');
            document.body.appendChild(iframe);

            // Guardar referencia para uso posterior
            card.preloadedIframe = iframe;
        });
    }

    bindEvents() {
        // Solo drag & drop events, sin botones
    }

    startRound() {
        console.log('Iniciando nueva ronda. Cartas disponibles:', this.currentRound.length);

        // Actualizar UI con nombre del jugador actual
        const currentPlayerName = document.getElementById('currentPlayerName');
        if (currentPlayerName && this.players.length > 0) {
            currentPlayerName.textContent = this.players[this.currentPlayerIndex].name + ' - ';
        }

        // Actualizar puntuación
        document.getElementById('score').textContent = this.score;

        // Resetear estado del juego
        this.gameState = 'selecting';
        this.selectedCard = null;
        this.selectedQRIndex = null;
        this.selectedDirection = null;
        document.body.classList.remove('game-revealed'); // Habilitar cartas nuevamente

        // Ocultar elementos
        const selectedCardContainer = document.getElementById('selectedCardContainer');
        const gameControlsContainer = document.getElementById('gameControlsContainer');
        const resultContainer = document.getElementById('resultContainer');

        if (selectedCardContainer) {
            selectedCardContainer.style.display = 'none';
        }
        if (gameControlsContainer) {
            gameControlsContainer.style.display = 'none';
        }
        if (resultContainer) {
            resultContainer.style.display = 'none';
        }

        // Mostrar las cartas QR disponibles
        this.displayQRCards();

        // Mostrar la línea de tiempo con años (cartas adivinadas + año aleatorio)
        this.displayTimeline();

        // Iniciar el timer
        this.startTimer();

        console.log('Estado después de startRound:', this.gameState);
    }

    startTimer() {
        // Resetear timer
        this.stopTimer();
        this.timeRemaining = 60;
        this.timerActive = true;

        // Mostrar barra de tiempo
        const timerBarContainer = document.getElementById('timerBarContainer');
        const timerBar = document.getElementById('timerBar');
        if (timerBarContainer) {
            timerBarContainer.style.display = 'block';
        }
        if (timerBar) {
            timerBar.style.width = '0%';
        }

        const totalTime = 60;
        let elapsed = 0;

        // Actualizar barra cada 100ms para animación suave
        this.timer = setInterval(() => {
            elapsed += 0.1;
            const percentage = (elapsed / totalTime) * 100;

            if (timerBar) {
                timerBar.style.width = percentage + '%';
            }

            // Tiempo agotado
            if (elapsed >= totalTime) {
                this.stopTimer();
                this.handleTimeOut();
            }
        }, 100);
    }

    stopTimer(keepActive = false) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (!keepActive) {
            this.timerActive = false;

            // Ocultar barra de tiempo
            const timerBarContainer = document.getElementById('timerBarContainer');
            if (timerBarContainer) {
                timerBarContainer.style.display = 'none';
            }
        }
    }

    pauseTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    resumeTimer() {
        if (!this.timerActive) return;

        const timerBar = document.getElementById('timerBar');
        if (!timerBar) return;

        // Obtener el porcentaje actual
        const currentWidth = parseFloat(timerBar.style.width) || 0;
        const totalTime = 60;
        let elapsed = (currentWidth / 100) * totalTime;

        this.timer = setInterval(() => {
            elapsed += 0.1;
            const percentage = (elapsed / totalTime) * 100;

            if (timerBar) {
                timerBar.style.width = percentage + '%';
            }

            // Tiempo agotado
            if (elapsed >= totalTime) {
                this.stopTimer();
                this.handleTimeOut();
            }
        }, 100);
    }

    handleTimeOut() {
        console.log('⏰ Tiempo agotado!');

        // Si ya se reveló la respuesta, no hacer nada
        if (this.gameState === 'revealed') {
            return;
        }

        // Cambiar estado a revealed
        this.gameState = 'revealed';
        document.body.classList.add('game-revealed');

        // Obtener la primera carta del mazo
        const currentCard = this.currentRound[0];
        if (!currentCard) {
            console.log('No hay cartas disponibles');
            return;
        }

        this.selectedCard = currentCard;

        // Mostrar modal de incorrecto
        const resultContainer = document.getElementById('resultContainer');
        const resultContent = document.getElementById('resultContent');

        if (resultContainer && resultContent) {
            const resultCard = resultContainer.querySelector('.result-card');
            if (resultCard) {
                resultCard.classList.add('incorrect-result');
                resultCard.classList.remove('correct-result');
            }

            const buttonAction = this.playerCount > 1 ? 'game.handleIncorrectAnswer()' : 'game.nextRound()';

            resultContent.innerHTML = `
                <div class="result-indicator incorrect">¡Tiempo agotado!</div>
                <iframe src="https://open.spotify.com/embed/track/${currentCard.spotifyId}?utm_source=generator&theme=0" width="100%" height="352" frameBorder="0" allow="autoplay; clipboard-write; fullscreen; picture-in-picture" loading="lazy" style="border-radius: 12px;"></iframe>
                <div class="year-display">${currentCard.year}</div>
                <div class="song-info">
                    <div class="artist">${currentCard.artist}</div>
                    <div class="song">${currentCard.song}</div>
                </div>
                <button class="next-button" onclick="${buttonAction}">Siguiente</button>
            `;

            resultContainer.style.display = 'flex';
        }

        // Marcar la carta como incorrecta visualmente
        const selectedCardElement = document.querySelector(`[data-card-id="${currentCard.id}"]`);
        if (selectedCardElement) {
            selectedCardElement.classList.add('incorrect-answer');

            // Ocultar imagen QR (el iframe de Spotify ya muestra la portada)
            const qrImage = selectedCardElement.querySelector('img');
            if (qrImage) {
                qrImage.style.display = 'none';
            }

            const songLabel = selectedCardElement.querySelector('.song-label');
            if (songLabel) {
                songLabel.textContent = `${currentCard.artist} - ${currentCard.song}`;
                songLabel.style.fontSize = '12px';
            }
        }

        // Remover la carta del currentRound para que pase a la siguiente
        this.currentRound = this.currentRound.filter(card => card.id !== currentCard.id);
        console.log('Carta removida por timeout. Cartas restantes:', this.currentRound.length);
    }

    displayQRCards() {
        const qrCardsGrid = document.getElementById('qrCardsGrid');
        if (!qrCardsGrid) return;

        qrCardsGrid.innerHTML = '';

        this.currentRound.forEach((card, index) => {
            const qrCard = document.createElement('div');
            qrCard.className = 'qr-card';
            qrCard.setAttribute('draggable', 'true');
            qrCard.dataset.cardId = card.id;
            qrCard.innerHTML = `
                <img src="${card.qrImage}" alt="QR Code ${index + 1}" draggable="false">
                <div class="song-label">SCAN FOR AFSPILLE</div>
                <div class="debug-year">${card.year}</div>
            `;

            // Drag & drop personalizado compatible con todos los navegadores
            let isDragging = false;
            let draggedCard = null;
            let startX, startY;

            // Función para manejar el inicio del drag
            const startDrag = (e, isTouch = false) => {
                const clientX = isTouch ? e.touches[0].clientX : e.clientX;
                const clientY = isTouch ? e.touches[0].clientY : e.clientY;

                console.log('🖱️ Iniciando drag en carta:', card.id);
                if (qrCard.style.pointerEvents === 'none') return;

                e.preventDefault(); // Prevenir comportamientos por defecto
                isDragging = true;
                draggedCard = card;
                this.selectedCard = card;
                startX = clientX;
                startY = clientY;

                qrCard.style.opacity = '0.7';
                qrCard.style.transform += ' scale(1.05)';
                document.body.style.cursor = 'grabbing';
                document.body.style.userSelect = 'none';

                console.log('✅ Drag iniciado para carta:', card.id);
            };

            // Función para manejar el final del drag
            const endDrag = (e, isTouch = false) => {
                if (!isDragging || !draggedCard) return;

                const clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
                const clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;

                console.log('🖱️ Terminando drag en posición:', clientX, clientY);

                // Verificar si se soltó sobre una zona de drop
                const elementBelow = document.elementFromPoint(clientX, clientY);
                const dropZone = elementBelow?.closest('.drop-zone-between');

                if (dropZone) {
                    console.log('✅ Soltado en zona de drop:', dropZone.id);
                    this.handleDrop(e, dropZone);
                } else {
                    console.log('❌ No se soltó en zona válida, elemento encontrado:', elementBelow?.className);
                }

                // Resetear estado visual
                qrCard.style.opacity = '';
                qrCard.style.transform = qrCard.style.transform.replace(' scale(1.05)', '');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                isDragging = false;
                draggedCard = null;
            };

            // Eventos de mouse
            qrCard.addEventListener('mousedown', (e) => startDrag(e, false));
            document.addEventListener('mouseup', (e) => endDrag(e, false));

            // Eventos de touch para móviles
            qrCard.addEventListener('touchstart', (e) => startDrag(e, true), { passive: false });
            document.addEventListener('touchend', (e) => endDrag(e, true), { passive: false });

            qrCardsGrid.appendChild(qrCard);
        });

        // Configurar zonas de drop
        this.setupDropZones();

        console.log('Cartas disponibles:', this.currentRound.length);
    }

    setupDropZones() {
        // Las zonas de drop ahora se crean dinámicamente en displayTimeline()
        // No necesitamos configurar zonas estáticas
    }

    handleDragStart(e, card) {
        console.log('🔥 handleDragStart called - Estado:', this.gameState, 'Carta:', card.id);

        // Permitir drag en cualquier estado, pero solo si no hay una carta ya seleccionada en proceso
        if (this.gameState === 'revealed') {
            console.log('❌ No se puede hacer drag mientras se muestra resultado');
            e.preventDefault();
            return;
        }

        console.log('✅ Drag permitido, configurando...');
        this.selectedCard = card;
        e.dataTransfer.setData('text/plain', card.id);
        e.target.classList.add('dragging');
        document.body.classList.add('dragging'); // Mostrar zonas entre años

        console.log('✅ Drag configurado correctamente para carta:', card.id);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.body.classList.remove('dragging'); // Ocultar zonas entre años

        // Limpiar todas las clases drag-over
        document.querySelectorAll('.drop-zone, .drop-zone-between').forEach(zone => {
            zone.classList.remove('drag-over');
        });
    }

    handleDrop(e, dropZone) {
        if (!this.selectedCard) return;

        // Verificar si la carta ya fue procesada
        const cardAlreadyGuessed = this.guessedCards.find(card => card.id === this.selectedCard.id);
        if (cardAlreadyGuessed) {
            console.log('Carta ya fue adivinada, ignorando drop');
            return;
        }

        // Verificar si la carta aún está disponible
        const cardStillAvailable = this.currentRound.find(card => card.id === this.selectedCard.id);
        if (!cardStillAvailable) {
            console.log('Carta ya no está disponible, ignorando drop');
            return;
        }

        const zoneType = dropZone.id;
        let direction = '';

        // Todas las zonas ahora son del tipo 'between'
        if (zoneType.startsWith('dropZoneBetween')) {
            const yearIndex = parseInt(zoneType.replace('dropZoneBetween', ''));
            direction = `between-${yearIndex}`;
        }

        console.log('Carta soltada en zona:', zoneType, 'Dirección:', direction);

        this.selectedDirection = direction;
        this.gameState = 'choosing_direction'; // Asegurar estado correcto
        this.checkDirectionAndReveal();
    }



    displayTimeline() {
        const timelineYears = document.getElementById('timelineYears');
        if (!timelineYears) return;

        timelineYears.innerHTML = '';

        // Crear timeline dinámico: cartas adivinadas + año aleatorio
        const guessedYears = this.guessedCards.map(card => card.year);
        const allYears = [...guessedYears, this.randomYear];

        // Eliminar duplicados y ordenar
        const uniqueYears = [...new Set(allYears)];
        uniqueYears.sort((a, b) => a - b);

        console.log('Timeline display:', {
            guessedYears,
            randomYear: this.randomYear,
            allYears,
            uniqueYears
        });

        // Crear slots de años con zonas de drop entre ellos
        uniqueYears.forEach((year, index) => {
            // Crear zona de drop antes del primer año
            if (index === 0) {
                const dropBeforeFirst = document.createElement('div');
                dropBeforeFirst.className = 'drop-zone-between';
                dropBeforeFirst.id = `dropZoneBetween${index}`;
                dropBeforeFirst.innerHTML = '<div class="drop-indicator-small">←</div>';
                timelineYears.appendChild(dropBeforeFirst);
                this.setupBetweenDropZone(dropBeforeFirst);
            }

            // Crear slot del año
            const yearSlot = document.createElement('div');
            yearSlot.className = 'year-slot';

            // Marcar el año aleatorio de forma diferente
            if (year === this.randomYear) {
                yearSlot.classList.add('random');
            }

            yearSlot.textContent = year;
            timelineYears.appendChild(yearSlot);

            // Crear zona de drop después de cada año
            if (index < uniqueYears.length - 1) {
                const dropBetween = document.createElement('div');
                dropBetween.className = 'drop-zone-between';
                dropBetween.id = `dropZoneBetween${index + 1}`;
                dropBetween.innerHTML = '<div class="drop-indicator-small">↓</div>';
                timelineYears.appendChild(dropBetween);
                this.setupBetweenDropZone(dropBetween);
            }

            // Crear zona de drop después del último año
            if (index === uniqueYears.length - 1) {
                const dropAfterLast = document.createElement('div');
                dropAfterLast.className = 'drop-zone-between';
                dropAfterLast.id = `dropZoneBetween${index + 2}`;
                dropAfterLast.innerHTML = '<div class="drop-indicator-small">→</div>';
                timelineYears.appendChild(dropAfterLast);
                this.setupBetweenDropZone(dropAfterLast);
            }
        });
    }

    setupBetweenDropZone(zone) {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
            zone.style.display = 'flex'; // Mostrar durante drag
        });

        zone.addEventListener('dragleave', (e) => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            this.handleDrop(e, zone);
        });
    }


    checkDirectionAndReveal() {
        if (!this.selectedCard || !this.selectedDirection) return;

        // Detener el timer cuando se coloca la carta
        this.stopTimer();

        this.gameState = 'revealed';
        document.body.classList.add('game-revealed'); // Deshabilitar cartas visualmente

        const actualYear = this.selectedCard.year;
        let isCorrect = false;

        // Obtener timeline actual ordenado (sin duplicados)
        const guessedYears = this.guessedCards.map(card => card.year);
        const allTimelineYears = [...guessedYears, this.randomYear];
        const currentTimeline = [...new Set(allTimelineYears)].sort((a, b) => a - b);

        console.log('Validando:', {
            actualYear,
            direction: this.selectedDirection,
            currentTimeline,
            guessedCards: this.guessedCards.length,
            randomYear: this.randomYear
        });

        if (this.guessedCards.length === 0) {
            // Primera carta: comparar con año aleatorio usando sistema 'between-'
            console.log('Primera carta - comparando con año aleatorio:', this.randomYear);

            if (this.selectedDirection.startsWith('between-')) {
                const position = parseInt(this.selectedDirection.replace('between-', ''));
                console.log('Primera carta - BETWEEN position:', position);

                if (position === 0) {
                    // Antes del año aleatorio (flecha ←)
                    isCorrect = actualYear <= this.randomYear;
                    console.log(`BETWEEN-0 (ANTES): ${actualYear} <= ${this.randomYear} = ${isCorrect}`);
                } else {
                    // Después del año aleatorio (flecha →)
                    isCorrect = actualYear >= this.randomYear;
                    console.log(`BETWEEN-1 (DESPUÉS): ${actualYear} >= ${this.randomYear} = ${isCorrect}`);
                }
            }
        } else {
            // Timeline con múltiples elementos - todo manejo through 'between-' positions
            console.log('Timeline múltiple:', { currentTimeline });

            if (this.selectedDirection.startsWith('between-')) {
                // Posición específica entre dos años
                const position = parseInt(this.selectedDirection.replace('between-', ''));
                console.log('BETWEEN position:', position, 'Timeline length:', currentTimeline.length);

                if (position === 0) {
                    // Antes del primer año (flecha ←)
                    isCorrect = actualYear <= currentTimeline[0];
                    console.log(`BETWEEN-0 (ANTES): ${actualYear} <= ${currentTimeline[0]} = ${isCorrect}`);
                } else if (position >= currentTimeline.length) {
                    // Después del último año (flecha →)
                    isCorrect = actualYear >= currentTimeline[currentTimeline.length - 1];
                    console.log(`BETWEEN-LAST (DESPUÉS): ${actualYear} >= ${currentTimeline[currentTimeline.length - 1]} = ${isCorrect}`);
                } else {
                    // Entre dos años específicos (flecha ↓)
                    const beforeYear = currentTimeline[position - 1];
                    const afterYear = currentTimeline[position];
                    isCorrect = actualYear >= beforeYear && actualYear <= afterYear;
                    console.log(`BETWEEN-SPECIFIC (ENTRE): ${beforeYear} <= ${actualYear} <= ${afterYear} = ${isCorrect}`);
                }
            } else {
                console.log('ERROR: Dirección no reconocida:', this.selectedDirection);
                isCorrect = false;
            }
        }

        console.log('Resultado validación:', isCorrect);

        // Ocultar los botones de dirección pero mantener visible el botón OK
        const gameControlsContainer = document.getElementById('gameControlsContainer');
        const btnBefore = document.getElementById('btnBefore');
        const btnAfter = document.getElementById('btnAfter');
        const btnMiddle = document.getElementById('btnMiddle');
        const middleButtonContainer = document.getElementById('middleButtonContainer');

        // Ocultar botones de dirección
        if (btnBefore) btnBefore.style.display = 'none';
        if (btnAfter) btnAfter.style.display = 'none';
        if (btnMiddle) btnMiddle.style.display = 'none';
        if (middleButtonContainer) middleButtonContainer.style.display = 'none';

        // Ocultar overlay de protección al colocar la carta
        this.hideProtectionOverlay(this.selectedCard.id);

        // Cambiar el borde de la carta según el resultado
        const selectedCardElement = document.querySelector(`[data-card-id="${this.selectedCard.id}"]`);
        if (selectedCardElement) {
            if (isCorrect) {
                selectedCardElement.classList.add('correct-answer');
                selectedCardElement.classList.remove('incorrect-answer');
            } else {
                selectedCardElement.classList.add('incorrect-answer');
                selectedCardElement.classList.remove('correct-answer');
            }

            // Ocultar imagen QR (el iframe de Spotify ya muestra la portada)
            const qrImage = selectedCardElement.querySelector('img');
            if (qrImage) {
                qrImage.style.display = 'none';
            }

            // Cambiar el texto del label
            const songLabel = selectedCardElement.querySelector('.song-label');
            if (songLabel) {
                songLabel.textContent = `${this.selectedCard.artist} - ${this.selectedCard.song}`;
                songLabel.style.fontSize = '12px';
            }
        }

        // Mostrar resultado arriba de las cartas
        const resultContainer = document.getElementById('resultContainer');
        const resultContent = document.getElementById('resultContent');

        if (resultContainer && resultContent) {
            const resultClass = isCorrect ? 'correct' : 'incorrect';
            const resultText = isCorrect ? '¡Correcto!' : 'Incorrecto';
            const pointsText = isCorrect ? '+20 puntos' : '+0 puntos';

            // Cambiar la clase del modal según el resultado
            const resultCard = resultContainer.querySelector('.result-card');
            if (resultCard) {
                if (isCorrect) {
                    resultCard.classList.add('correct-result');
                    resultCard.classList.remove('incorrect-result');
                } else {
                    resultCard.classList.add('incorrect-result');
                    resultCard.classList.remove('correct-result');
                }
            }

            const buttonAction = !isCorrect && this.playerCount > 1 ? 'game.handleIncorrectAnswer()' : 'game.nextRound()';

            resultContent.innerHTML = `
                <div class="result-indicator ${resultClass}">${resultText}</div>
                <iframe src="https://open.spotify.com/embed/track/${this.selectedCard.spotifyId}?utm_source=generator&theme=0" width="100%" height="352" frameBorder="0" allow="autoplay; clipboard-write; fullscreen; picture-in-picture" loading="lazy" style="border-radius: 12px;"></iframe>
                <div class="year-display">${actualYear}</div>
                <div class="song-info">
                    <div class="artist">${this.selectedCard.artist}</div>
                    <div class="song">${this.selectedCard.song}</div>
                </div>
                <button class="next-button" onclick="${buttonAction}">Siguiente</button>
            `;

            resultContainer.style.display = 'flex';
        }

        // Ocultar el contenedor de carta seleccionada de abajo
        const selectedCardContainer = document.getElementById('selectedCardContainer');
        if (selectedCardContainer) {
            selectedCardContainer.style.display = 'none';
        }

        // Actualizar puntuación y timeline si es correcto
        if (isCorrect) {
            this.score += 20;

            // Incrementar cartas jugadas en modo multijugador
            if (this.playerCount > 1 && this.players[this.currentPlayerIndex]) {
                this.players[this.currentPlayerIndex].cardsPlayed++;
            }

            // Verificar que la carta no esté ya en el timeline
            const cardAlreadyExists = this.guessedCards.find(card => card.id === this.selectedCard.id);
            if (!cardAlreadyExists) {
                this.guessedCards.push(this.selectedCard);
                console.log('Carta agregada al timeline:', this.selectedCard.year);

                // Remover la carta de las opciones disponibles
                this.currentRound = this.currentRound.filter(card => card.id !== this.selectedCard.id);
                console.log('Carta removida de opciones. Cartas restantes:', this.currentRound.length);
            } else {
                console.log('Carta ya existe en timeline, no se agrega duplicada');
            }
            this.displayTimeline();
        }

        this.updateScore();

        // Actualizar cartas disponibles si hubo acierto
        if (isCorrect) {
            // Remover la carta del DOM y reorganizar el mazo
            const selectedCardElement = document.querySelector(`[data-card-id="${this.selectedCard.id}"]`);
            if (selectedCardElement) {
                selectedCardElement.remove();
                // Reorganizar z-index de cartas restantes
                this.reorganizeCardStack();
            }
        }

        // El botón "Siguiente" ya está visible en el contenedor de la carta
        console.log('Resultado mostrado. Botón "Siguiente" disponible. Carta procesada:', this.selectedCard?.id);
    }

    reorganizeCardStack() {
        const remainingCards = document.querySelectorAll('.qr-card');
        remainingCards.forEach((card, index) => {
            // Remover todas las clases de posición
            card.style.pointerEvents = '';

            // Aplicar nuevas posiciones
            if (index === 0) {
                // Primera carta (arriba) - interactiva
                card.style.zIndex = '5';
                card.style.transform = 'translateX(0px) translateY(0px) rotate(0deg)';
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
            } else if (index === 1) {
                card.style.zIndex = '4';
                card.style.transform = 'translateX(-3px) translateY(-3px) rotate(-2deg)';
                card.style.opacity = '0.95';
                card.style.pointerEvents = 'none';
            } else if (index === 2) {
                card.style.zIndex = '3';
                card.style.transform = 'translateX(-6px) translateY(-6px) rotate(-4deg)';
                card.style.opacity = '0.9';
                card.style.pointerEvents = 'none';
            } else if (index === 3) {
                card.style.zIndex = '2';
                card.style.transform = 'translateX(-9px) translateY(-9px) rotate(-6deg)';
                card.style.opacity = '0.85';
                card.style.pointerEvents = 'none';
            } else if (index === 4) {
                card.style.zIndex = '1';
                card.style.transform = 'translateX(-12px) translateY(-12px) rotate(-8deg)';
                card.style.opacity = '0.8';
                card.style.pointerEvents = 'none';
            }
        });
    }

    nextRound() {
        console.log('nextRound() llamado. Carta actual:', this.selectedCard?.id);

        // Remover la carta jugada de las opciones disponibles
        this.currentRound = this.currentRound.filter(card => card.id !== this.selectedCard.id);

        console.log('Cartas restantes después de filtrar:', this.currentRound.length);

        // En modo multijugador, verificar si el jugador actual completó sus 5 cartas
        if (this.playerCount > 1 && this.players[this.currentPlayerIndex]) {
            if (this.players[this.currentPlayerIndex].cardsPlayed >= this.maxCardsPerPlayer) {
                // Este jugador terminó sus 5 cartas, pasar al siguiente
                this.nextPlayer();
                return;
            }
        }

        // Si quedan cartas, continuar jugando
        if (this.currentRound.length > 0) {
            console.log('Continuando con siguiente ronda...');
            this.startRound();
        } else {
            // No quedan más cartas, terminar el juego
            console.log('No quedan más cartas, terminando juego...');
            this.endGame();
        }
    }

    nextPlayer() {
        // Guardar el puntaje del jugador actual
        if (this.players.length > 0) {
            this.players[this.currentPlayerIndex].score = this.score;
        }

        // Pasar al siguiente jugador
        this.currentPlayerIndex++;

        if (this.currentPlayerIndex < this.players.length) {
            // Mostrar pantalla de listo para el siguiente jugador
            this.resetPlayerRound();
            this.showReadyScreen();
        } else {
            // Todos los jugadores ya jugaron
            this.endGame();
        }
    }

    handleIncorrectAnswer() {
        // Cerrar el modal de resultado
        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) {
            resultContainer.style.display = 'none';
        }

        // Incrementar cartas jugadas del jugador actual
        if (this.playerCount > 1 && this.players[this.currentPlayerIndex]) {
            this.players[this.currentPlayerIndex].cardsPlayed++;

            // Verificar si este jugador ya jugó sus 5 cartas
            if (this.players[this.currentPlayerIndex].cardsPlayed >= this.maxCardsPerPlayer) {
                // Este jugador terminó, pasar al siguiente
                this.nextPlayer();
            } else {
                // Aún le quedan cartas, pero al fallar pasa el turno
                this.passTurn();
            }
        } else {
            // Modo 1 jugador, continúa con la siguiente carta
            this.nextRound();
        }
    }

    passTurn() {
        // Guardar el estado del jugador actual
        this.savePlayerState();

        // Buscar el siguiente jugador que aún no haya completado sus 5 cartas
        let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
        let attempts = 0;

        while (attempts < this.players.length) {
            if (this.players[nextIndex].cardsPlayed < this.maxCardsPerPlayer) {
                // Encontramos un jugador que aún tiene cartas por jugar
                this.currentPlayerIndex = nextIndex;

                // Si es la primera vez que juega este jugador, inicializar su estado
                if (!this.players[this.currentPlayerIndex].currentRound) {
                    this.resetPlayerRound();
                    this.savePlayerState();
                } else {
                    // Cargar el estado guardado del jugador
                    this.loadPlayerState();
                }

                this.showReadyScreen();
                return;
            }
            nextIndex = (nextIndex + 1) % this.players.length;
            attempts++;
        }

        // Todos los jugadores terminaron sus cartas
        this.endGame();
    }

    savePlayerState() {
        // Guardar el estado del jugador actual
        if (this.players[this.currentPlayerIndex]) {
            this.players[this.currentPlayerIndex].score = this.score;
            this.players[this.currentPlayerIndex].timeline = [...this.timeline];
            this.players[this.currentPlayerIndex].guessedCards = JSON.parse(JSON.stringify(this.guessedCards));
            this.players[this.currentPlayerIndex].currentRound = JSON.parse(JSON.stringify(this.currentRound));
            this.players[this.currentPlayerIndex].randomYear = this.randomYear;

            console.log('Estado guardado para', this.players[this.currentPlayerIndex].name, {
                score: this.score,
                guessedCards: this.guessedCards.length,
                currentRound: this.currentRound.length,
                cardsPlayed: this.players[this.currentPlayerIndex].cardsPlayed
            });
        }
    }

    loadPlayerState() {
        // Cargar el estado del jugador actual
        const player = this.players[this.currentPlayerIndex];
        if (player) {
            this.score = player.score || 0;
            this.timeline = player.timeline || [];
            this.guessedCards = player.guessedCards ? JSON.parse(JSON.stringify(player.guessedCards)) : [];
            this.currentRound = player.currentRound ? JSON.parse(JSON.stringify(player.currentRound)) : [...this.cardDatabase];
            this.randomYear = player.randomYear || this.getRandomYear();

            console.log('Estado cargado para', player.name, {
                score: this.score,
                guessedCards: this.guessedCards.length,
                currentRound: this.currentRound.length,
                cardsPlayed: player.cardsPlayed
            });

            // Actualizar el timeline visual
            this.displayTimeline();
        }
    }

    resetPlayerRound() {
        // Resetear el juego para el siguiente jugador (primera vez que juega)
        this.score = this.players[this.currentPlayerIndex]?.score || 0;
        this.timeline = [];
        this.guessedCards = [];

        // Asignar cartas únicas para este jugador
        const playerCards = this.getPlayerCards(this.currentPlayerIndex, this.maxCardsPerPlayer);
        this.players[this.currentPlayerIndex].assignedCards = playerCards;
        this.currentRound = [...playerCards];

        this.randomYear = this.getRandomYear();
        this.selectedCard = null;
        this.gameState = 'selecting';
    }

    restartGame() {
        console.log('🔄 Reiniciando juego');

        // Detener y resetear timer
        this.stopTimer();
        this.timeRemaining = 60;
        this.timerActive = false;

        // Resetear todas las variables del juego
        this.score = 0;
        this.timeline = [];
        this.guessedCards = [];
        this.randomYear = this.getRandomYear();
        this.selectedCard = null;
        this.selectedQRIndex = null;
        this.selectedDirection = null;
        this.gameState = 'selecting';
        this.currentPlayerIndex = 0;
        this.maxCardsPerPlayer = 5;
        this.players = [];
        this.playerCount = 0;
        this.cardDatabase = [];
        this.currentRound = [];

        // Limpiar UI
        const qrCardsGrid = document.getElementById('qrCardsGrid');
        if (qrCardsGrid) qrCardsGrid.innerHTML = '';

        const timelineContainer = document.querySelector('.timeline-container');
        if (timelineContainer) {
            timelineContainer.style.display = 'flex';
            const timelineYears = document.getElementById('timelineYears');
            if (timelineYears) timelineYears.innerHTML = '';
        }

        const selectedCardContainer = document.getElementById('selectedCardContainer');
        if (selectedCardContainer) selectedCardContainer.style.display = 'none';

        const timerBarContainer = document.getElementById('timerBarContainer');
        if (timerBarContainer) timerBarContainer.style.display = 'none';

        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) resultContainer.style.display = 'none';

        // Resetear score display
        const scoreElement = document.getElementById('score');
        if (scoreElement) scoreElement.textContent = '0';

        const currentPlayerName = document.getElementById('currentPlayerName');
        if (currentPlayerName) currentPlayerName.textContent = '';

        // Mostrar modal de selección de jugadores
        const playerSelectionModal = document.getElementById('playerSelectionModal');
        if (playerSelectionModal) {
            playerSelectionModal.style.display = 'flex';
        }

        // Generar botones de selección de jugadores
        this.showPlayerSelection();
    }

    startTiebreaker() {
        console.log('🔄 Iniciando desempate');

        // Encontrar jugadores con el puntaje más alto
        const maxScore = Math.max(...this.players.map(p => p.score));
        const tiedPlayers = this.players.filter(p => p.score === maxScore);

        console.log('Jugadores empatados:', tiedPlayers.map(p => p.name));

        // Configurar modo desempate: solo 1 carta por jugador
        this.maxCardsPerPlayer = 1;

        // Resetear cardsPlayed solo para los jugadores empatados
        this.players.forEach((player, index) => {
            if (tiedPlayers.includes(player)) {
                player.cardsPlayed = 0;
                // Mantener su puntaje actual
                // Limpiar cartas asignadas anteriormente para el desempate
                player.assignedCards = [];
                player.currentRound = [];
                player.guessedCards = [];
                player.timeline = [];
                player.randomYear = this.getRandomYear();
            } else {
                // Los que no están empatados ya no juegan más
                player.cardsPlayed = this.maxCardsPerPlayer;
            }
        });

        // Ocultar la pantalla de game over
        const qrCardsGrid = document.getElementById('qrCardsGrid');
        if (qrCardsGrid) {
            qrCardsGrid.innerHTML = '';
        }

        // Mostrar la timeline container
        const timelineContainer = document.querySelector('.timeline-container');
        if (timelineContainer) {
            timelineContainer.style.display = 'flex';
        }

        // Empezar con el primer jugador empatado
        this.currentPlayerIndex = this.players.indexOf(tiedPlayers[0]);
        this.resetPlayerRound();
        this.savePlayerState();
        this.showReadyScreen();
    }

    endGame() {
        console.log('🏁 ENDGAME - Mostrando resumen final');

        // Guardar puntuación del último jugador
        if (this.players.length > 0 && this.currentPlayerIndex < this.players.length) {
            this.players[this.currentPlayerIndex].score = this.score;
        }

        // Ocultar todos los elementos del juego
        const selectedCardContainer = document.getElementById('selectedCardContainer');
        const gameControlsContainer = document.getElementById('gameControlsContainer');
        const resultContainer = document.getElementById('resultContainer');
        const qrCardsGrid = document.getElementById('qrCardsGrid');
        const timelineContainer = document.querySelector('.timeline-container');

        if (selectedCardContainer) selectedCardContainer.style.display = 'none';
        if (gameControlsContainer) gameControlsContainer.style.display = 'none';
        if (resultContainer) resultContainer.style.display = 'none';
        if (timelineContainer) timelineContainer.style.display = 'none';

        // Mostrar mensaje final en el área de cartas
        if (qrCardsGrid) {
            if (this.playerCount > 1) {
                // Ordenar jugadores por puntaje (de mayor a menor)
                const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);

                // Verificar si hay empate en el primer lugar
                const maxScore = sortedPlayers[0].score;
                const winners = sortedPlayers.filter(p => p.score === maxScore);

                let winnerText;
                let buttonHtml;

                if (winners.length > 1) {
                    const winnerNames = winners.map(w => w.name).join(' y ');
                    winnerText = `🏆 Empate: ${winnerNames}`;
                    buttonHtml = `<button class="btn btn-restart" onclick="game.startTiebreaker()">Desempatar</button>`;
                } else {
                    winnerText = `🏆 Ganador: ${sortedPlayers[0].name}`;
                    buttonHtml = `<button class="btn btn-restart" onclick="game.restartGame()">Jugar de Nuevo</button>`;
                }

                qrCardsGrid.innerHTML = `
                    <div class="game-over">
                        <h2>Resultados!</h2>
                        <div class="final-score">${winnerText}</div>
                        <div class="timeline-summary">
                            <div class="final-timeline">
                                ${sortedPlayers.map((player, index) =>
                                    `<div class="timeline-item">${index + 1}. ${player.name}: ${player.score} puntos</div>`
                                ).join('')}
                            </div>
                        </div>
                        ${buttonHtml}
                    </div>
                `;
            } else {
                // Guardar estadísticas en Firebase si está registrado
                if (!isGuestMode && currentUser && !currentUser.isGuest) {
                    saveGameStats(this.score, this.playerCount, this.players);
                }

                qrCardsGrid.innerHTML = `
                    <div class="game-over">
                        <h2>Resultados!</h2>
                        <div class="final-score">Puntuación Final: ${this.score} puntos</div>
                        <div class="cards-guessed">Cartas acertadas: ${this.guessedCards.length} de 5</div>
                        <div class="timeline-summary">
                            <h3>Tu Timeline Final:</h3>
                            <div class="final-timeline">
                                ${this.guessedCards.sort((a, b) => a.year - b.year).map(card =>
                                    `<div class="timeline-item">${card.year} - ${card.artist} - ${card.song}</div>`
                                ).join('')}
                            </div>
                        </div>
                        <button class="btn btn-share" onclick="game.shareResult()">📤 Compartir Resultado</button>
                        <button class="btn btn-restart" onclick="game.restartGame()">Jugar de Nuevo</button>
                    </div>
                `;
            }
        }

        console.log('✅ Resumen final mostrado');
    }

    updateScore() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    }

    shareResult() {
        // Crear texto para compartir
        const text = `🎵 Musikquizkampen 🎵\n\n` +
                     `Puntuación: ${this.score} puntos\n` +
                     `Cartas acertadas: ${this.guessedCards.length}/5\n\n` +
                     `Mi Timeline:\n` +
                     `${this.guessedCards.sort((a, b) => a.year - b.year).map(card =>
                         `${card.year} - ${card.artist}`
                     ).join('\n')}\n\n` +
                     `¡Juega tú también! ${window.location.href}`;

        // Usar Web Share API si está disponible (móvil)
        if (navigator.share) {
            navigator.share({
                title: 'Musikquizkampen - Mi Resultado',
                text: text
            }).then(() => {
                console.log('Compartido exitosamente');
            }).catch((error) => {
                console.log('Error al compartir:', error);
                // Fallback a copiar al portapapeles
                this.copyToClipboard(text);
            });
        } else {
            // Fallback para desktop - copiar al portapapeles
            this.copyToClipboard(text);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('✅ Resultado copiado al portapapeles!\nPuedes pegarlo en WhatsApp, redes sociales, etc.');
        }).catch((error) => {
            console.error('Error al copiar:', error);
            // Fallback adicional
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('✅ Resultado copiado al portapapeles!');
        });
    }

    openProtectedAudio(audioLink, cardId) {
        // Abrir en nueva ventana
        const audioWindow = window.open(audioLink, `audio_${cardId}`, 'width=400,height=600');

        // Guardar referencia
        this.audioWindows[cardId] = audioWindow;

        // Mostrar overlay de protección
        this.showProtectionOverlay(cardId);
    }

    showProtectionOverlay(cardId) {
        // Buscar la carta específica
        const card = document.querySelector(`[data-card-id="${cardId}"]`);
        if (!card) return;

        // Ocultar la imagen QR y el botón play
        const qrImage = card.querySelector('img');
        const playButton = card.querySelector('.play-button');
        const songLabel = card.querySelector('.song-label');

        if (qrImage) qrImage.style.display = 'none';
        if (playButton) playButton.style.display = 'none';
        if (songLabel) songLabel.style.display = 'none';

        // Crear el overlay dentro de la carta
        const overlay = document.createElement('div');
        overlay.className = 'card-audio-overlay';
        overlay.innerHTML = `
            <div class="audio-playing-icon">🎵</div>
            <div class="audio-playing-text">Escuchando...</div>
            <div class="audio-hint">Arrastra la carta al timeline</div>
        `;

        card.appendChild(overlay);
    }

    hideProtectionOverlay(cardId) {
        // Buscar la carta y remover el overlay
        const card = document.querySelector(`[data-card-id="${cardId}"]`);
        if (card) {
            const overlay = card.querySelector('.card-audio-overlay');
            if (overlay) {
                overlay.remove();
            }

            // Restaurar elementos originales
            const qrImage = card.querySelector('img');
            const playButton = card.querySelector('.play-button');
            const songLabel = card.querySelector('.song-label');

            if (qrImage) qrImage.style.display = 'block';
            if (playButton) playButton.style.display = 'block';
            if (songLabel) songLabel.style.display = 'block';
        }

        // Cerrar la ventana de audio si existe
        if (this.audioWindows[cardId] && !this.audioWindows[cardId].closed) {
            this.audioWindows[cardId].close();
        }
        delete this.audioWindows[cardId];
    }

    openAudioModal(audioLink) {
        const audioModal = document.getElementById('audioModal');
        const audioIframe = document.getElementById('audioIframe');

        if (audioModal && audioIframe) {
            audioIframe.src = audioLink;
            audioModal.style.display = 'flex';
        }
    }

    closeAudioModal() {
        const audioModal = document.getElementById('audioModal');
        const audioIframe = document.getElementById('audioIframe');

        if (audioModal && audioIframe) {
            audioIframe.src = '';
            audioModal.style.display = 'none';
        }
    }
}

// Variable global para acceder al juego
let game;
let currentUser = null;
let isGuestMode = false;

// Inicializar el juego cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar splash screen y luego mostrar login
    const splashScreen = document.getElementById('splashScreen');
    const loginModal = document.getElementById('loginModal');

    setTimeout(() => {
        if (splashScreen) {
            splashScreen.style.display = 'none';
        }
        // Mostrar modal de login
        if (loginModal) {
            loginModal.style.display = 'flex';
        }

        // Configurar Firebase Auth
        setupFirebaseAuth();
    }, 2000);

    // Configurar modal de changelog
    const versionIndicator = document.getElementById('versionIndicator');
    const changelogModal = document.getElementById('changelogModal');
    const closeModal = document.getElementById('closeModal');

    if (versionIndicator && changelogModal) {
        versionIndicator.addEventListener('click', () => {
            changelogModal.style.display = 'flex';
        });
    }

    if (closeModal && changelogModal) {
        closeModal.addEventListener('click', () => {
            changelogModal.style.display = 'none';
        });

        // Cerrar al hacer click fuera del contenido
        changelogModal.addEventListener('click', (e) => {
            if (e.target === changelogModal) {
                changelogModal.style.display = 'none';
            }
        });
    }

    // Configurar modal de audio
    const audioModal = document.getElementById('audioModal');
    const closeAudioModal = document.getElementById('closeAudioModal');

    if (closeAudioModal && audioModal) {
        closeAudioModal.addEventListener('click', () => {
            game.closeAudioModal();
        });

        // Cerrar al hacer click fuera del contenido
        audioModal.addEventListener('click', (e) => {
            if (e.target === audioModal) {
                game.closeAudioModal();
            }
        });
    }

    // Configurar modal de profile
    const menuProfile = document.getElementById('menuProfile');
    const profileModal = document.getElementById('profileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const profileGuest = document.getElementById('profileGuest');
    const profileUser = document.getElementById('profileUser');
    const btnProfileLogin = document.getElementById('btnProfileLogin');
    const btnProfileLogout = document.getElementById('btnProfileLogout');
    const profileUserName = document.getElementById('profileUserName');
    const profileUserEmail = document.getElementById('profileUserEmail');
    const userAvatarImg = document.getElementById('userAvatarImg');

    if (menuProfile && profileModal) {
        menuProfile.addEventListener('click', async () => {
            // Mostrar perfil según el tipo de usuario
            if (isGuestMode) {
                profileGuest.style.display = 'flex';
                profileUser.style.display = 'none';
            } else if (currentUser && !currentUser.isGuest) {
                profileGuest.style.display = 'none';
                profileUser.style.display = 'flex';

                // Actualizar datos del usuario
                if (profileUserName) profileUserName.textContent = currentUser.displayName || 'Usuario';
                if (profileUserEmail) profileUserEmail.textContent = currentUser.email || '';
                if (userAvatarImg && currentUser.photoURL) userAvatarImg.src = currentUser.photoURL;

                // Cargar y mostrar estadísticas
                const stats = await loadUserStats();
                if (stats) {
                    const totalGames = document.getElementById('totalGames');
                    const totalPoints = document.getElementById('totalPoints');
                    const avgPoints = document.getElementById('avgPoints');

                    if (totalGames) totalGames.textContent = stats.totalGames;
                    if (totalPoints) totalPoints.textContent = stats.totalPoints;
                    if (avgPoints) avgPoints.textContent = stats.avgPoints;
                }
            }

            profileModal.style.display = 'flex';
            menuDropdown.style.display = 'none';
            hamburgerMenu.textContent = '☰';
        });
    }

    if (closeProfileModal && profileModal) {
        closeProfileModal.addEventListener('click', () => {
            profileModal.style.display = 'none';
            game.resumeTimer();
        });

        // Cerrar al hacer click fuera del contenido
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.style.display = 'none';
                game.resumeTimer();
            }
        });
    }

    if (btnProfileLogin) {
        btnProfileLogin.addEventListener('click', async () => {
            try {
                const result = await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider);
                console.log('Login exitoso desde profile:', result.user.displayName);

                // Actualizar estado
                isGuestMode = false;
                currentUser = result.user;

                // Cerrar modal de profile
                profileModal.style.display = 'none';

                // Recargar para aplicar cambios completos
                location.reload();
            } catch (error) {
                console.error('Error en login:', error);
                alert('Error al iniciar sesión: ' + error.message);
            }
        });
    }

    if (btnProfileLogout) {
        btnProfileLogout.addEventListener('click', async () => {
            try {
                await window.firebaseSignOut(window.firebaseAuth);
                console.log('Logout exitoso desde profile');
                location.reload();
            } catch (error) {
                console.error('Error en logout:', error);
            }
        });
    }

    // Configurar modal de config
    const menuConfig = document.getElementById('menuConfig');
    const configModal = document.getElementById('configModal');
    const closeConfigModal = document.getElementById('closeConfigModal');
    const configTheme = document.getElementById('configTheme');
    const configHacks = document.getElementById('configHacks');
    const themeText = document.getElementById('themeText');
    const hacksStatus = document.getElementById('hacksStatus');
    const configHacksSection = document.getElementById('configHacksSection');

    if (menuConfig && configModal) {
        menuConfig.addEventListener('click', async () => {
            // Verificar si el usuario es admin
            if (!isGuestMode && currentUser && !currentUser.isGuest && window.firebaseDb) {
                try {
                    const userRef = window.firestoreDoc(window.firebaseDb, 'users', currentUser.uid);
                    const userSnap = await window.firestoreGetDoc(userRef);

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        console.log('👤 Datos del usuario:', userData);
                        console.log('🔑 Es admin?', userData.admin === true);
                        // Mostrar Hacks solo si admin === true
                        if (configHacksSection) {
                            configHacksSection.style.display = userData.admin === true ? 'block' : 'none';
                        }
                    }
                } catch (error) {
                    console.error('Error al verificar admin:', error);
                    if (configHacksSection) {
                        configHacksSection.style.display = 'none';
                    }
                }
            } else {
                // Guest users no ven Hacks
                if (configHacksSection) {
                    configHacksSection.style.display = 'none';
                }
            }

            configModal.style.display = 'flex';
            menuDropdown.style.display = 'none';
            hamburgerMenu.textContent = '☰';
        });
    }

    if (closeConfigModal && configModal) {
        closeConfigModal.addEventListener('click', () => {
            configModal.style.display = 'none';
            game.resumeTimer();
        });

        // Cerrar al hacer click fuera del contenido
        configModal.addEventListener('click', (e) => {
            if (e.target === configModal) {
                configModal.style.display = 'none';
                game.resumeTimer();
            }
        });
    }

    if (configTheme) {
        configTheme.addEventListener('click', () => {
            const isLightTheme = document.body.classList.contains('light-theme');

            if (isLightTheme) {
                document.body.classList.remove('light-theme');
                themeText.textContent = 'Theme Clear';
            } else {
                document.body.classList.add('light-theme');
                themeText.textContent = 'Theme Dark';
            }
        });
    }

    if (configHacks) {
        configHacks.addEventListener('click', () => {
            toggleDebugMode();
            hacksStatus.textContent = debugEnabled ? 'ON' : 'OFF';
        });
    }

    // Configurar modal de Contact
    const configContact = document.getElementById('configContact');
    const contactModal = document.getElementById('contactModal');
    const closeContactModal = document.getElementById('closeContactModal');
    const contactForm = document.getElementById('contactForm');
    const contactName = document.getElementById('contactName');
    const contactEmail = document.getElementById('contactEmail');
    const contactMessage = document.getElementById('contactMessage');
    const charCount = document.getElementById('charCount');
    const nameGroup = document.getElementById('nameGroup');

    if (configContact && contactModal) {
        configContact.addEventListener('click', () => {
            // Verificar si es usuario registrado o guest
            if (!isGuestMode && currentUser && !currentUser.isGuest) {
                // Usuario registrado: ocultar campo nombre y autocompletar email
                nameGroup.style.display = 'none';
                contactName.removeAttribute('required');
                contactEmail.value = currentUser.email || '';
                contactEmail.readOnly = true;
            } else {
                // Guest: mostrar todos los campos
                nameGroup.style.display = 'flex';
                contactName.setAttribute('required', 'required');
                contactEmail.value = '';
                contactEmail.readOnly = false;
            }

            // Limpiar mensaje
            contactMessage.value = '';
            charCount.textContent = '0';

            contactModal.style.display = 'flex';
            configModal.style.display = 'none';
        });
    }

    if (closeContactModal && contactModal) {
        closeContactModal.addEventListener('click', () => {
            contactModal.style.display = 'none';
            game.resumeTimer();
        });

        // Cerrar al hacer click fuera del contenido
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.style.display = 'none';
                game.resumeTimer();
            }
        });
    }

    // Contador de caracteres
    if (contactMessage && charCount) {
        contactMessage.addEventListener('input', () => {
            charCount.textContent = contactMessage.value.length;
        });
    }

    // Enviar formulario
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = isGuestMode || !currentUser || currentUser.isGuest
                ? contactName.value.trim()
                : currentUser.displayName || 'Usuario';
            const email = contactEmail.value.trim();
            const message = contactMessage.value.trim();

            if (!email || !message) {
                alert('Por favor completa todos los campos');
                return;
            }

            console.log('📧 Mensaje de contacto:', {
                name,
                email,
                message,
                timestamp: new Date().toISOString()
            });

            // Aquí puedes agregar integración con Firebase o servicio de email
            alert('¡Mensaje enviado! Gracias por contactarnos.');
            contactModal.style.display = 'none';
            contactForm.reset();
            charCount.textContent = '0';
            game.resumeTimer();
        });
    }

    // Configurar modal de Ranking
    const menuRanking = document.getElementById('menuRanking');
    const rankingModal = document.getElementById('rankingModal');
    const closeRankingModal = document.getElementById('closeRankingModal');
    const rankingList = document.getElementById('rankingList');

    async function displayRanking() {
        rankingList.innerHTML = '<div class="ranking-loading">Cargando ranking...</div>';

        const games = await loadRanking();

        if (games.length === 0) {
            rankingList.innerHTML = '<div class="ranking-loading">No hay partidas disponibles</div>';
            return;
        }

        // Agrupar juegos por userId-playerName para evitar duplicados
        const bestGames = new Map();

        games.forEach(game => {
            game.players.forEach(player => {
                // Crear clave única: userId + nombre del jugador
                const key = `${game.userId}-${player.name}`;

                // Si no existe o el score es mayor, actualizar
                if (!bestGames.has(key) || bestGames.get(key).score < player.score) {
                    bestGames.set(key, {
                        userId: game.userId,
                        userName: game.userName,
                        userPhoto: game.userPhoto,
                        playerName: player.name,
                        score: player.score,
                        timestamp: game.timestamp,
                        playerCount: game.playerCount,
                        allPlayers: game.players
                    });
                }
            });
        });

        // Convertir a array y ordenar por puntaje
        const rankedGames = Array.from(bestGames.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 50); // Limitar a top 50

        if (rankedGames.length === 0) {
            rankingList.innerHTML = '<div class="ranking-loading">No hay partidas disponibles</div>';
            return;
        }

        rankingList.innerHTML = '';

        // Mostrar mensaje para usuarios guest al inicio
        if (isGuestMode || !currentUser || currentUser.isGuest) {
            const guestMessage = document.createElement('div');
            guestMessage.className = 'guest-ranking-message';
            guestMessage.style.cssText = 'background: #fff3cd; color: #856404; padding: 15px; margin: 10px; border-radius: 8px; text-align: center; font-weight: bold; border: 2px solid #ffc107;';
            guestMessage.textContent = '⚠️ Solo usuarios registrados rankean';
            rankingList.appendChild(guestMessage);
        }

        rankedGames.forEach((game, index) => {
            const position = index + 1;
            const positionClass = position === 1 ? 'top1' : position === 2 ? 'top2' : position === 3 ? 'top3' : '';

            // Ordenar jugadores por puntaje
            const sortedPlayers = [...game.allPlayers].sort((a, b) => b.score - a.score);
            const playersHtml = sortedPlayers.map((p, i) =>
                `<div class="player-score">${i + 1}. ${p.name}: ${p.score} pts</div>`
            ).join('');

            const date = new Date(game.timestamp);
            const dateStr = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const item = document.createElement('div');
            item.className = 'ranking-item';
            item.innerHTML = `
                <div class="ranking-position ${positionClass}">#${position}</div>
                <img src="${game.userPhoto || 'https://via.placeholder.com/40'}" alt="${game.userName}" class="ranking-avatar">
                <div class="ranking-info">
                    <div class="ranking-name">Partida de ${game.userName}</div>
                    <div class="ranking-date">${dateStr} - ${game.playerCount} ${game.playerCount === 1 ? 'jugador' : 'jugadores'}</div>
                    <div class="ranking-players">${playersHtml}</div>
                </div>
            `;
            rankingList.appendChild(item);
        });
    }

    if (menuRanking && rankingModal) {
        menuRanking.addEventListener('click', async () => {
            rankingModal.style.display = 'flex';
            menuDropdown.style.display = 'none';
            hamburgerMenu.textContent = '☰';
            await displayRanking();
        });
    }

    if (closeRankingModal && rankingModal) {
        closeRankingModal.addEventListener('click', () => {
            rankingModal.style.display = 'none';
            game.resumeTimer();
        });

        rankingModal.addEventListener('click', (e) => {
            if (e.target === rankingModal) {
                rankingModal.style.display = 'none';
                game.resumeTimer();
            }
        });
    }

    // Configurar modal de Create List
    const menuCreateList = document.getElementById('menuCreateList');
    const createListModal = document.getElementById('createListModal');
    const closeCreateListModal = document.getElementById('closeCreateListModal');
    const listNameInput = document.getElementById('listNameInput');
    const listNameError = document.getElementById('listNameError');
    const spotifyLinkInput = document.getElementById('spotifyLinkInput');
    const loadSongBtn = document.getElementById('loadSongBtn');
    const songPreview = document.getElementById('songPreview');
    const songData = document.getElementById('songData');
    const addToListBtn = document.getElementById('addToListBtn');
    const songsList = document.getElementById('songsList');
    const songCounter = document.getElementById('songCounter');
    const saveListBtn = document.getElementById('saveListBtn');
    const scanQrBtn = document.getElementById('scanQrBtn');
    const qrScannerModal = document.getElementById('qrScannerModal');
    const closeQrScanner = document.getElementById('closeQrScanner');
    const qrVideo = document.getElementById('qrVideo');
    const qrCanvas = document.getElementById('qrCanvas');
    const qrResult = document.getElementById('qrResult');

    let currentListName = '';
    let currentSongs = [];
    let currentSongPreview = null;
    let qrStream = null;
    let qrScanInterval = null;

    if (menuCreateList && createListModal) {
        menuCreateList.addEventListener('click', () => {
            createListModal.style.display = 'flex';
            menuDropdown.style.display = 'none';
            hamburgerMenu.textContent = '☰';
            resetCreateListForm();
        });
    }

    function resetCreateListForm() {
        currentListName = '';
        currentSongs = [];
        currentSongPreview = null;
        if (listNameInput) listNameInput.value = '';
        if (spotifyLinkInput) spotifyLinkInput.value = '';
        if (listNameError) listNameError.style.display = 'none';
        if (songPreview) songPreview.style.display = 'none';
        if (songsList) songsList.innerHTML = '';
        if (songCounter) songCounter.textContent = '0';
        if (saveListBtn) saveListBtn.style.display = 'none';
    }

    // Validar nombre de lista
    async function validateListName(name) {
        if (!name || name.trim() === '') {
            return { valid: false, error: 'Por favor ingresa un nombre para la lista' };
        }

        // Verificar si existe en Firestore
        if (window.firebaseDb && currentUser && !currentUser.isGuest) {
            try {
                const listsRef = window.firestoreCollection(window.firebaseDb, 'customLists');
                const q = window.firestoreQuery.query(
                    listsRef,
                    window.firestoreQuery.where('userId', '==', currentUser.uid),
                    window.firestoreQuery.where('name', '==', name.trim())
                );
                const querySnapshot = await window.firestoreGetDocs(q);

                if (!querySnapshot.empty) {
                    return { valid: false, error: 'Ya existe una lista con este nombre' };
                }
            } catch (error) {
                console.error('Error al validar nombre:', error);
            }
        }

        return { valid: true };
    }

    // Escanear QR
    if (scanQrBtn) {
        scanQrBtn.addEventListener('click', async () => {
            try {
                qrScannerModal.style.display = 'flex';
                qrResult.style.display = 'none';

                // Solicitar acceso a la cámara
                qrStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });

                qrVideo.srcObject = qrStream;
                qrVideo.play();

                // Iniciar escaneo
                const canvasContext = qrCanvas.getContext('2d');

                qrScanInterval = setInterval(() => {
                    if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
                        qrCanvas.width = qrVideo.videoWidth;
                        qrCanvas.height = qrVideo.videoHeight;
                        canvasContext.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);

                        const imageData = canvasContext.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height);

                        if (code) {
                            // QR detectado
                            console.log('QR detectado:', code.data);

                            // Aceptar cualquier QR - rellenar el campo
                            spotifyLinkInput.value = code.data;
                            qrResult.textContent = '✅ QR detectado correctamente';
                            qrResult.style.background = '#28a745';
                            qrResult.style.display = 'block';

                            // Cerrar scanner después de 1 segundo
                            setTimeout(() => {
                                stopQrScanner();
                                qrScannerModal.style.display = 'none';
                            }, 1000);
                        }
                    }
                }, 100);

            } catch (error) {
                console.error('Error al acceder a la cámara:', error);
                alert('No se pudo acceder a la cámara. Verifica los permisos.');
                stopQrScanner();
                qrScannerModal.style.display = 'none';
            }
        });
    }

    function stopQrScanner() {
        if (qrScanInterval) {
            clearInterval(qrScanInterval);
            qrScanInterval = null;
        }
        if (qrStream) {
            qrStream.getTracks().forEach(track => track.stop());
            qrStream = null;
        }
        if (qrVideo) {
            qrVideo.srcObject = null;
        }
    }

    if (closeQrScanner) {
        closeQrScanner.addEventListener('click', () => {
            stopQrScanner();
            qrScannerModal.style.display = 'none';
        });

        qrScannerModal.addEventListener('click', (e) => {
            if (e.target === qrScannerModal) {
                stopQrScanner();
                qrScannerModal.style.display = 'none';
            }
        });
    }

    // Cargar datos de Spotify
    if (loadSongBtn) {
        loadSongBtn.addEventListener('click', async () => {
            const link = spotifyLinkInput.value.trim();

            if (!link) {
                alert('Por favor ingresa un link de Spotify');
                return;
            }

            // Validar que sea un link de Spotify
            if (!link.includes('open.spotify.com/track/')) {
                alert('Por favor ingresa un link válido de Spotify');
                return;
            }

            loadSongBtn.disabled = true;
            loadSongBtn.textContent = '⏳ Cargando...';

            try {
                const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(link)}`);
                const data = await response.json();

                // Extraer información
                const title = data.title || 'Desconocido';
                const [songName, artistName] = title.split(' · ') || [title, 'Desconocido'];

                currentSongPreview = {
                    name: songName,
                    artist: artistName,
                    spotifyUrl: link,
                    year: new Date().getFullYear() // Por ahora usamos año actual, luego lo mejoramos
                };

                // Mostrar preview
                songData.innerHTML = `
                    <p><strong>🎵 Canción:</strong> ${currentSongPreview.name}</p>
                    <p><strong>👤 Artista:</strong> ${currentSongPreview.artist}</p>
                    <p><strong>📅 Año:</strong> ${currentSongPreview.year}</p>
                    <p><strong>🔗 Link:</strong> <a href="${currentSongPreview.spotifyUrl}" target="_blank">Ver en Spotify</a></p>
                `;
                songPreview.style.display = 'block';
            } catch (error) {
                console.error('Error al cargar canción:', error);
                alert('Error al cargar la canción. Verifica el link.');
            } finally {
                loadSongBtn.disabled = false;
                loadSongBtn.textContent = '🔍 Cargar';
            }
        });
    }

    // Agregar canción a la lista
    if (addToListBtn) {
        addToListBtn.addEventListener('click', async () => {
            // Validar nombre de lista
            const listName = listNameInput.value.trim();

            if (!currentListName) {
                const validation = await validateListName(listName);
                if (!validation.valid) {
                    listNameError.textContent = validation.error;
                    listNameError.style.display = 'block';
                    listNameInput.focus();
                    return;
                }
                currentListName = listName;
                listNameInput.disabled = true;
                listNameError.style.display = 'none';
            }

            if (!currentSongPreview) {
                alert('Por favor carga una canción primero');
                return;
            }

            // Verificar que no esté duplicada
            const isDuplicate = currentSongs.some(s => s.spotifyUrl === currentSongPreview.spotifyUrl);
            if (isDuplicate) {
                alert('Esta canción ya está en la lista');
                return;
            }

            // Agregar a la lista actual
            currentSongs.push({ ...currentSongPreview });

            // Actualizar UI
            updateSongsList();

            // Limpiar preview
            spotifyLinkInput.value = '';
            songPreview.style.display = 'none';
            currentSongPreview = null;

            // Mostrar botón de guardar
            saveListBtn.style.display = 'block';
        });
    }

    function updateSongsList() {
        if (!songsList || !songCounter) return;

        songCounter.textContent = currentSongs.length;

        if (currentSongs.length === 0) {
            songsList.innerHTML = '<p style="color: #999;">No hay canciones agregadas</p>';
            return;
        }

        songsList.innerHTML = currentSongs.map((song, index) => `
            <div class="song-item" style="padding: 10px; margin: 5px 0; background: #f5f5f5; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${index + 1}. ${song.name}</strong><br>
                    <small>${song.artist} (${song.year})</small>
                </div>
                <button class="remove-song-btn" data-index="${index}" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">❌</button>
            </div>
        `).join('');

        // Agregar listeners para eliminar
        document.querySelectorAll('.remove-song-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                currentSongs.splice(index, 1);
                updateSongsList();
                if (currentSongs.length === 0) {
                    saveListBtn.style.display = 'none';
                }
            });
        });
    }

    // Guardar lista en Firestore
    if (saveListBtn) {
        saveListBtn.addEventListener('click', async () => {
            if (currentSongs.length === 0) {
                alert('Agrega al menos una canción a la lista');
                return;
            }

            if (!currentUser || currentUser.isGuest) {
                alert('Debes estar registrado para crear listas');
                return;
            }

            saveListBtn.disabled = true;
            saveListBtn.textContent = '⏳ Guardando...';

            try {
                const listData = {
                    name: currentListName,
                    userId: currentUser.uid,
                    userName: currentUser.displayName || 'Usuario',
                    songs: currentSongs,
                    songCount: currentSongs.length,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                const listsRef = window.firestoreCollection(window.firebaseDb, 'customLists');
                await window.firestoreAddDoc(listsRef, listData);

                alert(`✅ Lista "${currentListName}" guardada exitosamente con ${currentSongs.length} canciones`);
                createListModal.style.display = 'none';
                resetCreateListForm();
            } catch (error) {
                console.error('Error al guardar lista:', error);
                alert('Error al guardar la lista. Intenta nuevamente.');
            } finally {
                saveListBtn.disabled = false;
                saveListBtn.textContent = '💾 Guardar Lista';
            }
        });
    }

    if (closeCreateListModal && createListModal) {
        closeCreateListModal.addEventListener('click', () => {
            createListModal.style.display = 'none';
            game.resumeTimer();
        });

        createListModal.addEventListener('click', (e) => {
            if (e.target === createListModal) {
                createListModal.style.display = 'none';
                game.resumeTimer();
            }
        });
    }

    // Configurar modal de Instrucciones
    const instructionsModal = document.getElementById('instructionsModal');
    const closeInstructionsModal = document.getElementById('closeInstructionsModal');
    const btnInstructionsSelection = document.getElementById('btnInstructionsSelection');
    const btnInstructionsReady = document.getElementById('btnInstructionsReady');

    function openInstructions() {
        instructionsModal.style.display = 'flex';
    }

    function closeInstructions() {
        instructionsModal.style.display = 'none';
    }

    if (btnInstructionsSelection) {
        btnInstructionsSelection.addEventListener('click', openInstructions);
    }

    if (btnInstructionsReady) {
        btnInstructionsReady.addEventListener('click', openInstructions);
    }

    if (closeInstructionsModal) {
        closeInstructionsModal.addEventListener('click', closeInstructions);
    }

    if (instructionsModal) {
        instructionsModal.addEventListener('click', (e) => {
            if (e.target === instructionsModal) {
                closeInstructions();
            }
        });
    }

    // Configurar botón de logout del menú
    const menuLogout = document.getElementById('menuLogout');
    if (menuLogout) {
        menuLogout.addEventListener('click', async () => {
            try {
                await window.firebaseSignOut(window.firebaseAuth);
                console.log('Logout exitoso desde menú');
                location.reload();
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                alert('Error al cerrar sesión: ' + error.message);
            }
        });
    }

    // Configurar menú hamburguesa
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const menuDropdown = document.getElementById('menuDropdown');

    if (hamburgerMenu && menuDropdown) {
        hamburgerMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menuDropdown.style.display === 'flex';
            menuDropdown.style.display = isOpen ? 'none' : 'flex';

            // Animación de transición
            if (!isOpen) {
                hamburgerMenu.classList.add('menu-open');
                setTimeout(() => {
                    hamburgerMenu.textContent = '×';
                    hamburgerMenu.classList.remove('menu-open');
                    hamburgerMenu.classList.add('is-x');
                }, 150);
            } else {
                hamburgerMenu.classList.add('menu-open');
                setTimeout(() => {
                    hamburgerMenu.textContent = '☰';
                    hamburgerMenu.classList.remove('menu-open');
                    hamburgerMenu.classList.remove('is-x');
                }, 150);
            }

            // Pausar/reanudar el timer al abrir/cerrar el menú
            if (!isOpen) {
                game.pauseTimer();
            } else {
                game.resumeTimer();
            }
        });
    }


    // Cerrar menú al hacer clic fuera del contenido
    if (menuDropdown) {
        menuDropdown.addEventListener('click', (e) => {
            if (e.target === menuDropdown) {
                menuDropdown.style.display = 'none';
                hamburgerMenu.textContent = '☰';

                // Reanudar timer al cerrar menú
                game.resumeTimer();
            }
        });
    }
});

// Variable para estado de debug
let debugEnabled = false;

function toggleDebugMode() {
    debugEnabled = !debugEnabled;
    const style = document.createElement('style');
    style.id = 'debug-style';

    if (debugEnabled) {
        // Mostrar años en cartas, labels y bordes de contenedores
        style.innerHTML = `
            .debug-year {
                display: block !important;
            }
            .game-board::before,
            .qr-selection-area::before,
            .qr-cards-grid::before,
            .timeline-container::before,
            .timeline-years::before {
                display: block !important;
            }
            .game-board {
                border-color: purple !important;
            }
            .qr-selection-area {
                border-color: blue !important;
            }
            .qr-cards-grid {
                border-color: green !important;
            }
            .timeline-container {
                border-color: red !important;
            }
            .timeline-years {
                border-color: orange !important;
            }
        `;
        document.head.appendChild(style);
    } else {
        // Ocultar debug
        const existingStyle = document.getElementById('debug-style');
        if (existingStyle) {
            existingStyle.remove();
        }
    }
}

// Configurar Firebase Authentication
function setupFirebaseAuth() {
    const btnGoogleLogin = document.getElementById('btnGoogleLogin');
    const btnGuestLogin = document.getElementById('btnGuestLogin');
    const btnLogout = document.getElementById('btnLogout');
    const loginModal = document.getElementById('loginModal');
    const loginUserInfo = document.getElementById('loginUserInfo');
    const userName = document.getElementById('userName');

    // Listener para cambios en el estado de autenticación
    window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
        if (user) {
            // Usuario logueado
            currentUser = user;
            isGuestMode = false;
            console.log('Usuario logueado:', user.displayName);

            // Ocultar botones de login y mostrar info de usuario
            if (btnGoogleLogin) btnGoogleLogin.style.display = 'none';
            if (btnGuestLogin) btnGuestLogin.style.display = 'none';
            if (loginUserInfo) loginUserInfo.style.display = 'block';
            if (userName) userName.textContent = user.displayName;

            // Crear/actualizar usuario en Firestore
            createOrUpdateUser(user);

            // Esperar 1 segundo y luego cerrar modal de login e iniciar juego
            setTimeout(() => {
                if (loginModal) loginModal.style.display = 'none';
                if (!game) {
                    game = new MusikquizkampenGame();
                }
            }, 1000);
        } else {
            // Usuario no logueado
            currentUser = null;
            console.log('Usuario no logueado');

            // Mostrar botones de login y ocultar info de usuario
            if (btnGoogleLogin) btnGoogleLogin.style.display = 'flex';
            if (btnGuestLogin) btnGuestLogin.style.display = 'block';
            if (loginUserInfo) loginUserInfo.style.display = 'none';
        }
    });

    // Botón de login con Google
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', async () => {
            try {
                const result = await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider);
                console.log('Login exitoso:', result.user.displayName);
            } catch (error) {
                console.error('Error en login:', error);
                alert('Error al iniciar sesión: ' + error.message);
            }
        });
    }

    // Botón de login como invitado
    if (btnGuestLogin) {
        btnGuestLogin.addEventListener('click', () => {
            isGuestMode = true;
            currentUser = { displayName: 'Invitado', isGuest: true };
            console.log('Jugando como invitado');

            // Cerrar modal de login e iniciar juego
            if (loginModal) loginModal.style.display = 'none';
            if (!game) {
                game = new MusikquizkampenGame();
            }
        });
    }

    // Botón de logout
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await window.firebaseSignOut(window.firebaseAuth);
                console.log('Logout exitoso');
                // Recargar la página para volver al login
                location.reload();
            } catch (error) {
                console.error('Error en logout:', error);
            }
        });
    }
}

// Funciones de Firestore para manejo de usuarios y estadísticas
async function createOrUpdateUser(user) {
    if (!user || !window.firebaseDb) {
        console.log('⚠️ No se puede crear usuario:', { user: !!user, db: !!window.firebaseDb });
        return;
    }

    console.log('🔵 Intentando crear/actualizar usuario:', user.displayName);

    try {
        const userRef = window.firestoreDoc(window.firebaseDb, 'users', user.uid);
        const userSnap = await window.firestoreGetDoc(userRef);

        if (!userSnap.exists()) {
            // Usuario nuevo - crear documento
            console.log('📝 Creando nuevo usuario en Firestore...');
            await window.firestoreSetDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: new Date().toISOString(),
                totalGames: 0,
                totalPoints: 0,
                games1P: 0,
                points1P: 0,
                games2P: 0,
                points2P: 0,
                games3P: 0,
                points3P: 0,
                games4P: 0,
                points4P: 0,
                lastPlayed: null
            });
            console.log('✅ Usuario creado en Firestore');
        } else {
            // Usuario existente - actualizar info básica si cambió
            console.log('📝 Actualizando usuario existente en Firestore...');
            await window.firestoreUpdateDoc(userRef, {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
            });
            console.log('✅ Usuario actualizado en Firestore');
        }
    } catch (error) {
        console.error('❌ Error al crear/actualizar usuario:', error);
        console.error('Error completo:', error.message, error.code);
    }
}

async function saveGameStats(points, playerCount = 1, players = []) {
    console.log('🎮 saveGameStats llamado:', {
        points,
        playerCount,
        players,
        currentUser: !!currentUser,
        isGuestMode,
        db: !!window.firebaseDb
    });

    if (!currentUser || isGuestMode || !window.firebaseDb) {
        console.log('⚠️ No se guardan stats:', {
            hasUser: !!currentUser,
            isGuest: isGuestMode,
            hasDb: !!window.firebaseDb
        });
        return;
    }

    try {
        console.log('📊 Guardando estadísticas para usuario:', currentUser.displayName);

        // Actualizar stats del usuario
        const userRef = window.firestoreDoc(window.firebaseDb, 'users', currentUser.uid);
        const updateData = {
            totalGames: window.firestoreIncrement(1),
            totalPoints: window.firestoreIncrement(points),
            lastPlayed: new Date().toISOString()
        };

        await window.firestoreUpdateDoc(userRef, updateData);

        // Guardar el juego completo en la colección "games"
        const { collection, addDoc } = window.firestoreQuery;
        const gamesRef = collection(window.firebaseDb, 'games');

        const gameData = {
            userId: currentUser.uid,
            userName: currentUser.displayName,
            userPhoto: currentUser.photoURL,
            playerCount: playerCount,
            timestamp: new Date().toISOString(),
            players: players.map(p => ({
                name: p.name,
                score: p.score
            }))
        };

        await addDoc(gamesRef, gameData);

        console.log('✅ Estadísticas y juego guardados:', { points, playerCount, timestamp: new Date() });
    } catch (error) {
        console.error('❌ Error al guardar estadísticas:', error);
        console.error('Error completo:', error.message, error.code);
    }
}

async function loadUserStats() {
    if (!currentUser || isGuestMode || !window.firebaseDb) return null;

    try {
        const userRef = window.firestoreDoc(window.firebaseDb, 'users', currentUser.uid);
        const userSnap = await window.firestoreGetDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            return {
                totalGames: data.totalGames || 0,
                totalPoints: data.totalPoints || 0,
                avgPoints: data.totalGames > 0 ? Math.round(data.totalPoints / data.totalGames) : 0
            };
        }
    } catch (error) {
        console.error('❌ Error al cargar estadísticas:', error);
    }

    return null;
}

async function loadRanking() {
    if (!window.firebaseDb) return [];

    try {
        const { collection, query, orderBy, limit } = window.firestoreQuery;
        const gamesRef = collection(window.firebaseDb, 'games');

        // Obtener los últimos 50 juegos ordenados por timestamp
        const q = query(gamesRef, orderBy('timestamp', 'desc'), limit(50));
        const querySnapshot = await window.firestoreGetDocs(q);

        const games = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            games.push({
                id: doc.id,
                userId: data.userId,
                userName: data.userName,
                userPhoto: data.userPhoto,
                playerCount: data.playerCount,
                timestamp: data.timestamp,
                players: data.players || []
            });
        });

        return games;
    } catch (error) {
        console.error('❌ Error al cargar ranking:', error);
        return [];
    }
}
