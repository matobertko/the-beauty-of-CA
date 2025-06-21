// --------------------------------------------------------------------------------------
// -------------------------------- UI & variables --------------------------------------
// --------------------------------------------------------------------------------------

// Global variables for p5 canvases
let patternPreviewSketch, imagePreviewSketch, mainSketch, overlaySketch;

// Mode switching functionality
const modeSelect = document.getElementById('modeSelect');
const imageModifierMode = document.getElementById('imageModifierMode');
const patternGeneratorMode = document.getElementById('patternGeneratorMode');

// mode switcher
modeSelect.addEventListener('change', function() {
    if (isImageMode()) {
        imageModifierMode.style.display = 'block';
        patternGeneratorMode.style.display = 'none';
    } 
    else {
        imageModifierMode.style.display = 'none';
        patternGeneratorMode.style.display = 'block';
    }
});

function isImageMode(){
  if (modeSelect?.value == 'image-modifier') {
    return true;
  }
  return false;
};


// Slider value updates
function setupSlider(sliderId) {
    const slider = document.getElementById(sliderId);
    const valueSpan = slider.parentElement.querySelector('.slider-value');
    
    slider.addEventListener('input', function() {
        valueSpan.textContent = this.value;
    });
}

// generator mode:
setupSlider('patternRule');
setupSlider('patternCellSize');
setupSlider('patternRandomness');

// Modal functionality
const aboutLink = document.getElementById('aboutLink');
const aboutModal = document.getElementById('aboutModal');
const modalClose = document.getElementById('modalClose');

aboutLink.addEventListener('click', function() {
    aboutModal.style.display = 'flex';
});

modalClose.addEventListener('click', function() {
    aboutModal.style.display = 'none';
});

aboutModal.addEventListener('click', function(e) {
    if (e.target === aboutModal) {
        aboutModal.style.display = 'none';
    }
});

const helpLink = document.getElementById('helpLink');
const helpModal = document.getElementById('helpModal');
const helpModalClose = document.getElementById('helpModalClose');

helpLink.addEventListener('click', function() {
  helpModal.style.display = 'flex';
});

helpModalClose.addEventListener('click', function() {
  helpModal.style.display = 'none';
});

helpModal.addEventListener('click', function(e) {
    if (e.target === helpModal) {
      helpModal.style.display = 'none';
    }
});

// HIDE & SHOW UI BUTTON
const toggleBtn = document.getElementById('toggleUIPanel');
const container = document.querySelector('.container');

toggleBtn.addEventListener('click', () => {
    container.classList.toggle('hide-ui');
    toggleBtn.textContent = container.classList.contains('hide-ui') ? 'Show UI Panel' : 'Hide UI Panel';
    mainSketch.resizeMainCanvas();
});


// --------------------------------------------------------------------------------------
// --------------------------- CA PATTERN GENERATOR -------------------------------------
// --------------------------------------------------------------------------------------

let patternCellSizeSlider;
let patterncellSizeValueSpan;
let patternRuleSlider;
let patternRuleValueSpan;
let patternRandomnessSlider;
let patternRandomnessValueSpan;
let patternBoundary;
let selectedValue;
let swapColorButton;
let patternFg;
let patternBg;

