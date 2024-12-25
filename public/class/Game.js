import CD from '../CD.js'
import {Board} from './Board.js'
import {Player} from './Player.js';

const soundMoveEffect = new Audio('/sound/move.mp3')
const soundCaptureEffect = new Audio('/sound/capture.mp3')

export class Game {
    constructor(codeGame, color, socket) {
        this.stage = new Konva.Stage({
            container: 'container',
            width: CD.WIDTH,
            height: CD.HEIGHT
        });
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        this.board = new Board(0, 0, this.layer);
        this.board.draw();
        this.codeGame = codeGame;
        this.socket = socket;
        this.color = color;
        this.checkAppoint = 0
        this.selectedAppointPiece = {piece: undefined, startPos: undefined, newPos: undefined}

        this.boardHistory = [];
        
        this.currentPlayer = new Player(color, this.stage, this.layer);
        this.fiftyMoveCounter = 0;
    }
    start() {
        this.currentPlayer.placePieces()
        // delay 2s
        setTimeout(() => {
            this.setStartTurn()
        }, 2000)
        this.playing()
    }
    setDraggableOfPieces(draggable) {
        this.currentPlayer.ourPawnPieces.forEach(piece => {
            piece.setDraggable(draggable)
        })
        this.currentPlayer.ourBackRowPieces.forEach(piece => {
            piece.setDraggable(draggable)
        })
    }
    setStartTurn() {
        if(this.currentPlayer.turn) {
            this.setDraggableOfPieces(true)
        } else {
            this.setDraggableOfPieces(false)
        }
    }
    playing() {
        this.stage.on('mouseup',() => {
            if(!this.currentPlayer.turn) return
            //Kiểm tra phong tốt
            if(this.checkAppoint === 1) {
                var appointValue = "";
                this.selectedAppointPiece.piece.imageNode.on('click', () => {
                    const mousePos = this.stage.getPointerPosition();
                    var isClickOnImage = mousePos.x >= this.selectedAppointPiece.piece.imageNode.x() && mousePos.x <= this.selectedAppointPiece.piece.imageNode.x() + 60;
                    if(isClickOnImage && (mousePos.y >= this.selectedAppointPiece.piece.imageNode.y() && mousePos.y <= this.selectedAppointPiece.piece.imageNode.y() + 60)) {
                        appointValue = "queen";
                    } else if(isClickOnImage && (mousePos.y >= this.selectedAppointPiece.piece.imageNode.y() + 60 && mousePos.y <= this.selectedAppointPiece.piece.imageNode.y() + 120)) {
                        appointValue = "bishop";
                    } else if(isClickOnImage && (mousePos.y >= this.selectedAppointPiece.piece.imageNode.y() + 120 && mousePos.y <= this.selectedAppointPiece.piece.imageNode.y() + 180)) {
                        appointValue = "knight";
                    } else if(isClickOnImage && (mousePos.y >= this.selectedAppointPiece.piece.imageNode.y() + 180 && mousePos.y <= this.selectedAppointPiece.piece.imageNode.y() + 240)) {
                        appointValue = "rook";
                    }
                    if(appointValue != "") {
                        this.currentPlayer.appointPawn(this.selectedAppointPiece.piece, appointValue, this.currentPlayer.ourBackRowPieces, this.currentPlayer.ourPawnPieces, this.currentPlayer.isBlack, this.selectedAppointPiece.newPos)
                        this.checkAppoint = 0
                        var moveData = this.selectedAppointPiece.startPos + '/' + this.selectedAppointPiece.newPos + '/' + appointValue
                        soundMoveEffect.play()
                        this.sendMove(moveData)
                        this.currentPlayer.turn = false
                        this.setDraggableOfPieces(false)
                        this.selectedAppointPiece = {piece: undefined, startPos: undefined, newPos: undefined}
                        if(this.currentPlayer.isThreefoldRepetition(this.boardHistory)) {
                            setTimeout(() => {
                                this.draw()
                            }, 100)
                        }
                    }
                });
                return;
            }
            var mousePos = this.stage.getPointerPosition();
            var newX = parseInt(mousePos.x / 60)
            var newY = parseInt(mousePos.y / 60)
            var newPos = newY * 8 + newX
            // Lấy ra quân cờ của chúng ta nếu chúng ta chọn
            var piece1 = this.currentPlayer.checkSelectedPieces(this.currentPlayer.ourPawnPieces)
            var piece2 = this.currentPlayer.checkSelectedPieces(this.currentPlayer.ourBackRowPieces)
            var returnOurPiece = undefined
            if(piece1 != null) {
                returnOurPiece = piece1
            } else if(piece2 != null) {
                returnOurPiece = piece2
            }
            if(returnOurPiece != undefined) {
                returnOurPiece.isSelected = false
            } else {
                return
            }
            if(returnOurPiece.id === 6 && Math.abs(returnOurPiece.x - newX) == 2 && returnOurPiece.y == newY) {
                var isKingSide = returnOurPiece.x - newX > 0 ? (this.currentPlayer.isBlack == 1 ? true : false) : (this.currentPlayer.isBlack == 1 ? false : true)
                var returnRook = this.currentPlayer.getRook(isKingSide, true, false)
                var kingPos = returnOurPiece.pos
                var move = returnOurPiece.move(newX, newY, this.currentPlayer.boardMem, returnRook, this.currentPlayer)
                if(move) {
                    soundMoveEffect.play()
                    var moveData = kingPos + '/' + newPos + '/' + 'castle'
                    this.sendMove(moveData)
                    this.currentPlayer.turn = false
                    this.setDraggableOfPieces(false)

                    this.board.resetSquareColor();
                    const offset = isKingSide ? -1 : 1;
                    const direction = this.currentPlayer.isBlack == 0 ? 1 : -1;

                    this.board.changeSquareColorWithBlend(kingPos, '#FFFF00');
                    this.board.changeSquareColorWithBlend(newPos, '#FFFF00');
                    this.board.changeSquareColorWithBlend(newPos + offset * direction, '#FFFF00');

                } else {
                    returnOurPiece.invalidMove()
                }
                return
            }
            // Lấy ra quân cờ của đối thủ nếu quân cờ đó bị ăn
            var opponentPawnPiece = this.currentPlayer.opponentPawnPieces.find(piece => piece.pos === newPos)
            var opponentBackRowPiece = this.currentPlayer.opponentBackRowPieces.find(piece => piece.pos === newPos)
            var index1 = undefined, index2 = undefined;
            var returnOpponentPiece
            if(opponentPawnPiece === undefined && opponentBackRowPiece === undefined) {
                returnOpponentPiece = undefined
            } else if(opponentPawnPiece === undefined) {
                index1 = this.currentPlayer.opponentBackRowPieces.indexOf(opponentBackRowPiece)
                returnOpponentPiece = opponentBackRowPiece
            } else {
                index2 = this.currentPlayer.opponentPawnPieces.indexOf(opponentPawnPiece)
                returnOpponentPiece = opponentPawnPiece
            }
            // Kiểm tra xem có phải là nước đi hợp lệ không trước khi gửi đi
            if(returnOurPiece.pos != newPos) {
                var move = returnOurPiece.move(newX, newY, this.currentPlayer.boardMem, returnOpponentPiece, this.currentPlayer)
                if(move != -1 && move != newPos && move != undefined) {
                    if(index1 != undefined) {
                        this.currentPlayer.opponentBackRowPieces.splice(index1, 1)
                    } else if(index2 != undefined) {
                        this.currentPlayer.opponentPawnPieces.splice(index2, 1)
                    }

                    var moveData = move + '/' + newPos + '/'

                    this.board.resetSquareColor();
                    this.board.changeSquareColorWithBlend(move, '#FFFF00');
                    this.board.changeSquareColorWithBlend(newPos, '#FFFF00');

                    if(returnOurPiece.id === 1 && parseInt(returnOurPiece.pos / 8) == 0) {
                        this.fiftyMoveCounter = 0;
                        returnOurPiece.showPromotionImage();
                        this.checkAppoint = 1
                        this.selectedAppointPiece.piece = returnOurPiece
                        this.selectedAppointPiece.startPos = move
                        this.selectedAppointPiece.newPos = newPos
                    }

                    if(this.checkAppoint === 0) {
                        if (returnOpponentPiece != undefined) {
                            this.fiftyMoveCounter = 0;
                            soundCaptureEffect.play()
                        } else {
                            if (returnOurPiece.id === 1) {
                                this.fiftyMoveCounter = 0;
                            } else {
                                this.fiftyMoveCounter++;
                            }
                            soundMoveEffect.play()
                        }
                        this.sendMove(moveData)
                        this.currentPlayer.turn = false
                        this.setDraggableOfPieces(false)
                        if (this.fiftyMoveCounter >= 50) {
                            setTimeout(() => {
                                this.draw()
                            }, 100)
                        } else if (this.currentPlayer.isInsufficientMaterial()) {
                            setTimeout(() => {
                                this.draw()
                            }, 100)
                        } else if(this.currentPlayer.isThreefoldRepetition(this.boardHistory)) {
                            setTimeout(() => {
                                this.draw()
                            }, 100)
                        }
                    }
                }
            } else {
                returnOurPiece.invalidMove()
            }
        })
    }
    updateMove(startPos, endPos) {
        var oldX = -(startPos % 8 + 0.5 - 4) + 4 - 0.5
        var oldY = -(parseInt(startPos / 8) + 0.5 - 4) + 4 - 0.5
        var oldPos = oldY * 8 + oldX

        var newX = -(endPos % 8 + 0.5 - 4) + 4 - 0.5
        var newY = -(parseInt(endPos / 8) + 0.5 - 4) + 4 - 0.5
        var newPos = newY * 8 + newX

        return {oldPos, newPos, newX, newY}
    }
    sendMove(moveData) {
        // Send the move through the WebSocket
        this.socket.send(JSON.stringify({
            type: 'move',
            codeGame: this.codeGame,
            color: this.color,
            move: moveData,
        }));
    }
    receiveMove(moveData) {
        // Handle the opponent's move (update the board, etc.)
        var startPos = moveData.split('/')[0]
        var endPos = moveData.split('/')[1]
        var additionCondition = moveData.split('/')[2]

        var {oldPos, newPos, newX, newY} = this.updateMove(startPos, endPos)

        var opponentPawnPiece = this.currentPlayer.opponentPawnPieces.find(piece => piece.pos === oldPos)
        var opponentBackRowPiece = this.currentPlayer.opponentBackRowPieces.find(piece => piece.pos === oldPos)
        var ourPawnPiece = this.currentPlayer.ourPawnPieces.find(piece => piece.pos === newPos)
        var ourBackRowPiece = this.currentPlayer.ourBackRowPieces.find(piece => piece.pos === newPos)
        var index1 = undefined, index2 = undefined;

        var returnOpponentPiece
        if(opponentPawnPiece === undefined && opponentBackRowPiece === undefined) {
            returnOpponentPiece = undefined
        } else if(opponentPawnPiece === undefined) {
            returnOpponentPiece = opponentBackRowPiece
        } else {
            returnOpponentPiece = opponentPawnPiece
        }

        if(additionCondition === "castle") {
            var isKingSide = returnOpponentPiece.x - newX > 0 ? (this.currentPlayer.isBlack != 1 ? true : false) : (this.currentPlayer.isBlack != 1 ? false : true)
            var returnRook = this.currentPlayer.getRook(isKingSide, true, true)
            returnOpponentPiece.updateBoardState(newPos, oldPos, returnRook, this.currentPlayer.boardMem, newX, newY, this.currentPlayer, isKingSide)
            this.currentPlayer.turn = true
            this.setDraggableOfPieces(true)

            this.board.resetSquareColor();
            const offset = isKingSide ? 1 : -1;
            const direction = this.currentPlayer.isBlack == 0 ? 1 : -1;

            this.board.changeSquareColorWithBlend(oldPos, '#FFFF00');
            this.board.changeSquareColorWithBlend(newPos, '#FFFF00');
            this.board.changeSquareColorWithBlend(newPos + offset * direction, '#FFFF00');

            return
        }

        var returnOurPiece = undefined
        if(ourPawnPiece === undefined && ourBackRowPiece === undefined) {
            returnOurPiece = undefined
        } else if(ourPawnPiece === undefined) {
            index1 = this.currentPlayer.ourBackRowPieces.indexOf(ourBackRowPiece)
            returnOurPiece = ourBackRowPiece
        } else {
            index2 = this.currentPlayer.ourPawnPieces.indexOf(ourPawnPiece)
            returnOurPiece = ourPawnPiece
        }

        if (returnOurPiece != undefined || returnOpponentPiece.id === 1) {
            this.fiftyMoveCounter = 0;
        } else {
            this.fiftyMoveCounter++;
        }

        var check = returnOpponentPiece.updateBoardState(newPos, oldPos, returnOpponentPiece, this.currentPlayer.boardMem, newX, newY, this.currentPlayer)
        if(returnOurPiece != undefined) {
            if(index1 != undefined) {
                this.currentPlayer.ourBackRowPieces.splice(index1, 1)
            } else if(index2 != undefined) {
                this.currentPlayer.ourPawnPieces.splice(index2, 1)
            }
            returnOurPiece.removePiece(returnOurPiece)
        }

        if(additionCondition != "") {
            this.currentPlayer.appointPawn(returnOpponentPiece, additionCondition, this.currentPlayer.opponentBackRowPieces, this.currentPlayer.opponentPawnPieces, (this.currentPlayer.isBlack == 1 ? 0 : 1), newPos)
        }

        if (check) {
            if (returnOurPiece != undefined) {
                soundCaptureEffect.play()
            } else {
                soundMoveEffect.play()
            }
        }
        this.board.resetSquareColor();
        this.board.changeSquareColorWithBlend(oldPos, '#FFFF00');
        this.board.changeSquareColorWithBlend(newPos, '#FFFF00');

        this.currentPlayer.turn = true
        this.setDraggableOfPieces(true)

        if (check && this.currentPlayer.isCheckMate) {
            setTimeout(() => {
                this.end()
            }, 200)
        } else if (this.fiftyMoveCounter >= 50) {
            setTimeout(() => {
                this.draw()
            }, 100)
        } else if (this.currentPlayer.isInsufficientMaterial()) {
            setTimeout(() => {
                this.draw()
            }, 100)
        } else if (this.currentPlayer.isStaleMate()) {
            setTimeout(() => {
                this.staleMateDraw()
            }, 100)
        } else if (this.currentPlayer.isThreefoldRepetition(this.boardHistory)) {
            setTimeout(() => {
                this.draw()
            }, 100)
        }
    }
    end() {
        // End the game
        this.socket.send(JSON.stringify({
            type: 'end',
            codeGame: this.codeGame,
        }));
        this.currentPlayer.turn = false
        this.setDraggableOfPieces(false)
        alert('You lose! The opponent has checkmated you.');
        const surrender = document.getElementById('surrender-btn');
        const draw = document.getElementById('draw-btn');

        surrender.replaceWith(surrender.cloneNode(true))
        draw.replaceWith(draw.cloneNode(true))
    }
    draw() {
        this.currentPlayer.turn = false
        this.setDraggableOfPieces(false)
        alert('The game is a draw.');
        const surrender = document.getElementById('surrender-btn');
        const draw = document.getElementById('draw-btn');

        surrender.replaceWith(surrender.cloneNode(true))
        draw.replaceWith(draw.cloneNode(true))
    }
    staleMateDraw() {
        this.socket.send(JSON.stringify({
            type: 'draw_stale_mate',
            codeGame: this.codeGame,
        }));
        this.currentPlayer.turn = false
        this.setDraggableOfPieces(false)
        alert('The game is a draw.');
        const surrender = document.getElementById('surrender-btn');
        const draw = document.getElementById('draw-btn');

        surrender.replaceWith(surrender.cloneNode(true))
        draw.replaceWith(draw.cloneNode(true))
    }
}