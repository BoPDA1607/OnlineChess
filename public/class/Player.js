import CD from '../CD.js';
import {King, Queen, Bishop, Knight, Rook, Pawn, NoGraphicPiece} from './Pieces.js';

export class Player {
    constructor(isBlack, stage, layer) {
        this.turn = false
        this.startPos = 7
        this.endPos = 0
        
        if(isBlack == 0) {
            this.turn = true
            this.startPos = 0
            this.endPos = 7
        }
        this.stage = stage
        this.layer = layer
        this.isBlack = isBlack
        
        this.boardMem = []
        for(let i = 0; i < 64; i++) {
            this.boardMem.push(new NoGraphicPiece(0, -1))
        }

        this.opponentPawnPieces = []
        this.opponentBackRowPieces = []
        this.ourPawnPieces = []
        this.ourBackRowPieces = []

        this.isCheckMate = false;

    }
    showBoardMem() {
        this.boardMem.forEach(piece => {
            console.log(piece.id)
            console.log(piece.isBlack)
        })
    }
    showPieces(pieces) {
        pieces.forEach(piece => {
            piece.show()
        })
    }
    checkSelectedPieces(pieces) {
        const selectedPiece = pieces.find(piece => piece.isSelected);
        if (selectedPiece) {
            return selectedPiece;
        }
        return null;
    }
    movePieces(pieces, x, y) {
        pieces.forEach(piece => {
            piece.move(x, y)
        })
        return false
    }
    placePieces() {
        this.placePawns()
        this.placeBackRow()
    }

