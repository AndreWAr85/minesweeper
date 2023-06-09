const boardSizes = {
  easy: { rows: 10, cols: 10, mines: 10 },
  medium: { rows: 15, cols: 15, mines: 20 },
  hard: { rows: 25, cols: 25, mines: 40 },
};
let numRows = localStorage.getItem('selectedSize') !== null ? localStorage.getItem('selectedSize').split('x')[0] : boardSizes.easy.rows;
let numCols = localStorage.getItem('selectedSize') !== null ? localStorage.getItem('selectedSize').split('x')[0] : boardSizes.easy.cols;
let numMines = localStorage.getItem('numMines') || boardSizes.easy.mines;
let timerRunning = false;
let seconds = 0;

let movesCount = JSON.parse(localStorage.getItem('board')) === null
  ? 0
  : +localStorage.getItem('movesCount');

let numCellsOpened = 0;
const revealSound = document.getElementById('revealSound');
const flagSound = document.getElementById('flagSound');
const gameOverWinSound = document.getElementById('gameOverWinSound');
const gameOverLoseSound = document.getElementById('gameOverLoseSound');
const newGameSound = document.getElementById('newGame');

const wrap = document.createElement('div');
wrap.classList.add('wrapper');
document.body.appendChild(wrap);

// Создаем заголовок
const head = document.createElement('h1');
head.textContent = 'Minesweeper';
wrap.appendChild(head);

// Создаем элементы интерфейса для отображения времени игры и количества ходов
const infoContainer = document.createElement('div');
infoContainer.classList.add('game-info-container');
wrap.appendChild(infoContainer);

const timeCounter = document.createElement('div');
timeCounter.classList.add('time-counter');
timeCounter.textContent = '000 sec.';
infoContainer.appendChild(timeCounter);

const movesCounter = document.createElement('div');
movesCounter.classList.add('moves-counter');
movesCounter.textContent = `moves: ${movesCount}`;
infoContainer.appendChild(movesCounter);

// Создаем контейнер для выбора размера поля и количества мин
const settingsContainer = document.createElement('div');
settingsContainer.classList.add('settings-container');
wrap.appendChild(settingsContainer);

// Создаем элементы выбора размера поля
const sizeLabel = document.createElement('label');
sizeLabel.textContent = 'Size:';
settingsContainer.appendChild(sizeLabel);

const sizeSelect = document.createElement('select');
sizeSelect.id = 'sizeSelect';
sizeLabel.appendChild(sizeSelect);

// Создаем элементы выбора количества мин
const minesLabel = document.createElement('label');
minesLabel.textContent = 'Mines:';
settingsContainer.appendChild(minesLabel);

const minesInput = document.createElement('input');
minesInput.type = 'number';
minesInput.id = 'minesInput';
minesInput.min = '10';
minesInput.max = '99';
minesInput.value = numMines;
minesLabel.appendChild(minesInput);

const containerButton = document.createElement('div');
containerButton.classList.add('container-button');
wrap.appendChild(containerButton);

// Создаем кнопку "New Game"
const newGameButton = document.createElement('button');
newGameButton.textContent = 'New Game';
newGameButton.classList.add('new-game');
containerButton.appendChild(newGameButton);

// Создаем кнопку "Result"
const buttonResult = document.createElement('button');
buttonResult.classList.add('button-result');
buttonResult.textContent = 'Result';
containerButton.appendChild(buttonResult);

// Создаем контейнер для игрового поля
const boardContainer = document.createElement('div');
boardContainer.id = 'game-board-container';
boardContainer.classList.add('board-container');
wrap.appendChild(boardContainer);

function createGameBoard(rows, cols) {
  const gameBoard = [];

  for (let row = 0; row < rows; row += 1) {
    const newRow = [];
    for (let col = 0; col < cols; col += 1) {
      newRow.push({
        isMine: false,
        isOpen: false,
        neighborMines: 0,
      });
    }
    gameBoard.push(newRow);
  }
  return gameBoard;
}

let gameBoard = createGameBoard(numRows, numCols);

// Функция для запуска счетчика времени
let timerInterval;
function startTimer() {
  seconds = parseInt(localStorage.getItem('seconds'), 10) || 0;
  timerInterval = setInterval(() => {
    seconds += 1;
    localStorage.setItem('seconds', seconds);
    const formattedTime = `${seconds.toString().padStart(3, '0')}`;
    timeCounter.textContent = `${formattedTime} sec.`;
  }, 1000);
}

function stopTimer() {
  clearTimeout(timerInterval);
}

// подсчитываем количество мин в соседних клетках указанной клетки
function calculateNeighborMines(row, col) {
  let count = 0;
  for (
    let i = Math.max(row - 1, 0);
    i <= Math.min(row + 1, numRows - 1);
    i += 1
  ) {
    for (
      let j = Math.max(col - 1, 0);
      j <= Math.min(col + 1, numCols - 1);
      j += 1
    ) {
      if (gameBoard[i][j].isMine) {
        count += 1;
      }
    }
  }

  return count;
}

