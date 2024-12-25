import {Game} from './class/Game.js' 

let gameInstance;

export function startGame(codeGame, color, socket) {
    console.log('Starting game for player with code:', codeGame);
    console.log('Player color:', color);

    gameInstance = new Game(codeGame, color, socket);
    gameInstance.start();

    // Set up the socket message handler for moves
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Message received from server:', data);

        if (data.type === 'move') {
            console.log('Move received from opponent:', data.move);
            // Pass the opponent's move to the game instance
            gameInstance.receiveMove(data.move);
        } else if(data.type === 'opponent_disconnected') {
            alert('Opponent disconnected');
            window.location.href = '/';
        }  else if (data.type === 'chat_message') {
            const chatMessages = document.getElementById('chatArea');
            chatMessages.innerHTML += `
                <div class="message opponent-message">
                    ${data.message}
                </div>
            `;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else if (data.type === 'opponent_surrendered') {
            alert('Opponent surrendered! You win!');
            window.location.href = '/';
        } else if (data.type === 'draw_request') {
            const { codeGame } = data;
            const userConfirmed = confirm('Opponent requested a game draw. Do you agree?');
            if (userConfirmed) {
                alert('You agreed to a draw! The game is a draw.');
                socket.send(JSON.stringify({ type: 'draw_request_agree', codeGame }));
                window.location.href = '/';
            } else {
                socket.send(JSON.stringify({ type: 'draw_request_disagree', codeGame }));
            }
        } else if (data.type === 'draw_request_agree') {
            alert('Opponent agreed to a draw! The game is a draw.');
            window.location.href = '/';
        } else if (data.type === 'draw_request_disagree') {
            alert('Opponent disagreed to a draw!');
        } else if (data.type === 'opponent_end') {
            alert('You win! You checkmated your opponent!');
            const surrender = document.getElementById('surrender-btn');
            const draw = document.getElementById('draw-btn');

            surrender.replaceWith(surrender.cloneNode(true))
            draw.replaceWith(draw.cloneNode(true))
        } else if (data.type === 'draw_stale_mate') {
            alert('The game is a draw.');
            const surrender = document.getElementById('surrender-btn');
            const draw = document.getElementById('draw-btn');

            surrender.replaceWith(surrender.cloneNode(true))
            draw.replaceWith(draw.cloneNode(true))
        }
    };

    socket.onerror = (error) => {
        console.error(`WebSocket error: ${error}`);
    };
}

export function getGameInstance() {
    return gameInstance;
}