    placePawns() {
        if(this.startPos - this.endPos < 0) {
            let i = 1
            let pos = this.startPos + 48
            while(pos <= this.endPos + 48) {
                this.boardMem[pos].id = 1
                this.boardMem[pos].isBlack = this.isBlack
                this.ourPawnPieces.push(new Pawn(pos, this.isBlack, this.stage, this.layer, CD.IMAGE_SOURCE, 1, true))
                pos += i
            }
            pos = this.startPos + 8
            while(pos <= this.endPos + 8) {
                this.boardMem[pos].id = 1
                this.boardMem[pos].isBlack = this.isBlack + 1
                this.opponentPawnPieces.push(new Pawn(pos, this.isBlack + 1, this.stage, this.layer, CD.IMAGE_SOURCE, 1, false))
                pos += i
            }
        } else {
            let i = -1
            let pos = this.startPos + 8
            while(pos >= this.endPos + 8) {
                this.boardMem[pos].id = 1
                this.boardMem[pos].isBlack = this.isBlack - 1
                this.opponentPawnPieces.push(new Pawn(pos, this.isBlack - 1, this.stage, this.layer, CD.IMAGE_SOURCE, 1, false))
                pos += i
            }
            pos = this.startPos + 48
            while(pos >= this.endPos + 48) {
                this.boardMem[pos].id = 1
                this.boardMem[pos].isBlack = this.isBlack
                this.ourPawnPieces.push(new Pawn(pos, this.isBlack, this.stage, this.layer, CD.IMAGE_SOURCE, 1, true))
                pos += i
            }
        }
        this.showPieces(this.opponentPawnPieces)
        this.showPieces(this.ourPawnPieces)
    }
    placeBackRow() {
        let check = this.startPos - this.endPos < 0
        if(check) {
            let i = 1
            let newStartPos = this.startPos + 56
            let newEndPos = this.endPos + 56
            let pos = newStartPos
            while(pos <= newEndPos) {
                this.ourBackRowPieces.push(this.defineBackRowPiece(pos, newStartPos, newEndPos, this.isBlack, check, true))
                pos += i
            }
            pos = this.startPos
            while(pos <= this.endPos) {
                this.opponentBackRowPieces.push(this.defineBackRowPiece(pos, this.startPos, this.endPos, this.isBlack + 1, check, false))
                pos += i
            }
        }  else {
            let i = -1
            let newStartPos = this.startPos + 56
            let newEndPos = this.endPos + 56
            let pos = newStartPos
            while(pos >= newEndPos) {
                this.ourBackRowPieces.push(this.defineBackRowPiece(pos, newStartPos, newEndPos, this.isBlack, check, true))
                pos += i
            }
            pos = this.startPos
            while(pos >= this.endPos) {
                this.opponentBackRowPieces.push(this.defineBackRowPiece(pos, this.startPos, this.endPos, this.isBlack - 1, check, false))
                pos += i
            }
        }
        this.showPieces(this.opponentBackRowPieces)
        this.showPieces(this.ourBackRowPieces)
    }
    defineBackRowPiece(pos, startPos, endPos, color, check, draggable) {
        if(check) {
            if(pos === startPos||pos === endPos) {
                this.boardMem[pos].id = 2
                this.boardMem[pos].isBlack = color
                return new Rook(pos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 2, draggable)
            } else if(pos === startPos + 1 ||pos === endPos - 1) {
                this.boardMem[pos].id = 3
                this.boardMem[pos].isBlack = color
                return new Knight(pos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 3, draggable)
            } else if(pos === startPos + 2||pos === endPos - 2) {
                this.boardMem[pos].id = 4
                this.boardMem[pos].isBlack = color
                return new Bishop(pos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 4, draggable)
            } else if(pos === startPos + 3) {
                this.boardMem[pos].id = 5
                this.boardMem[pos].isBlack = color
                return new Queen(pos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 5, draggable)
            } else if(pos === startPos + 4){
                this.boardMem[pos].id = 6
                this.boardMem[pos].isBlack = color
                return new King(pos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 6, draggable)
            }
        } else {
            if(pos === startPos||pos === endPos) {
                this.boardMem[pos].id = 2
                this.boardMem[pos].isBlack = color
                return new Rook(pos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 2, draggable)
            } else if(pos === startPos - 1 ||pos === endPos + 1) {
                this.boardMem[pos].id = 3
                this.boardMem[pos].isBlack = color
                return new Knight(pos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 3, draggable)
            } else if(pos === startPos - 2||pos === endPos + 2) {
                this.boardMem[pos].id = 4
                this.boardMem[pos].isBlack = color
                return new Bishop(pos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 4, draggable)
            } else if(pos === startPos - 3) {
                this.boardMem[pos].id = 5
                this.boardMem[pos].isBlack = color
                return new Queen(pos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 5, draggable)
            } else if(pos === startPos - 4){
                this.boardMem[pos].id = 6
                this.boardMem[pos].isBlack = color
                return new King(pos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 6, draggable)
            }
        }
    }
    simulateMoves(flag) {
        var validMoves = []
        const prevBoardMem = JSON.parse(JSON.stringify(this.boardMem));
        const ourPieces = this.ourBackRowPieces.concat(this.ourPawnPieces)
        for(let i = 0; i < ourPieces.length; i++) {
            var moves = this.getValidMoves(ourPieces[i], flag);
            for (let j = moves.length - 1; j >= 0; j--) {
                if (ourPieces[i].id === 1) { //chuọt
                    if ((moves[j] - ourPieces[i].pos === -7 || moves[j] - ourPieces[i].pos === -9) && 
                        (this.boardMem[moves[j]].isBlack === -1 || this.boardMem[moves[j]].isBlack === this.isBlack)) {
                        moves.splice(j, 1);
                        continue;
                    }
                    if ((Math.abs(moves[j] - ourPieces[i].pos) === 16 || Math.abs(moves[j] - ourPieces[i].pos) === 8)) {
                        if (this.boardMem[moves[j]].isBlack != this.isBlack || this.boardMem[moves[j]].isBlack != -1) {
                            moves.splice(j, 1);
                            continue;
                        }
                    }
                }
                this.boardMem[moves[j]].id = this.boardMem[ourPieces[i].pos].id
                this.boardMem[moves[j]].isBlack = this.boardMem[ourPieces[i].pos].isBlack
                this.boardMem[ourPieces[i].pos].id = 0
                this.boardMem[ourPieces[i].pos].isBlack = -1
                if(this.isCheck()) {
                    moves.splice(j, 1)
                }

                this.boardMem = JSON.parse(JSON.stringify(prevBoardMem));
            }
            if(moves.length > 0)
                validMoves.push({id: ourPieces[i].id, pos: ourPieces[i].pos, moves: moves})
        }
        
        this.boardMem = JSON.parse(JSON.stringify(prevBoardMem));

        return validMoves
    }
    getValidMoves(currentPiece, flag) {
        const moves = [];
        const directions = {
            'King': [-9, -8, -7, -1, 1, 7, 8, 9],
            'Queen': [-9, -8, -7, -1, 1, 7, 8, 9],
            'Bishop': [-9, -7, 7, 9],
            'Knight': [-17, -15, -10, -6, 6, 10, 15, 17],
            'Rook': [-8, -1, 1, 8],
            'Pawn': flag == "isCheck" ? [-9, -7, -8, -16] : [9, 7]
        };
        let pieceType;
        switch (currentPiece.id) {
            case 6:
                pieceType = 'King';
                break;
            case 5:
                pieceType = 'Queen';
                break;
            case 2:
                pieceType = 'Rook';
                break;
            case 3:
                pieceType = 'Knight';
                break;
            case 4:
                pieceType = 'Bishop';
                break;
            case 1:
                pieceType = 'Pawn';
                break;
            default:
                return moves;
        }

        const pieceDirections = directions[pieceType];

        for (const dir of pieceDirections) {
            let newPos = currentPiece.pos;

            while (true) {
                newPos += dir;

                if (newPos < 0 || newPos >= 64) break;

                if (pieceType === 'Knight') {
                    const currentCol = currentPiece.pos % 8;
                    const newCol = newPos % 8;
                    if (Math.abs(currentCol - newCol) > 2) break;
                } else {
                    if (Math.abs(dir) === 1 && !currentPiece.checkSameRow(newPos)) break;
                    else if ((Math.abs(dir) === 7 || Math.abs(dir) === 9) && !currentPiece.checkSameDiagonal(newPos)) {
                        break;
                    }
                }

                if (this.boardMem[newPos].isBlack === -1 ) {
                    moves.push(newPos);
                } else if (this.boardMem[newPos].isBlack !== currentPiece.isBlack) {
                    moves.push(newPos);
                    break;
                } else {
                    break;
                }

                if (pieceType === 'Pawn') {
                    if (flag == "isCheck" && (dir === -9 || dir === -7)) {
                        if (this.boardMem[newPos].isBlack !== -1 && this.boardMem[newPos].isBlack !== this.isBlack) {
                            moves.push(newPos);
                        }
                    } else if (flag == "isCheck" && (dir === -8 || dir === -16)) {
                        if (this.boardMem[newPos].isBlack === -1) {
                            moves.push(newPos);
                        }
                        if (dir === -16 && currentPiece.moves > 0) break;
                    } else if (flag == "isBeingChecked" && (dir === 9 || dir === 7)) {
                        if (this.boardMem[newPos].isBlack !== -1 && this.boardMem[newPos].isBlack !== this.isBlack) {
                            moves.push(newPos);
                        }
                    }
                    break;
                }

                if (pieceType === 'King' || pieceType === 'Pawn' || pieceType === 'Knight') break;
            }
        }

        return moves;
    }