function createPatternPreviewSketch() {
        return function(p) {
        p.setup = function() {
            let canvas = p.createCanvas(370,370);
            canvas.parent('patternPreviewCanvas');

            p.colorMode(p.RGB);
            p.noLoop();

            // RULE
            patternRuleSlider = document.getElementById('patternRule');
            patternRuleValueSpan = document.querySelector('.slider-value');
            patternRuleValueSpan.textContent = patternRuleSlider.value;
            patternRuleSlider.addEventListener('input', () => {
                patternRuleValueSpan.textContent = patternRuleSlider.value;
                redrawCanvas(p);
            });

            // CELL SIZE
            patternCellSizeSlider = document.getElementById('patternCellSize');
            patterncellSizeValueSpan = document.querySelector('.slider-value');
            patterncellSizeValueSpan.textContent = patternCellSizeSlider.value;
            patternCellSizeSlider.addEventListener('input', () => {
                patterncellSizeValueSpan.textContent = patternCellSizeSlider.value;
                redrawCanvas(p);
            });

            // RANDOMNESS
            patternRandomnessSlider = document.getElementById('patternRandomness');
            patternRandomnessValueSpan = document.querySelector('.slider-value');
            patternRandomnessValueSpan.textContent = patternRandomnessSlider.value;
            patternRandomnessSlider.addEventListener('input', () => {
                patternRandomnessValueSpan.textContent = patternRandomnessSlider.value;
                redrawCanvas(p);
            });

            // BOUNDARY CONDITION
            patternBoundary = document.getElementById('patternBoundary');
            patternBoundary.addEventListener('change', function () {
                redrawCanvas(p);
            });

            // COLORS + SWAP
            swapColorButton = document.getElementById('swap-color-btn');
            patternFg = document.getElementById('pattern-fg');
            patternBg = document.getElementById('pattern-bg');

            patternFg.addEventListener('input', () => {
                redrawCanvas(p);
            });
            patternBg.addEventListener('input', () => {
                redrawCanvas(p);
            });

            swapColorButton.addEventListener('click', () => {
                const temp = patternFg.value;
                patternFg.value = patternBg.value;
                patternBg.value = temp;
                redrawCanvas(p);
            });
        };

        p.draw = function() {
            p.background(255);
            const ca = new CA(p.width, p.height, patternRuleSlider.value, patternCellSizeSlider.value, patternRandomnessSlider.value, patternFg.value, patternBg.value, patternBoundary.value);
            const basicGrid = ca.generateGrid();
            
            if (basicGrid) {
                const gridWidth = basicGrid[0].length;
                const gridHeight = basicGrid.length;
                const cellSize = ca.cellSize;
                
                p.translate((p.width - gridWidth * cellSize)/2, 0);

                p.noStroke();
                basicGrid.forEach((row, r) => {
                    row.forEach((cell, c) => {
                    p.fill(cell == 0 ? ca.bgColor : ca.fgColor);
                    p.rect(c * cellSize, r * cellSize, cellSize + 1, cellSize + 1);
                    });
            });
            } else {
                p.background(150);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(20);
                p.fill(255);
                p.text('Default draw', p.width/2, p.height/2);
            }
        };
    };
}

class CA {
  constructor(w = 370, h = 370, ruleNumber = 26, cellSizeVal = 10, randomnessVal = 0, fgCol = '#000000', bgCol = '#ffffff', borderMode = 'mirror') {
    this.rule = ruleNumber;
    this.cellSize = cellSizeVal;
    this.randomness = randomnessVal;
    this.fgColor = fgCol;
    this.bgColor = bgCol;
    this.width = w;
    this.height = h;
    this.borderMode = borderMode; //'periodic','mirror','copy','fg','bg'
  }

  /**
   * @private
   * Converts rule number to 8-bit binary representation
   * @returns {Array} Array of bits representing the rule
   * e.g., Rule 30 becomes [0,0,0,1,1,1,1,0]
   */
  #convertRuleToBits() {
    return Array.from({ length: 8 }, (_, i) => (this.rule >> i) & 1).reverse();
  }

  /**
   * @private
   * Determines next cell state based on neighbors
   * @param {*} l left neighbor
   * @param {*} c current cell
   * @param {*} r right neighbor
   * @param {*} bits array of bits representing the rule
   * @returns {number} Next state of the cell (0 or 1)
   */
  #getNextCellState(l, c, r, bits) {
    const idx = parseInt(`${l}${c}${r}`, 2);
    return bits[7 - idx];
  }

  /**
   * @private
   * Gets the neighbor cell value based on the border mode.
   * @param {Array} prev Previous row of cells  
   * @param {number} index Index of the cell to get the neighbor for
   * @return {number} Value of the neighbor cell
  */
  #getNeighbor(prev, index) {
    const cols = prev.length;
    switch (this.borderMode) {
        case 'mirror':
        if (index < 0) return prev[1];
        if (index >= cols) return prev[cols - 2];
        return prev[index];

        case 'copy':
        if (index < 0) return prev[0];
        if (index >= cols) return prev[cols - 1];
        return prev[index];

        case 'fg':
        if (index < 0 || index >= cols) return 1;
        return prev[index];

        case 'bg':
        if (index < 0 || index >= cols) return 0;
        return prev[index];

        default:      
        return prev[(index + cols) % cols]; // periodic
    }
  }

  /**
   * Generates a grid based on the cellular automaton rules.
   * @returns 2D array representing the automaton state
   */
   generateGrid() {
    const cols = Math.floor(this.width / this.cellSize);
    const rows = Math.floor(this.height / this.cellSize);
    const basicGrid = [];
    const bits = this.#convertRuleToBits();

    // Initialize the first row with a single cell in the center
    let firstRow = new Array(cols).fill(0);
    firstRow[Math.floor(cols / 2)] = 1;

    // Randomly set some cells in the first row based on randomness factor
    for (let i = 0; i < cols; i++) {
      if (Math.random() < this.randomness)
        firstRow[i] = Math.random() < 0.5 ? 0 : 1;
    }
    basicGrid.push(firstRow);

    // Generate subsequent rows based on the first row and the rule
    for (let r = 1; r < rows; r++) {
      const prev = basicGrid[r - 1];
      const next = new Array(cols).fill(0);
      for (let c = 0; c < cols; c++) {
        const left = this.#getNeighbor(prev, c - 1);
        const mid = prev[c];
        const right = this.#getNeighbor(prev, c + 1);
        next[c] = this.#getNextCellState(left, mid, right, bits);
      }

      basicGrid.push(next);
    }
    return basicGrid;
  }

  switchColors () {
    [this.bgColor, this.fgColor] = [this.fgColor, this.bgColor];
  }
}