// Получаем результаты из localStorage или инициализируем пустой массив
const highScoresTable = JSON.parse(localStorage.getItem('highScores')) || [];

// Создаем таблицу результатов
const tableResult = document.createElement('table');
tableResult.classList.add('table-result');
tableResult.style.display = 'none';
document.body.appendChild(tableResult);

// Функция для обновления таблицы результатов
function updateHighScoresTable() {
  // Очищаем таблицу перед обновлением
  while (tableResult.firstChild) {
    tableResult.firstChild.remove();
  }

  // Выводим результаты в таблицу
  highScoresTable.forEach((result, index) => {
    const rowResult = tableResult.insertRow();
    const numberCell = rowResult.insertCell();
    const resultCell = rowResult.insertCell();

    numberCell.textContent = `${(index + 1).toString().padStart(2, '0')} - `; // Номер результата
    resultCell.textContent = result; // Сам результат
  });
}

// Добавляем результат игры в массив и обновляем таблицу
function addHighScore(result) {
  if (highScoresTable.length >= 10) {
    highScoresTable.pop();
  }
  highScoresTable.unshift(result);
  localStorage.setItem('highScores', JSON.stringify(highScoresTable));
  updateHighScoresTable();
}

updateHighScoresTable(); // Обновляем таблицу при загрузке страницы

const grayOverlay = document.createElement('div');
grayOverlay.classList.add('gray-overlay');
document.body.appendChild(grayOverlay);
grayOverlay.style.display = 'none';

// Отображение попапа при нажатии на кнопку "Result"
buttonResult.addEventListener('click', () => {
  tableResult.style.display = 'flex';
  grayOverlay.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Запрещаем прокрутку страницы
});

// Закрытие попапа при нажатии на кнопку "X"
const closeButton = document.createElement('button');
closeButton.classList.add('close-button');
closeButton.textContent = 'X';
tableResult.appendChild(closeButton);
closeButton.addEventListener('click', () => {
  tableResult.style.display = 'none';
  grayOverlay.style.display = 'none';
  document.body.style.overflow = ''; // Разрешаем прокрутку страницы
});

document.addEventListener('click', (event) => {
  if (!tableResult.contains(event.target) && event.target !== buttonResult) {
    tableResult.style.display = 'none';
    grayOverlay.style.display = 'none';
    document.body.style.overflow = ''; // Разрешаем прокрутку страницы
  }
});
tableResult.appendChild(closeButton);

function gameOver(isWin) {
  const resultMessage = document.createElement('div');
  resultMessage.classList.add('result');
  if (isWin) {
    gameOverLoseSound.play();
    const result = `${seconds.toString()} seconds ${movesCount} moves`;
    addHighScore(result);
    resultMessage.textContent = `Hooray! You found all mines in ${seconds.toString()} seconds and ${movesCount} moves!`;
  } else {
    gameOverWinSound.play();
    resultMessage.textContent = 'Game over. Try again';
  }

  wrap.appendChild(resultMessage);

  stopTimer();

  // Открываем все клетки поля
  for (let row = 0; row < numRows; row += 1) {
    for (let col = 0; col < numCols; col += 1) {
      const cell = document.querySelector(
        `#game-board-container table tr:nth-child(${row + 1}) td:nth-child(${col + 1
        })`,
      );
      cell.classList.add('open');

      const cellData = gameBoard[row][col];
      if (cellData.isMine) {
        cell.classList.add('mine');
      } else {
        const neighborMines = calculateNeighborMines(row, col);
        cell.classList.add(`num${neighborMines}`);
        cell.textContent = neighborMines;
      }
    }
  }

  localStorage.setItem('board', 'null');
}

// Добавляем функцию для увеличения счетчика ходов
function incrementMovesCounter() {
  movesCount += 1;
  movesCounter.textContent = `${movesCount} moves`;
  localStorage.setItem('movesCount', movesCount);
}
// Располагаем мины на поле после первого хода
function placeMinesAfterFirstMove(row, col) {
  let minesPlaced = 0;

  while (minesPlaced < numMines) {
    const randomRow = Math.floor(Math.random() * numRows);
    const randomCol = Math.floor(Math.random() * numCols);

    // Проверяем, что текущая клетка не является первой открытой клеткой
    const isExcludedCell = randomRow === row && randomCol === col;

    if (!gameBoard[randomRow][randomCol].isMine && !isExcludedCell) {
      gameBoard[randomRow][randomCol].isMine = true;
      minesPlaced += 1;
    }
  }
}