    isCheck(boardMem = this.boardMem) {
        let kingPosition = -1;
        for (let i = 0; i < boardMem.length; i++) {
            if (boardMem[i].id === 6 && boardMem[i].isBlack === this.isBlack) {
                kingPosition = i;
                break;
            }
        }
        let opponentPieces = this.opponentPawnPieces.concat(this.opponentBackRowPieces)
        for (let i = 0; i < opponentPieces.length; i++) {
            if (boardMem[opponentPieces[i].convert(opponentPieces[i].x, opponentPieces[i].y)].id != 0 && boardMem[opponentPieces[i].convert(opponentPieces[i].x, opponentPieces[i].y)].isBlack != this.isBlack) {
                let moves = this.getValidMoves(opponentPieces[i], "isBeingChecked");
                for (let j = 0; j < moves.length; j++) {
                    if (moves[j] === kingPosition) {
                        return true;
                    }
                } 
            }
        }
    
        if (kingPosition === -1) {
            console.error("King not found on the board");
            return false;
        }
    
        return false;
    }
    appointPawn(currentPiece, appoitedPiece, backRowPieces, pawnPieces, color, newPos) {
        if(parseInt(currentPiece.pos / 8) != 0 && appoitedPiece === "") return 0;
        currentPiece.removePiece(currentPiece)
        pawnPieces.splice(pawnPieces.indexOf(currentPiece), 1)
        switch(appoitedPiece) {
            case "queen":
                this.boardMem[newPos].id = 5
                this.boardMem[newPos].isBlack = color
                var newQueen = new Queen(newPos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 5, false)
                backRowPieces.push(newQueen)
                newQueen.show()
                return 1
            case "rook":
                this.boardMem[newPos].id = 2
                this.boardMem[newPos].isBlack = color
                var newRook = new Rook(newPos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 2, false)
                backRowPieces.push(newRook)
                newRook.show()
                return 1
            case "bishop":
                this.boardMem[newPos].id = 4
                this.boardMem[newPos].isBlack = color
                var newBishop = new Bishop(newPos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 4, false)
                backRowPieces.push(newBishop)
                newBishop.show()
                return 1
            case "knight":
                this.boardMem[newPos].id = 3
                this.boardMem[newPos].isBlack = color
                var newKnight = new Knight(newPos, color, this.stage, this.layer, CD.IMAGE_SOURCE, 3, false)
                backRowPieces.push(newKnight)
                newKnight.show()
                return 1
            default:
                console.log("Invalid piece")
                return -1
        }
    }
    isEmptySquare(startPos, endPos) {
        if(startPos < endPos) {
            for(let i = startPos + 1; i < endPos; i++) {
                console.log(this.boardMem[i].id)
                console.log(i)
                if(this.boardMem[i].id != 0) return false
            }
        } else {
            for(let i = startPos - 1; i > endPos; i--) {
                console.log(this.boardMem[i].id)
                console.log(i)
                if(this.boardMem[i].id != 0) return false
            }
        }
        return true
    }
    getRook(isKingSide, isCastling, isOpponent) {
        if(!isCastling) return undefined
        let ourRookPos = isKingSide ? (this.isBlack == 0 ? 63 : 56) : (this.isBlack == 0 ? 56 : 63)
        let opponentRookPos = isKingSide ? (this.isBlack == 0 ? 0 : 7) : (this.isBlack == 0 ? 7 : 0)
        console.log(ourRookPos)
        if(isOpponent) {
            return this.opponentBackRowPieces.find(piece => piece.pos === opponentRookPos)
        }
        return this.ourBackRowPieces.find(piece => piece.pos === ourRookPos)
    }
    loseGame() {
        this.isCheckMate = true;
    }
    getPiecesOnBoard() {
        var countPieces = 0
        for (let i = 0; i < this.boardMem.length; i++) {
            if (this.boardMem[i].id !== 0) {
                countPieces++;
            }
        }
        return countPieces
    }
    isInsufficientMaterial() {
        var countPieces = this.getPiecesOnBoard()
        if (countPieces === 2) {
            return true;
        } else if (countPieces === 3) {
            for (let i = 0; i < this.boardMem.length; i++) {
                if (this.boardMem[i].id === 4 || this.boardMem[i].id === 3) {
                    return true;
                }
            }
        }
        return false;
    }
    isStaleMate() {
        var validMoves = this.simulateMoves("isCheck")
        if (validMoves.length === 0 && !this.isCheck()) {
            return true;
        }
        return false;
    }
    isThreefoldRepetition(boardHistory) {
        const currentState = JSON.stringify(this.boardMem);
        boardHistory.push(currentState);

        var occurrences = boardHistory.filter(state => state === currentState).length;
        
        return occurrences >= 3;
    }
}