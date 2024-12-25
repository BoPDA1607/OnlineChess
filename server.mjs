import WebSocket from './public/libs/web-socket-lib/index.js';
import http from 'http';
import fs from 'fs';
import url from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/') {
        // Serve index.html
        fs.readFile('index.html', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (pathname === '/game.html') {
        const code = parsedUrl.query.code;

        if (!code) {
            // Redirect to index.html if 'code' is missing or invalid
            res.writeHead(302, { Location: '/' });
            res.end();
        } else {
            // Serve game.html
            fs.readFile('game.html', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error loading game.html');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data);
                }
            });
        }
    } else {
        // Serve static files from the public directory
        const filePath = path.join(__dirname, 'public', pathname);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                const ext = path.extname(filePath).toLowerCase();
                const contentType = ext === '.js' ? 'application/javascript' :
                                    ext === '.css' ? 'text/css' : 'text/plain';
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        });
    }
});


const wss = new WebSocket.Server({ server });
const games = {}; // Store game states by game code

wss.on('connection', (socket) => {
    console.log('Client connected to server');

    socket.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received message:', data);

        if (data.type === 'create_game') {
            const { codeGame } = data;
            console.log(`Player create game: ${codeGame}`);

            // Create or add opponent to the game
            if (!games[codeGame]) {
                games[codeGame] = {
                    player1: { socket: socket, surrendered: false, drawRequest: false },
                    player2: { socket: null, surrendered: false, drawRequest: false },
                };
                console.log(`Game ${codeGame} created; waiting for opponent`);
                socket.send(JSON.stringify({ type: 'waiting_for_opponent' }));
            } else {
                socket.send(JSON.stringify({ type: 'game_already_exists' }));
            }
        } else if (data.type === 'join_game') {
            const { codeGame } = data;
            console.log(`Player joined game: ${codeGame}`);

            if(!games[codeGame]) {
                socket.send(JSON.stringify({ type: 'game_not_created' }));
            } else if (!games[codeGame].player2.socket) {
                games[codeGame].player2.socket = socket;
                console.log(`Opponent joined game ${codeGame}`);

                // Notify both players
                games[codeGame].player1.socket.send(JSON.stringify({ type: 'opponent_connected' }));
                games[codeGame].player2.socket.send(JSON.stringify({ type: 'opponent_connected' }));
            } else {
                socket.send(JSON.stringify({ type: 'game_full' }));
            }
        } else if (data.type === 'move') {
            const { codeGame, color, move } = data;
            console.log(`Player ${color} moved in game ${codeGame}: ${move}`);

            // Send the move to the opponent
            if (games[codeGame].player1.socket === socket) {
                console.log('Sending move to player 1');
                games[codeGame].player2.socket.send(JSON.stringify({ type: 'move', move }));
            } else if (games[codeGame].player2.socket === socket) {
                console.log('Sending move to player 2');
                games[codeGame].player1.socket.send(JSON.stringify({ type: 'move', move }));
            }
        } else if (data.type === 'chat_message') {
            const { codeGame, message } = data;
            console.log(`Player sent chat message in game ${codeGame}: ${message}`);

            // Send the chat message to the opponent
            if (games[codeGame].player1.socket === socket) {
                games[codeGame].player2.socket.send(JSON.stringify({ type: 'chat_message', message }));
            } else if (games[codeGame].player2.socket === socket) {
                games[codeGame].player1.socket.send(JSON.stringify({ type: 'chat_message', message }));
            }
        } else if (data.type === 'surrender') {
            const { codeGame } = data;
            // Notify the opponent
            if (games[codeGame].player1.socket === socket) {
                games[codeGame].player2.surrendered = true;
                games[codeGame].player2.socket.send(JSON.stringify({ type: 'opponent_surrendered' }));
            } else if (games[codeGame].player2.socket === socket) {
                games[codeGame].player1.surrendered = true;
                games[codeGame].player1.socket.send(JSON.stringify({ type: 'opponent_surrendered' }));
            }
        } else if (data.type === 'draw_request') {
            const { codeGame } = data
            // Notify the opponent
            if (games[codeGame].player1.socket === socket) {
                games[codeGame].player2.socket.send(JSON.stringify({ type: 'draw_request', codeGame }));
            } else if (games[codeGame].player2.socket === socket) {
                games[codeGame].player1.socket.send(JSON.stringify({ type: 'draw_request', codeGame }));
            }
        } else if (data.type === 'draw_request_agree') {
            const { codeGame } = data;
            // Notify the opponent
            if (games[codeGame].player1.socket === socket) {
                games[codeGame].player2.socket.send(JSON.stringify({ type: 'draw_request_agree' }));
                games[codeGame].player2.drawRequest = true;
            } else if (games[codeGame].player2.socket === socket) {
                games[codeGame].player1.socket.send(JSON.stringify({ type: 'draw_request_agree' }));
                games[codeGame].player1.drawRequest = true;
            }
        } else if (data.type === 'draw_request_disagree') {
            const { codeGame } = data;
            // Notify the opponent
            if (games[codeGame].player1.socket === socket) {
                games[codeGame].player2.socket.send(JSON.stringify({ type: 'draw_request_disagree' }));
            } else if (games[codeGame].player2.socket === socket) {
                games[codeGame].player1.socket.send(JSON.stringify({ type: 'draw_request_disagree' }));
            } 
        } else if (data.type === 'end') {
            const { codeGame } = data;
            // Notify the opponent
            if (games[codeGame].player1.socket === socket) {
                games[codeGame].player2.socket.send(JSON.stringify({ type: 'opponent_end' }));
            } else if (games[codeGame].player2.socket === socket) {
                games[codeGame].player1.socket.send(JSON.stringify({ type: 'opponent_end' }));
            }
        } else if (data.type === 'draw_stale_mate') {
            const { codeGame } = data;
            // Notify the opponent
            if (games[codeGame].player1.socket === socket) {
                games[codeGame].player2.socket.send(JSON.stringify({ type: 'draw_stale_mate' }));
            } else if (games[codeGame].player2.socket === socket) {
                games[codeGame].player1.socket.send(JSON.stringify({ type: 'draw_stale_mate' }));
            }
        }
    });

    socket.on('close', () => {
        console.log('Client disconnected');
    
        // Check which game the disconnected client belongs to
        Object.keys(games).forEach((codeGame) => {
            const game = games[codeGame];
    
            if (game.player1.socket === socket && !game.player2.surrendered && !game.player2.drawRequest) {
                console.log(`Player 1 disconnected from game ${codeGame}`);
    
                // Notify player 2 (the opponent) if they exist
                if (game.player2.socket) {
                    game.player2.socket.send(
                        JSON.stringify({
                            type: 'opponent_disconnected',
                            message: 'Opponent disconnected. Redirecting to the home screen.',
                        })
                    );
                }
    
                // Remove the game
                delete games[codeGame];
                console.log(`Game ${codeGame} removed`);
            } else if (game.player2.socket === socket && !game.player1.surrendered && !game.player1.drawRequest) {
                console.log(`Player 2 disconnected from game ${codeGame}`);
    
                // Notify player 1 (the opponent) if they exist
                if (game.player1.socket) {
                    game.player1.socket.send(
                        JSON.stringify({
                            type: 'opponent_disconnected',
                            message: 'Opponent disconnected. Redirecting to the home screen.',
                        })
                    );
                }
    
                // Remove the game
                delete games[codeGame];
                console.log(`Game ${codeGame} removed`);
            }
        });
    });
});

server.listen(8080, () => {
    console.log('Server is listening on http://localhost:8080');
});