// --------------------------------------------------------------------------------------
// --------------------------------- CA SLIDERS -----------------------------------------
// --------------------------------------------------------------------------------------


const ruleSet = [0, 26, 250, 123, 110, 30];
const minLevel = 2;
const maxLevel = 6;

// COLORS + SWAP
let swapColorButton2 = document.getElementById('swap-color-btn-2');
let imageColorFg = document.getElementById('pattern-fg-2');
let imageColorBg = document.getElementById('pattern-bg-2');
let colorSet = generateInterpolatedColors(imageColorFg.value, imageColorBg.value, 2);
swapColorButton2.addEventListener('click', () => {
    const temp = imageColorFg.value;
    imageColorFg.value = imageColorBg.value;
    imageColorBg.value = temp;
});

const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');
const levelDisplay = document.getElementById('levelDisplay');
const slidersContainer = document.getElementById('slidersContainer');

let currentLevel = parseInt(levelDisplay.textContent, 10);
let currentSliderValue = 0;
let currentSliderIndex = 1;

function createSliders(levelCount) {
    slidersContainer.innerHTML = '';

    for (let i = 1; i < levelCount; i++) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'input-group';

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'slider';
        slider.id = `level${i}`;
        slider.min = 0;
        slider.max = 255;
        slider.step = 1;
        slider.value = ruleSet[i];

        const valueSpan = document.createElement('span');
        valueSpan.className = 'slider-value';
        valueSpan.id = `levelValue${i}`;
        valueSpan.textContent = ruleSet[i];

        // interactions
        slider.addEventListener('input', () => {
            valueSpan.textContent = slider.value;
            ruleSet[i] = parseInt(slider.value, 10);
            currentSliderValue = ruleSet[i]; // update
            currentSliderIndex = i;
            positionOverlayBelowSlider(slider);
            redrawCanvas(overlaySketch);
        });
        slider.addEventListener('mousedown', () => {
            currentSliderValue = parseInt(slider.value, 10); // update
            currentSliderIndex = i;
            positionOverlayBelowSlider(slider);
            redrawCanvas(overlaySketch);
        });
        slider.addEventListener('mouseup', () => {
            hideOverlay();
        });
        slider.addEventListener('touchstart', () => {
            currentSliderValue = parseInt(slider.value, 10); // update
            currentSliderIndex = i;
            positionOverlayBelowSlider(slider);
            redrawCanvas(overlaySketch);
        });
        slider.addEventListener('touchend', () => {
            hideOverlay();
        });

        // putting inside DOM
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueSpan);
        groupDiv.appendChild(sliderContainer);
        slidersContainer.appendChild(groupDiv);
    }
}

function updateLevel(newLevel) {
    currentLevel = newLevel;
    levelDisplay.textContent = currentLevel;
    createSliders(currentLevel);
    imagePreviewSketch.redraw();
}

// Event Listeners
decreaseBtn.addEventListener('click', () => {
    if (currentLevel > minLevel) {
        updateLevel(currentLevel - 1);
    }
});