// открываем пустые клетки, рекурсивно распространяясь на соседние пустые клетки
function openEmptyCells(row, col) {
  // После открытия первой клетки, размещаем мины на поле
  if (movesCount === 0) {
    placeMinesAfterFirstMove(row, col);
  }
  if (movesCount > 0) {
    for (
      let i = Math.max(row - 1, 0);
      i <= Math.min(row + 1, numRows - 1);
      i += 1
    ) {
      for (
        let j = Math.max(col - 1, 0);
        j <= Math.min(col + 1, numCols - 1);
        j += 1
      ) {
        const cell = document.querySelector(
          `#game-board-container table tr:nth-child(${i + 1}) td:nth-child(${j + 1
          })`,
        );
        const cellData = gameBoard[i][j];

        if (!cellData.isOpen && !cellData.isMine) {
          if (
            cell !== null
            && cell.classList
            && !cell.classList.contains('open')
          ) {
            cell.classList.add('open');
            numCellsOpened += 1;
            cellData.isOpen = true;
            localStorage.setItem(
              'numCellsOpened',
              JSON.stringify(numCellsOpened),
            );
          }
          const neighborMines = calculateNeighborMines(i, j);
          gameBoard[i][j].neighborMines = neighborMines;
          if (neighborMines === 0) {
            openEmptyCells(i, j);
          } else {
            cell.classList.add(`num${neighborMines}`);
            cell.textContent = neighborMines;
            if (cell) {
              cell.classList.add('open');
            }
          }
        }
      }
    }
  }
}

// темные/светлые темы игры
let isDarkMode = false;
function toggleTheme() {
  isDarkMode = !isDarkMode;

  if (isDarkMode) {
    // Применить стили для темной темы
    document.body.classList.add('dark-theme');
  } else {
    // Применить стили для светлой темы
    document.body.classList.remove('dark-theme');
  }
  localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
}
const toggleThemeButton = document.createElement('button');
toggleThemeButton.textContent = 'Theme';
toggleThemeButton.classList.add('toggle-theme');
containerButton.appendChild(toggleThemeButton);

function renderGameBoard() {
  if (boardContainer) {
    boardContainer.innerHTML = '';
    const table = document.createElement('table');
    // Проходим по каждой строке игрового поля

    if (JSON.parse(localStorage.getItem('board'))) {
      gameBoard = JSON.parse(localStorage.getItem('board'));
    }
    if (localStorage.getItem('board') === 'null') {
      localStorage.setItem('movesCount', 0);
    }

    for (let row = 0; row < numRows; row += 1) {
      const tableRow = document.createElement('tr');
      // Проходим по каждой клетке в текущей строке
      for (let col = 0; col < numCols; col += 1) {
        const cell = document.createElement('td');

        // Добавляем классы в зависимости от состояния клетки
        const cellData = gameBoard[row][col];
        if (cellData.isOpen) {
          cell.classList.add('open');
          if (cellData.isMine) {
            cell.classList.add('mine');
          } else {
            cell.classList.add(`num${cellData.neighborMines}`);
            cell.textContent = cellData.neighborMines;
          }
        } else {
          cell.classList.add('closed');
        }

        // Добавляем слушатель события клика правой кнопкой мыши на клетку
        cell.addEventListener('contextmenu', (event) => {
          event.preventDefault(); // Предотвращаем контекстное меню по умолчанию
          // Проверяем, является ли клетка уже открытой
          if (cell.classList.contains('open')) {
            return; // Прекращаем выполнение обработчика, если клетка открыта
          }
          // Добавляем/удаляем класс пометки на клетке
          if (!cellData.isOpen) {
            cell.classList.toggle('marked');
            flagSound.play();
          }
        });

        // Добавляем слушатель события клика на клетку
        // eslint-disable-next-line no-loop-func
        cell.addEventListener('click', () => {
          // Проверяем, является ли клетка уже открытой
          if (cell.classList.contains('open')) {
            return; // Прекращаем выполнение обработчика, если клетка открыта
          }
          if (cell.classList.contains('marked')) {
            return; // Прекращаем выполнение обработчика, если клетка помечена
          }
          // Обработка, если выбранная клетка содержит мину
          if (gameBoard[row][col].isMine) {
            // Располагаем мины на поле только после первого хода
            if (movesCount === 0) {
              gameBoard[row][col].isMine = false;
            } else {
              cell.classList.add('mine');
              gameOver(false);
              incrementMovesCounter(); // Увеличиваем счетчик ходов
            }
          } else {
            // Обработка, если выбранная клетка не содержит мину
            cell.classList.add('open');
            revealSound.play();
            numCellsOpened += 1; // Увеличиваем счетчик открытых клеток
            cellData.isOpen = true;

            // Количество мин в соседних
            const neighborMines = calculateNeighborMines(row, col);
            if (neighborMines === 0) {
              openEmptyCells(row, col);
            } else {
              cell.classList.add(`num${neighborMines}`);
              cell.textContent = neighborMines;
            }
            incrementMovesCounter(); // Увеличиваем счетчик ходов
            localStorage.setItem('movesCount', JSON.stringify(movesCount) || 0);
            localStorage.setItem(
              'neighborMines',
              JSON.stringify(neighborMines),
            );
            localStorage.setItem('cell', JSON.stringify(cell));
            // Запускаем счетчик времени при первом ходе
            if (movesCount === 1 && !timerRunning) {
              startTimer();
              timerRunning = true;
            }

            // Проверяем условие победы только если клетка была открыта
            if (numCellsOpened === numRows * numCols - numMines) {
              gameOver(true);
            }
            localStorage.setItem('board', JSON.stringify(gameBoard));
          }
          // Обновляем счетчики после каждого хода
          movesCounter.textContent = `moves: ${movesCount}`;
          // Сохраням доску в localstorage
        });

        tableRow.appendChild(cell);
      }

      table.appendChild(tableRow);
    }
    boardContainer.appendChild(table);
  }
}
localStorage.setItem('numMines', numMines);
// Создаем функцию обновления размеров поля и количества мин
function updateBoardSizeAndMines() {
  stopTimer();
  timerRunning = false;
  if (minesInput.value > 99) {
    minesInput.value = 99;
  }
  if (minesInput.value < 10) {
    minesInput.value = 10;
  }
  localStorage.setItem('board', 'null');
  localStorage.setItem('movesCount', 0);
  localStorage.setItem('seconds', 0);
  localStorage.setItem('selectedSize', sizeSelect.value || '10x10');
  localStorage.setItem('numMines', numMines);
  // const selectedSize = sizeSelect.value;
  const selectedSize = localStorage.getItem('selectedSize') || sizeSelect.value;
  const [rows, cols] = selectedSize.split('x').map(Number);
  numRows = rows;
  numCols = cols;
  const minesInputValue = parseInt(minesInput.value, 10);
  numMines = Number.isNaN(minesInputValue) ? 0 : minesInputValue;

  // Обновляем игровое поле и перерисовываем его
  gameBoard = createGameBoard(numRows, numCols);
  renderGameBoard();
  // Сбрасываем счетчики и отображение времени
  seconds = 0;
  movesCount = 0;
  numCellsOpened = 0;
  timeCounter.textContent = '000 sec.';
  movesCounter.textContent = 'moves: 0';

  // Удаляем сообщение о результате игры, если оно было
  const resultMessage = document.querySelector('.result');
  if (resultMessage) {
    resultMessage.remove();
  }
}
// Обработчик события изменения выбора размера поля
sizeSelect.addEventListener('change', updateBoardSizeAndMines);

