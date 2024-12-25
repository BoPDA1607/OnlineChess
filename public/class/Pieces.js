import CD from '../CD.js';

class Pieces {
    constructor(position, isBlack, stage, layer, imageSrc, id, draggable) {
        this.x = position % 8
        this.y = parseInt(position / 8)
        this.isBlack = isBlack
        this.layer = layer
        this.stage = stage
        this.draggable = draggable
        this.isMoved = false
        this.imageObj = new Image();
        this.imageObj.src = imageSrc;
        this.isSelected = false;
        this.id = id;
        this.moves = 0
        this.pos = position
        if (this.id == 6 || this.id == 2) {
            this.hasMoved = false;
        }
        this.imageLoadPromise = new Promise((resolve) => {
            this.imageObj.onload = () => {
                resolve();
            };
        });

        this.imageNode;
    }
    createImageNode(x0, y0, draggable) {
        return this.imageLoadPromise.then(() => {
            const imageNode = new Konva.Image({
                x: this.x * CD.SIZE,
                y: this.y * CD.SIZE,
                image: this.imageObj,
                width: CD.SIZE,
                height: CD.SIZE,
                crop: {
                    x: x0 * CD.NODE_SIZE,
                    y: y0 * CD.NODE_SIZE,
                    width: CD.NODE_SIZE,
                    height: CD.NODE_SIZE,
                },
                draggable: draggable,
                dragBoundFunc: function (pos) {
                    const minX = 0;
                    const minY = 0;
                    const maxX = 7 * CD.SIZE;
                    const maxY = 7 * CD.SIZE;

                    return {
                        x: Math.min(Math.max(pos.x, minX), maxX),
                        y: Math.min(Math.max(pos.y, minY), maxY)
                    };
                }
            });

            imageNode.on('mousedown', () => {
                if (imageNode.draggable()) {
                    this.isSelected = true
                }
                imageNode.moveToTop()
            })

            this.imageNode = imageNode
            return imageNode;
        });
    }
    show() { }
    move() { }
    convert(x, y) {
        return 8 * y + x
    }
    setDraggable(draggable) {
        if (this.imageNode === undefined) return
        this.imageNode.setDraggable(draggable)
    }
    updatePos(x0, y0) {
        this.x = x0
        this.y = y0
        this.invalidMove()
    }
    restoreState(prevX, prevY, prevPos, prevBoardMem, boardMem) {
        this.updatePos(prevX, prevY);
        this.pos = prevPos;
        this.moves -= 1;
        for (let i = 0; i < boardMem.length; i++) {
            boardMem[i].id = prevBoardMem[i].id;
            boardMem[i].isBlack = prevBoardMem[i].isBlack;
        }
    }
    updateBoardState(pos, startPos, selectedPiece, boardMem, x0, y0, currentPlayer, isCastlingKingSide) {
        if (isCastlingKingSide != undefined) {
            var castlingCondition = ((this.isBlack == 1 && !isCastlingKingSide) || (this.isBlack == 0 && isCastlingKingSide));
            // cập nhật trạng thái mới cho vua
            this.updatePos(x0, y0);
            boardMem[pos] = {
                id: this.id,
                isBlack: this.isBlack
            };
            boardMem[startPos] = { id: 0, isBlack: -1 };
            this.pos = pos;
            this.moves += 1;
            this.hasMoved = true;
            // cập nhật trạng thái mới cho xe
            selectedPiece.updatePos(castlingCondition ? (x0 - 1) : (x0 + 1), y0);
            boardMem[castlingCondition ? (pos - 1) : (pos + 1)] = {
                id: selectedPiece.id,
                isBlack: selectedPiece.isBlack
            };
            boardMem[selectedPiece.pos] = { id: 0, isBlack: -1 };
            selectedPiece.pos = castlingCondition ? (pos - 1) : (pos + 1);
            selectedPiece.moves += 1;
            selectedPiece.hasMoved = true;
            
            console.log(selectedPiece)
            console.log(boardMem)

            return true;
        }

        var validMoves = undefined;

        var countCheck = 0, check = false;
        if (currentPlayer.isCheck()) {
            countCheck += 1;
        }
        

        // lưu trạng thái quân cờ
        const prevPos = this.pos;
        const prevX = this.x;
        const prevY = this.y;
        const prevBoardMem = JSON.parse(JSON.stringify(boardMem));

        // cập nhật trạng thái mới
        this.updatePos(x0, y0);
        boardMem[pos] = {
            id: selectedPiece.id,
            isBlack: selectedPiece.isBlack
        };
        boardMem[startPos] = { id: 0, isBlack: -1 };
        this.pos = pos;
        this.moves += 1;


        if (currentPlayer.isCheck()) {
            countCheck += 1;
            check = true;
        }
        if (countCheck === 1 && ((!check || !currentPlayer.turn) || (countCheck === 2 && currentPlayer.turn))) {
            validMoves = currentPlayer.simulateMoves("isCheck");
            setTimeout(() => {}, 200);
        }
        
        console.log(validMoves)

        if (validMoves != undefined && validMoves.length === 0) {
            console.log("Bí rồi nhé");
            currentPlayer.loseGame();
            return true;
        }

        //nếu đang là lượt của mình mà mình đưa vua vào tình trạng chiếu thì không được phép
        if (countCheck === 1 && currentPlayer.turn && check) {
            this.restoreState(prevX, prevY, prevPos, prevBoardMem, boardMem);
            console.log("ĐI NGU LẮM 1");
            return false;
        }

        if (countCheck === 2) {
            this.restoreState(prevX, prevY, prevPos, prevBoardMem, boardMem);
            console.log("ĐI NGU LẮM 2");
            return false;
        } else if (countCheck === 1) {
            console.log("CHIẾU TƯỚNG");
        }
        if (this.id === 6 || this.id === 2) {
            this.hasMoved = true;
        } else if (boardMem[pos].id === 2 || boardMem[pos].id === 6) {
            boardMem[pos].hasMoved = true;
        }
        return true;
    }
    invalidMove() {
        this.imageNode.x(this.x * 60)
        this.imageNode.y(this.y * 60)
    }
    removePiece(piece) {
        if (piece === undefined) return
        piece.imageNode.destroy()
        piece = null
        this.layer.draw()
    }
    checkValidMove(i, startPos, endPos, boardMem, x0, y0, selectedPiece, limitPos, returnPiece, currentPlayer) {
        let pos = startPos + i
        let checkPos = startPos - endPos < 0
        let checkMove
        let length = limitPos.length
        if (checkPos) {
            checkMove = pos <= endPos
        } else {
            checkMove = pos >= endPos
        }
        while (checkMove) {
            if (selectedPiece.id === 1) {// Con chuột
                var i1 = -9, i2 = -7
                if (startPos + i1 === endPos || startPos + i2 === endPos) {
                    if (boardMem[pos].isBlack !== -1 && boardMem[pos].isBlack !== this.isBlack) {
                        //An quan
                        if (pos === endPos) {
                            var check = this.updateBoardState(pos, startPos, selectedPiece, boardMem, x0, y0, currentPlayer)
                            if (check) {
                                this.moves += 1
                                this.removePiece(returnPiece)
                            }
                            return check
                        } else {
                            this.invalidMove()
                            return false
                        }
                    } else {
                        this.invalidMove()
                        return false
                    }
                }
                if (boardMem[pos].isBlack !== -1) {
                    this.invalidMove()
                    return false
                }
            }

            if (selectedPiece.id === 6) {// Con vua
                let newCol = pos % 8
                let currentCol = startPos % 8
                let newRow = parseInt(pos / 8)
                let currentRow = parseInt(startPos / 8)
                if (Math.abs(newCol - currentCol) > 1 || Math.abs(newRow - currentRow) > 1) {
                    this.invalidMove()
                    return false
                }
            }

            if (boardMem[pos].isBlack === this.isBlack) {
                this.invalidMove()
                return false
            }
            if (boardMem[pos].isBlack !== -1) {
                if (pos != endPos) {
                    this.invalidMove()
                    return false
                    //An quan
                } else if (pos === endPos) {
                    var check = this.updateBoardState(pos, startPos, selectedPiece, boardMem, x0, y0, currentPlayer)
                    if (check) {
                        this.moves += 1
                        this.removePiece(returnPiece)
                    }
                    return check
                }
            }

            //Gioi han nuoc di
            if (this.id === 2 || this.id === 4 || this.id === 5) {
                if (pos === endPos) {
                    break
                }
            } else {
                if (this.id === 1 && this.moves >= 1) {
                    limitPos.pop()
                }
                if (limitPos.includes(pos)) {
                    length = length - 1
                    if (length === 0) {
                        break
                    } else {
                        if (pos === endPos) {
                            break
                        }
                    }
                }
            }
            pos += i
        }
        if (pos === endPos) {
            var check = this.updateBoardState(pos, startPos, selectedPiece, boardMem, x0, y0, currentPlayer)
            if (check) {
                this.moves += 1
            }
            return check
        } else {
            this.invalidMove()
            return false
        }
    }
    recognizeDirection(moves, x0, y0, boardMem, legalMoves, returnPiece, currentPlayer) { // x0 = 5, y0 = 3
        const endPos = this.convert(x0, y0);
        console.log("End pos: ", endPos);
        const startPos = this.convert(this.x, this.y);
        const selectedPiece = boardMem[startPos];
        const distance = startPos - endPos;

        const startRow = Math.floor(startPos / 8);
        const endRow = Math.floor(endPos / 8);
        const startCol = startPos % 8;
        const endCol = endPos % 8;

        let i;
        let isValidMove = false;

        if (startRow === endRow) {
            const horizontalDistance = endPos - startPos;
            if (moves.includes(8)) {
                i = horizontalDistance > 0 ? 1 : -1;
                isValidMove = true;
            }
        } else if (startCol === endCol) {
            if (moves.includes(8)) {
                i = endPos - startPos > 0 ? 8 : -8;
                isValidMove = true;
            }
        } else if (this.checkSameDiagonal(endPos)) {
            for (let move of moves) {
                if (move === 7 || move === 9) {
                    if (Math.abs(distance) % move === 0) {
                        i = distance > 0 ? -move : move;
                        isValidMove = true;
                        break;
                    }
                }
            }
        } else if (this.id === 3) {
            for (let move of moves) {
                if (Math.abs(distance) === move) {
                    i = move * (distance > 0 ? -1 : 1);
                    isValidMove = true;
                    break;
                }
            }
        }

        if (isValidMove) {
            var isValid = this.checkValidMove(i, startPos, endPos, boardMem, x0, y0, selectedPiece, legalMoves, returnPiece, currentPlayer);
            if (isValid) {
                return startPos
            }
            return -1;
        }

        this.imageNode.x(this.x * 60);
        this.imageNode.y(this.y * 60);
    }
    rotate(posX) {
        return -8 * posX + 56 + 65 * parseInt(posX / 8)
    }
    checkSameRow(endPos) {
        let check = this.rotate(endPos) - this.rotate(this.pos)
        if (check % 8 === 0) {
            return true
        }
        return false
    }
    checkSameDiagonal(endPos) {
        var newX = endPos % 8;
        var newY = parseInt(endPos / 8)
        if (newX + newY === this.x + this.y || Math.abs(newX - newY) === Math.abs(this.x - this.y)) {
            return true
        }
        return false
    }
}
export class King extends Pieces {
    show() {
        this.createImageNode(0, this.isBlack, this.draggable).then((king) => {
            this.layer.add(king);
            this.layer.draw();
        });
    }
    move(x0, y0, boardMem, returnPiece, currentPlayer) {
        if (this.y == y0 && Math.abs(this.x - x0) == 2) {
            var kingSide;
            if (this.isBlack == 1) {
                kingSide = this.x - x0 > 0;
            } else {
                kingSide = this.x - x0 < 0;
            }
            return this.castling(returnPiece, boardMem, currentPlayer, kingSide);
        }
        return this.recognizeDirection([7, 8, 9], x0, y0, boardMem, [this.pos - 1, this.pos + 1, this.pos - 7,
        this.pos + 7, this.pos - 8, this.pos + 8, this.pos - 9, this.pos + 9], returnPiece, currentPlayer)
    }
    canCastle(returnPiece, currentPlayer) {
        if (this.hasMoved) { 
            console.log("Vua da di chuyen"); 
            return false; 
        }
        if (currentPlayer.isCheck()) { 
            console.log("Dang bi check"); 
            return false; 
        }
    
        var rookPos = returnPiece.pos, kingPos = this.pos;
    
        if (returnPiece.id !== 2 || returnPiece.hasMoved || returnPiece === undefined) { 
            console.log("Khong phai con xe hoac da di chuyen"); 
            return false; 
        }
    
        if (!currentPlayer.isEmptySquare(rookPos, kingPos)) { 
            console.log("Khong co o trong"); 
            return false; 
        }
    
        var castlingCondition = (rookPos > kingPos);

        var step = castlingCondition ? 1 : -1;
        var tempBoardMem = JSON.parse(JSON.stringify(currentPlayer.boardMem));

        //simulate quân vua di chuyển qua các ô giữa vua và xe
        for (var i = kingPos + step; i !== rookPos; i += step) {
            tempBoardMem[i] = tempBoardMem[kingPos];
            tempBoardMem[kingPos] = { id: 0, isBlack: -1 };

            if (currentPlayer.isCheck(tempBoardMem)) {
                console.log("Ô giữa vua và xe bị kiểm soát bởi quân đối phương");
                return false;
            }
        }

        // simulate quân vua di chuyển đến vị trí mới sau khi nhập thành
        var newKingPos = castlingCondition ? (kingPos + 2) : (kingPos - 2);
        tempBoardMem = JSON.parse(JSON.stringify(currentPlayer.boardMem));
        tempBoardMem[newKingPos] = tempBoardMem[kingPos];
        tempBoardMem[kingPos] = { id: 0, isBlack: -1 };

        if (currentPlayer.isCheck(tempBoardMem)) {
            console.log("Vua se bi check sau khi nhap thanh");
            return false;
        }
    
        return true;
    }
    castling(returnPiece, boardMem, currentPlayer, isKingSide) {
        if (!this.canCastle(returnPiece, currentPlayer, isKingSide)) return false;

        console.log(isKingSide)

        if (this.isBlack == 1 && isKingSide) {
            return this.updateBoardState(this.pos - 2, this.pos, returnPiece, boardMem, this.x - 2, this.y, currentPlayer, isKingSide);
        } else if (this.isBlack == 1 && !isKingSide) {
            return this.updateBoardState(this.pos + 2, this.pos, returnPiece, boardMem, this.x + 2, this.y, currentPlayer, isKingSide);
        } else if (this.isBlack == 0 && isKingSide) {
            return this.updateBoardState(this.pos + 2, this.pos, returnPiece, boardMem, this.x + 2, this.y, currentPlayer, isKingSide);
        } else {
            return this.updateBoardState(this.pos - 2, this.pos, returnPiece, boardMem, this.x - 2, this.y, currentPlayer, isKingSide);
        }
    }
}
export class Queen extends Pieces {
    show() {
        this.createImageNode(1, this.isBlack, this.draggable).then((queen) => {
            this.layer.add(queen);
            this.layer.draw();
        });
    }
    move(x0, y0, boardMem, returnPiece, currentPlayer) {
        return this.recognizeDirection([7, 8, 9], x0, y0, boardMem, [], returnPiece, currentPlayer)
    }
}
export class Bishop extends Pieces {
    show() {
        this.createImageNode(2, this.isBlack, this.draggable).then((bishop => {
            this.layer.add(bishop);
            this.layer.draw();
        }))
    }
    move(x0, y0, boardMem, returnPiece, currentPlayer) {
        return this.recognizeDirection([7, 9], x0, y0, boardMem, [], returnPiece, currentPlayer)
    }
}
export class Knight extends Pieces {
    show() {
        this.createImageNode(3, this.isBlack, this.draggable).then((knight => {
            this.layer.add(knight);
            this.layer.draw();
        }))
    }
    move(x0, y0, boardMem, returnPiece, currentPlayer) {
        return this.recognizeDirection([6, 10, 15, 17], x0, y0, boardMem,
            [this.pos - 17, this.pos - 15, this.pos - 10,
            this.pos - 6, this.pos + 6, this.pos + 10, this.pos + 15, this.pos + 17], returnPiece, currentPlayer)
    }
}
export class Rook extends Pieces {
    show() {
        this.createImageNode(4, this.isBlack, this.draggable).then((rook => {
            this.layer.add(rook);
            this.layer.draw();
        }))
    }
    move(x0, y0, boardMem, returnPiece, currentPlayer) {
        return this.recognizeDirection([8], x0, y0, boardMem, [], returnPiece, currentPlayer)
    }
}
export class Pawn extends Pieces {
    show() {
        this.createImageNode(5, this.isBlack, this.draggable).then((pawn => {
            this.layer.add(pawn);
            this.layer.draw();
        }))
    }
    move(x0, y0, boardMem, returnPiece, currentPlayer) {
        return this.recognizeDirection([7, 8, 9], x0, y0, boardMem, [this.pos - 8, this.pos - 16], returnPiece, currentPlayer)
    }
    showPromotionImage() {
        return this.createPromotionImageNode().then((imageNode) => {
            this.layer.add(imageNode);
            this.layer.draw();
        });
    }
    createPromotionImageNode() {
        this.imageObj.src = this.isBlack == 1 ? CD.PROMOTION_IMAGE_SOURCE_BLACK : CD.PROMOTION_IMAGE_SOURCE_WHITE;
        return this.imageLoadPromise.then(() => {
            const imageNode = new Konva.Image({
                x: this.x * CD.SIZE,
                y: this.y * CD.SIZE,
                image: this.imageObj,
                width: CD.SIZE,
                height: CD.SIZE * 4,
            });

            this.imageNode = imageNode;

            return imageNode;
        });
    }
}
export class NoGraphicPiece {
    constructor(id, isBlack) {
        this.id = id
        this.isBlack = isBlack
        this.imageNode
        if (this.id == 6 || this.id == 2) {
            this.hasMoved = false;
        }
    }
}