increaseBtn.addEventListener('click', () => {
    if (currentLevel < maxLevel) {
        updateLevel(currentLevel + 1);
    }
});

// Canvas for the sliders
const canvasOverlay = document.getElementById('canvasOverlay');


function positionOverlayBelowSlider(slider) {
    const rect = slider.getBoundingClientRect();
    canvasOverlay.style.left = `${rect.left + 55}px`;
    canvasOverlay.style.top = `${rect.bottom + window.scrollY + 20}px`; // below the slider
    canvasOverlay.style.display = 'block';
}

function hideOverlay() {
    canvasOverlay.style.display = 'none';
}

function createOverlaySketch() {
    return function(p) {
        p.setup = function() {
            let canvas = p.createCanvas(222, 222);
            canvas.parent('canvasOverlay');
            p.noLoop();
        };

        p.draw = function() {
            colorSet = generateInterpolatedColors(imageColorFg.value, imageColorBg.value, currentLevel);
            const ca = new CA(p.width, p.height, currentSliderValue, 10, 0);

            const basicGrid = ca.generateGrid();
            p.background(colorSet[currentSliderIndex]);
            
            if (basicGrid) {
                const gridWidth = basicGrid[0].length;
                const cellSize = ca.cellSize; 
                
                p.translate((p.width - gridWidth * cellSize)/2, 0);

                p.noStroke();
                basicGrid.forEach((row, r) => {
                    row.forEach((cell, c) => {
                    p.fill(cell == 0 ? colorSet[currentSliderIndex] : colorSet[currentSliderIndex-1]);
                    p.rect(c * cellSize, r * cellSize, cellSize + 1, cellSize + 1);
                    });
            });
            } else {
                p.background(150);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(20);
                p.fill(255);
                p.text('Default draw', p.width/2, p.height/2);
            }
        };
    };
}


// --------------------------------------------------------------------------------------
// ------------------------------- IMAGE MODIFIER ---------------------------------------
// --------------------------------------------------------------------------------------


let originalImg;
let workingImg;

let fileInput;
let showOriginalCheckbox;
let cellSizeSlider;
let cellSizeValueSpan;
let levelGrid = [];