// Обработчик события изменения значения поля количества мин
minesInput.addEventListener('change', updateBoardSizeAndMines);

// Обработчик события клика по кнопке "New Game" и Enter
function handleNewGame() {
  stopTimer();
  timerRunning = false;
  newGameSound.play();
  localStorage.setItem('seconds', 0);
  localStorage.setItem('board', 'null');
  localStorage.setItem('movesCount', 0);
  updateBoardSizeAndMines();

  if (minesInput.value > 99) {
    minesInput.value = 99;
  }
  if (minesInput.value < 10) {
    minesInput.value = 10;
  }
}

function addPressedEffect() {
  newGameButton.classList.add('active');
}

function removePressedEffect() {
  newGameButton.classList.remove('active');
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleNewGame();
    addPressedEffect();
    setTimeout(removePressedEffect, 200); // Удалить эффект нажатия через 200 миллисекунд
  }
});

newGameButton.addEventListener('click', handleNewGame);

// Функция инициализации игры при загрузке страницы
function initGame() {
  // Создаем варианты выбора размера поля
  Object.keys(boardSizes).forEach((size) => {
    const option = document.createElement('option');
    option.value = `${boardSizes[size].rows}x${boardSizes[size].cols}`;
    option.textContent = size;
    sizeSelect.appendChild(option);
  });

  // Устанавливаем значение выбранного размера поля и количества мин по умолчанию
  sizeSelect.value = `${numRows}x${numCols}`;
  minesInput.value = numMines;
  // Отрисовываем игровое поле
  renderGameBoard();
}
// Вызываем функцию инициализации игры при загрузке страницы
initGame();

toggleThemeButton.addEventListener('click', () => {
  toggleTheme();
});

function loadTheme() {
  const savedTheme = localStorage.getItem('isDarkMode');

  if (savedTheme !== null) {
    isDarkMode = JSON.parse(savedTheme);

    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  seconds = parseInt(localStorage.getItem('seconds'), 10) || 0;
  if (movesCount !== 0 && !timerRunning) {
    startTimer();
  }
});
