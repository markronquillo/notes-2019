import React, { useState, useEffect } from "react";
import produce from "immer";

import "./App.css";
const gridHeight = 50;
const gridWidth = 75;
function App() {
  const [grid, setGrid] = useState(() => {
    return Array(gridHeight).fill(Array(gridWidth).fill(0));
  });

  useEffect(() => {
    console.log("grid was updated");

    setTimeout(() => {
      for (var row = 0; row < gridHeight; row++) {
        for (var col = 0; col < gridWidth; col++) {
          produce(grid, newGrid => {
            newGrid[row][col] = 0;
            // setGrid(newGrid);
          });
        }
      }
    }, 2000);
  }, []);

  return (
    <div className="App">
      <div classname="controls"></div>
      <ul
        className="grid"
        style={{
          gridTemplateRows: `repeat(${gridHeight}, 15px)`,
          gridTemplateColumns: `repeat(${gridWidth}, 15px)`
        }}
      >
        {grid.map((row, ri) => {
          return row.map((col, ci) => {
            return (
              <li
                className="cell"
                style={{
                  background: grid[ri][ci] === 1 ? "red" : "white"
                }}
                onClick={() => {
                  setGrid(
                    produce(grid, newGrid => {
                      newGrid[ri][ci] = newGrid[ri][ci] === 0 ? 1 : 0;
                      setGrid(newGrid);
                    })
                  );
                }}
              ></li>
            );
          });
        })}
      </ul>
    </div>
  );
}

export default App;