function createImagePreviewSketch() {
    return function(p) {
        p.setup = function() {
            let canvas = p.createCanvas(370,370);
            canvas.parent('imagePreviewCanvas');

            p.colorMode(p.RGB);
            p.noLoop();

            // -------------------------------------
            // FILE INPUT
            const dropZone = document.getElementById('drop-zone');
            const fileInput = document.getElementById('file-input');

            // Click on drop zone triggers file input
            dropZone.addEventListener('click', () => fileInput.click());

            // File selection via dialog
            fileInput.addEventListener('change', handleFiles);

            // Handle drag over
            dropZone.addEventListener('dragover', (e) => {
              e.preventDefault();
              dropZone.classList.add('dragover');
            });

            // Remove drag styling when leaving
            dropZone.addEventListener('dragleave', () => {
              dropZone.classList.remove('dragover');
            });

            // Drop file
            dropZone.addEventListener('drop', (e) => {
              e.preventDefault();
              dropZone.classList.remove('dragover');

              const file = e.dataTransfer.files[0];
              if (file) processFile(file);
            });

            // Shared file handling logic
            function handleFiles(event) {
              const file = event.target.files[0];
              if (file) processFile(file);
            }

            function processFile(file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const dataURL = e.target.result;
                const fileType = file.type;

                const fakeFile = {
                  data: dataURL,
                  type: 'image',
                  subtype: fileType.split('/')[1]
                };

                handleFile(fakeFile, p);
              };
              reader.readAsDataURL(file);
            }
            // -------------------------------------

            // CHECKBOX
            showOriginalCheckbox = document.getElementById('showOriginal');
            showOriginalCheckbox.checked = false;
            showOriginalCheckbox.addEventListener('change', () => redrawCanvas(p));

            // CELL SIZE
            cellSizeSlider = document.getElementById('imageCellSize');
            cellSizeValueSpan = document.getElementById('cellSizeValue');
            cellSizeValueSpan.textContent = cellSizeSlider.value;
            cellSizeSlider.addEventListener('input', () => {
                cellSizeValueSpan.textContent = cellSizeSlider.value;
                redrawCanvas(p);
            });

            p.redraw();
        };

        p.draw = function() {
            p.background(255);

            if (originalImg) {
                let imageToDisplay;

                if (showOriginalCheckbox.checked) {
                imageToDisplay = originalImg;
                } else {
                let cellSize = parseInt(cellSizeSlider.value);

                if (cellSize <= 1) {
                    workingImg = originalImg.get();
                    workingImg.loadPixels();

                    for (let y = 0; y < workingImg.height; y++) {
                    let row = [];
                    for (let x = 0; x < workingImg.width; x++) {
                        let index = (y * workingImg.width + x) * 4;
                        let r = workingImg.pixels[index];
                        let g = workingImg.pixels[index + 1];
                        let b = workingImg.pixels[index + 2];
                        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
                        let quantizedIndex = p.floor((gray / 256) * currentLevel);
                        row.push(quantizedIndex);
                    }
                    levelGrid.push(row);
                    }

                    workingImg.updatePixels();

                } else {
                    workingImg = p.createImage(originalImg.width, originalImg.height);
                    originalImg.loadPixels();
                    workingImg.loadPixels();

                    let rows = p.ceil(originalImg.height / cellSize);
                    let cols = p.ceil(originalImg.width / cellSize);
                    levelGrid = new Array(rows);

                    for (let gridY = 0; gridY < rows; gridY++) {
                    let y = gridY * cellSize;
                    let currentCellHeight = p.min(cellSize, originalImg.height - y);
                    levelGrid[gridY] = [];

                    for (let gridX = 0; gridX < cols; gridX++) {
                        let x = gridX * cellSize;
                        let currentCellWidth = p.min(cellSize, originalImg.width - x);

                        let totalR = 0, totalG = 0, totalB = 0, count = 0;

                        for (let j = 0; j < currentCellHeight; j++) {
                            for (let i = 0; i < currentCellWidth; i++) {
                                let px = x + i;
                                let py = y + j;
                                let index = (py * originalImg.width + px) * 4;
                                totalR += originalImg.pixels[index];
                                totalG += originalImg.pixels[index + 1];
                                totalB += originalImg.pixels[index + 2];
                                count++;
                            }
                        }

                        let avgR = totalR / count;
                        let avgG = totalG / count;
                        let avgB = totalB / count;
                        let gray = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
                        let quantizedIndex = p.floor((gray / 256) * currentLevel);

                        levelGrid[gridY][gridX] = quantizedIndex;

                        for (let j = 0; j < currentCellHeight; j++) {
                            for (let i = 0; i < currentCellWidth; i++) {
                                let wx = x + i;
                                let wy = y + j;
                                let idx = (wy * workingImg.width + wx) * 4;
                                workingImg.pixels[idx] = avgR;
                                workingImg.pixels[idx + 1] = avgG;
                                workingImg.pixels[idx + 2] = avgB;
                                workingImg.pixels[idx + 3] = 255;
                            }
                        }
                    }
                    }
                    workingImg.updatePixels();
                }

                workingImg.filter(p.GRAY);
                workingImg.filter(p.POSTERIZE, currentLevel);
                imageToDisplay = workingImg;
                }

                p.image(imageToDisplay, 0, 0, p.width, p.height, 0, 0, imageToDisplay.width, imageToDisplay.height, p.CONTAIN);             
            } else {
                p.fill(0);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(16);
                p.text('Please load an image using the file chooser.', p.width / 2, p.height / 2);
            }
        };
    };
}

function handleFile(file, p) {
  if (file.type === 'image' && (file.subtype === 'png' || file.subtype === 'jpeg' || file.subtype === 'jpg')) {
    p.loadImage(file.data, loadedImage => {
      originalImg = loadedImage;
      redrawCanvas(p);
    }, () => {
      alert("There was an error loading the image. Please try a different file or format.");
      originalImg = null;
      if (fileInput) fileInput.elt.value = "";
      redrawCanvas(p);
    });
  } else {
    alert('Please select a valid image file (PNG or JPG).');
    originalImg = null;
    if (fileInput) fileInput.elt.value = "";
    redrawCanvas(p);
  }
}

// --------------------------------------------------------------------------------------
// -------------------------------- MAIN SKETCH -----------------------------------------
// --------------------------------------------------------------------------------------

let firstLoop = true;

function createMainSketch() {
    return function(p) {
        let canvas;

        p.setup = function() {
            let container = document.getElementById('mainCanvas');
            canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
            canvas.parent(container);

            p.noLoop();

            // Generate button
            document.getElementById('generateBtn').addEventListener('click', function() {
              firstLoop = false;
                redrawCanvas(p);
            });
        };

        p.draw = function() {
            if (firstLoop) {
                p.background(150);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(20);
                p.fill(255);
                p.text('Here you can see the render after it has been generated ("Generate" button).', p.width/2, p.height/2);
                return;
            }
            if (isImageMode()) {
                if (levelGrid.length) {
                    colorSet = generateInterpolatedColors(imageColorFg.value, imageColorBg.value, currentLevel, p);
                    p.background(colorSet[0]);

                    const imageCA = new ImageCA(levelGrid, ruleSet, colorSet, 0.1);
                    const grid = imageCA.generateGrid();
                   
                    if (grid && colorSet) {
                        const gridWidth = grid[0].length;
                        const gridHeight = grid.length;
                        const cellSize = p.min(p.width / gridWidth, p.height / gridHeight);
                        
                        p.translate((p.width - gridWidth * cellSize)/2, (p.height - gridHeight * cellSize)/2);

                        p.noStroke();
                        grid.forEach((row, r) => {
                            row.forEach((cell, c) => {
                            cell = cell < 0 ? 0 : cell;
                            p.fill(colorSet[cell]);
                            p.rect(c * cellSize, r * cellSize, cellSize + 1, cellSize + 1);
                            });
                    });
                    } else {
                        p.background(150);
                        p.textAlign(p.CENTER, p.CENTER);
                        p.textSize(20);
                        p.fill(255);
                        p.text('Default draw', p.width/2, p.height/2);
                    }
                }   
            } else {
                const ca = new CA(p.width, p.height, patternRuleSlider.value, patternCellSizeSlider.value, patternRandomnessSlider.value, patternFg.value, patternBg.value, patternBoundary.value);
                const basicGrid = ca.generateGrid();

                p.background(ca.bgColor);
                
                if (basicGrid) {
                    const gridWidth = basicGrid[0].length;
                    const gridHeight = basicGrid.length;
                    const cellSize = ca.cellSize;

                    p.translate((p.width - gridWidth * cellSize)/2, 0);

                    p.noStroke();
                    basicGrid.forEach((row, r) => {
                        row.forEach((cell, c) => {
                        p.fill(cell == 0 ? ca.bgColor : ca.fgColor);
                        p.rect(c * cellSize, r * cellSize, cellSize + 1, cellSize + 1);
                        });
                });
                } else {
                    p.background(150);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(20);
                    p.fill(255);
                    p.text('Default draw', p.width/2, p.height/2);
                }
            }
        };

        p.windowResized = function() {
            resizeCanvasToContainer();
        };

        p.resizeMainCanvas = function() {
            resizeCanvasToContainer();
        };

        function resizeCanvasToContainer() {
            const c = document.getElementById('mainCanvas');
            const w = c.clientWidth;
            const h = c.clientHeight;
            p.resizeCanvas(w, h);
            redrawCanvas(p);
        }
    };
}


class ImageCA {
  constructor(levels, ruleSet, colorSet, randomness = 0.1){
    this.levels = levels; // 2D array of image with cells with levels
    this.ruleSet = ruleSet; // set of rules for the cellular automata 
    this.colorSet = colorSet;
    this.rows = levels.length;
    this.cols = levels[0].length;
    this.randomness = randomness;
  }

  /**
   * @private
   * Gets the neighbor cell value based on the border mode.
   * @param {Array} prev Previous row of cells  
   * @param {number} index Index of the cell to get the neighbor for
   * @return {number} Value of the neighbor cell
  */
  #getNeighbor(prev, index) {
    // 
    switch (undefined) {
      case 'mirror':
        if (index < 0) return prev[1];
        if (index >= this.cols) return prev[this.cols - 2];
        return prev[index];

      case 'copy':
        if (index < 0) return prev[0];
        if (index >= this.cols) return prev[this.cols - 1];
        return prev[index];

      default:      
        return prev[(index + this.cols) % this.cols]; // periodic
    }
  }

  /**
   * @private
   * Converts rule number to 8-bit binary representation
   * @returns {Array} Array of bits representing the rule
   * e.g., Rule 30 becomes [0,0,0,1,1,1,1,0]
   */
  #convertRuleToBits(rule) {
    return Array.from({ length: 8 }, (_, i) => (rule >> i) & 1).reverse();
  }

  /**
   * @private
   * Determines next cell state based on neighbors
   * @param {*} l left neighbor
   * @param {*} c current cell
   * @param {*} r right neighbor
   * @param {*} bits array of bits representing the rule
   * @returns {number} Next state of the cell (0 or 1)
   */
  #getNextCellState(l, c, r, rule) {
    const bits = this.#convertRuleToBits(rule);
    const idx = parseInt(`${l}${c}${r}`, 2);
    return bits[7 - idx];
  }

  /**
   * Generates a grid based on the cellular automaton rules.
   * @returns 2D array representing the automaton state
   */
  #generateMask() {
    // new 2D array, filled with 0; mask values: fg = 1, bg = 0
    const mask = Array.from({ length: this.rows }, () => Array(this.cols).fill(0)); 

    // random values for the first row based on randomness factor
    for (let i = 0; i < this.cols; i++) {
      mask[0][i] = Math.random() < this.randomness ? 1 : 0;
    }

    // other rows
    for (let r = 1; r < this.rows; r++) {
      const prevRowLevels = this.levels[r - 1];
      const prevRowMask = mask[r - 1];
      
      for (let c = 0; c < this.cols; c++) {
        const curLevel = this.levels[r][c];
        const curRule =  this.ruleSet[curLevel];

        // adjust mask values for all levels except darkest one (flag: 0)
        if (curLevel != 0) {
          // get levels of the neighbourhood
          const left = this.#getNeighbor(prevRowLevels, c - 1);
          const mid = prevRowLevels[c];
          const right = this.#getNeighbor(prevRowLevels, c + 1);

          // case 1: all same as current -> use current's rule
          if (left == curLevel && mid == curLevel && right == curLevel) {
            const leftMask = this.#getNeighbor(prevRowMask, c - 1);
            const midMask = this.#getNeighbor(prevRowMask, c);
            const righttMask = this.#getNeighbor(prevRowMask, c + 1);
            mask[r][c] = this.#getNextCellState(leftMask, midMask, righttMask, curRule);
          } 
          // case 2: all diff to current -> choose fg with probability 'this.randomness'
          else if (left != curLevel && mid != curLevel && right != curLevel) {
            mask[r][c] = Math.random() < this.randomness ? 1 : 0;
          } 
          // case 3: mix -> choose bg (=> no explicit change)
          else {
            continue;
          }
        }
      }
    }
    return mask;
  }

  generateGrid(){
    const mask = this.#generateMask();
    const grid = this.levels.map((row, i) =>
      row.map((level, j) => {
        const m = mask[i][j];
        return m === 1 ? level - 1 : level;
      })
    );
    return grid;
  }
}

// This function generates an array of p5.Color objects
// interpolated between two hex colors in RGB space.
function generateInterpolatedColors(hexColor1, hexColor2, steps) {
  let colorsArray = [];
  new p5(( p ) => {

    let c1 = p.color(hexColor1); // Parse the first hex color string
    let c2 = p.color(hexColor2); // Parse the second hex color string

    if (steps <= 0) {
    // If steps is zero or negative, return an empty array
    } else if (steps === 1) {
      colorsArray.push(c1); // If only one step, return the starting color
    } else {
      for (let i = 0; i < steps; i++) {
        // Calculate the interpolation amount (0.0 to 1.0)
        let t = i / (steps - 1); 
        let interpolated = p.lerpColor(c1, c2, t);
        colorsArray.push(interpolated);
      }
    }
  });

  return colorsArray;
}

// --------------------------------------------------------------------------------------
// --------------------------- INITIALIZE SKETCHES --------------------------------------
// --------------------------------------------------------------------------------------

// Initialize p5 sketches
imagePreviewSketch = new p5(createImagePreviewSketch());
patternPreviewSketch = new p5(createPatternPreviewSketch());
mainSketch = new p5(createMainSketch());
overlaySketch = new p5(createOverlaySketch());

function redrawCanvas(p) {
  p.redraw();
}

// Initialize CA sliders and posterize input
updateLevel(currentLevel);

// --------------------------------------------------------------------------------------
// ---------------------------------- EXPORT --------------------------------------------
// --------------------------------------------------------------------------------------



// Export + parameter buttons
document.querySelectorAll(".export-buttons .btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const text = btn.textContent.trim();
    if (text === "JPG" || text === "PNG") {
      exportImage(text.toLowerCase());
    } else if (text === "Save Parameters") {
      saveParameters();
    } else if (text === "Load Parameters") {
      loadParameters();
    }
  });
});

function exportImage(imageType) {
  const scale = parseFloat(document.getElementById('quality-select')?.value) || 1.0;
  const exportCanvas = document.createElement('canvas');  // Create an offscreen canvas with scaled dimensions
  exportCanvas.width = mainSketch.width * scale;
  exportCanvas.height = mainSketch.height * scale;
  const ctx = exportCanvas.getContext('2d');

  
  ctx.imageSmoothingEnabled = false; // Preserve pixelated look
  const originalCanvas = mainSketch.canvas;
  ctx.drawImage(originalCanvas, 0, 0, exportCanvas.width, exportCanvas.height); // Draw scaled content onto export canvas

  // Export as image
  const mimeType = imageType === 'jpg' || imageType === 'jpeg' ? 'image/jpeg' : 'image/png';
  exportCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `beautyOfCA_render_${timestamp}.${imageType}`;
    a.click();
    URL.revokeObjectURL(url);
  }, mimeType);
}

// --------------------------------------------------------------------------------------
// ---------------------------------- PARAMS --------------------------------------------
// --------------------------------------------------------------------------------------

function getCurrentParams() {
  let paramsObject;
  if (isImageMode()) {
    paramsObject = {
      imageCellSize: parseInt(document.getElementById('imageCellSize')?.value) || 0,
      levelDisplay: parseInt(document.getElementById('levelDisplay')?.innerText) || 0,
      setOfRules: ruleSet,
      fgColor: document.getElementById('pattern-fg-2')?.value || 0,
      bgColor: document.getElementById('pattern-bg-2')?.value || 0
    };
  } else {
    paramsObject = {
      patternRule: parseInt(document.getElementById('patternRule')?.value) || 30,
      patternCellSize: parseInt(document.getElementById('patternCellSize')?.value) || 16,
      patternRandomness: parseInt(document.getElementById('patternRandomness')?.value) || 0,
      patternBoundary: document.getElementById('patternBoundary')?.value || "mirror",
      fgColor: document.getElementById('pattern-fg')?.value || "#000000",
      bgColor: document.getElementById('pattern-bg')?.value || "#ffffff"
    };
  } 
  return paramsObject;
}

function saveParameters() {
  const currentParams = getCurrentParams();
  const formattedJSON = JSON.stringify(currentParams, null, 2);
  const blob = new Blob([formattedJSON], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "beautyOfCA_parameters.json";
  a.click();
  URL.revokeObjectURL(url);
}


function loadParameters() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loadedParams = JSON.parse(event.target.result);
        if (isImageMode()) {
          document.getElementById('imageCellSize').value = loadedParams.imageCellSize;
          document.getElementById('levelDisplay').textContent = loadedParams.levelDisplay;
          let loadedRuleSet = loadedParams.setOfRules;
          if (loadedRuleSet.length != 6) throw "incorrect length of the array of rules";
          for (let i = 0; i < ruleSet.length; i++) {
            ruleSet[i] = loadedRuleSet[i];
          }
          updateLevel(loadedParams.levelDisplay);
          document.getElementById('pattern-fg-2').value = loadedParams.fgColor;
          document.getElementById('pattern-bg-2').value = loadedParams.bgColor;
        } else {
          document.getElementById('patternRule').value = loadedParams.patternRule;
          document.getElementById('patternCellSize').value = loadedParams.patternCellSize;
          document.getElementById('patternRandomness').value = loadedParams.patternRandomness;
          document.getElementById('pattern-fg').value = loadedParams.fgColor;
          document.getElementById('pattern-bg').value = loadedParams.bgColor;
          patternPreviewSketch.redraw();
        } 


      } catch (err) {
        alert("Failed to load parameters.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
