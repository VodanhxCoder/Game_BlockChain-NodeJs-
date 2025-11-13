import React, { useState, useRef, useEffect } from "react";

export default function GridEditor({ rows, cols, onChange, initialPattern }) {
  // Validate and sanitize inputs
  const validRows = Math.max(1, Math.min(20, parseInt(rows) || 4));
  const validCols = Math.max(1, Math.min(20, parseInt(cols) || 8));

  // Initialize grid pattern
  const [grid, setGrid] = useState(() => {
    if (initialPattern && Array.isArray(initialPattern) && initialPattern.length === validRows) {
      return initialPattern;
    }
    return Array(validRows)
      .fill(null)
      .map(() => Array(validCols).fill(false));
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(true); // true = fill, false = erase
  const gridRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  // Update parent when grid changes (debounced)
  useEffect(() => {
    if (onChange) {
      // Clear previous timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Debounce the update to avoid too many calls
      updateTimeoutRef.current = setTimeout(() => {
        onChange(grid);
      }, 100);
    }
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [grid, onChange]);

  // Update grid when rows/cols change
  useEffect(() => {
    setGrid((prevGrid) => {
      const newGrid = Array(validRows)
        .fill(null)
        .map(() => Array(validCols).fill(false));

      // Copy existing pattern
      for (let r = 0; r < Math.min(validRows, prevGrid.length); r++) {
        for (let c = 0; c < Math.min(validCols, prevGrid[r]?.length || 0); c++) {
          newGrid[r][c] = prevGrid[r][c];
        }
      }
      return newGrid;
    });
  }, [validRows, validCols]);

  const toggleCell = (row, col) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((r) => [...r]);
      newGrid[row][col] = !newGrid[row][col];
      return newGrid;
    });
  };

  const fillCell = (row, col, value) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((r) => [...r]);
      if (newGrid[row][col] !== value) {
        newGrid[row][col] = value;
      }
      return newGrid;
    });
  };

  const handleMouseDown = (row, col) => {
    setIsDrawing(true);
    setDrawMode(!grid[row][col]);
    toggleCell(row, col);
  };

  const handleMouseEnter = (row, col) => {
    if (isDrawing) {
      fillCell(row, col, drawMode);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTouchStart = (e, row, col) => {
    e.preventDefault();
    setIsDrawing(true);
    setDrawMode(!grid[row][col]);
    toggleCell(row, col);
  };

  const handleTouchMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.dataset.row && element.dataset.col) {
      const row = parseInt(element.dataset.row);
      const col = parseInt(element.dataset.col);
      fillCell(row, col, drawMode);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearGrid = () => {
    setGrid(
      Array(validRows)
        .fill(null)
        .map(() => Array(validCols).fill(false))
    );
  };

  const fillAll = () => {
    setGrid(
      Array(validRows)
        .fill(null)
        .map(() => Array(validCols).fill(true))
    );
  };

  const invertGrid = () => {
    setGrid((prevGrid) => prevGrid.map((row) => row.map((cell) => !cell)));
  };

  const fillPattern = (patternType) => {
    const newGrid = Array(validRows)
      .fill(null)
      .map(() => Array(validCols).fill(false));

    switch (patternType) {
      case "checkerboard":
        for (let r = 0; r < validRows; r++) {
          for (let c = 0; c < validCols; c++) {
            newGrid[r][c] = (r + c) % 2 === 0;
          }
        }
        break;
      case "diamond":
        const centerRow = Math.floor(validRows / 2);
        const centerCol = Math.floor(validCols / 2);
        for (let r = 0; r < validRows; r++) {
          for (let c = 0; c < validCols; c++) {
            const distance = Math.abs(r - centerRow) + Math.abs(c - centerCol);
            newGrid[r][c] = distance <= Math.min(centerRow, centerCol);
          }
        }
        break;
      case "borders":
        for (let r = 0; r < validRows; r++) {
          for (let c = 0; c < validCols; c++) {
            newGrid[r][c] = r === 0 || r === validRows - 1 || c === 0 || c === validCols - 1;
          }
        }
        break;
      case "v-shape":
        for (let r = 0; r < validRows; r++) {
          const span = Math.floor((r / Math.max(1, validRows - 1)) * (validCols / 2));
          for (let c = 0; c < validCols; c++) {
            newGrid[r][c] = Math.abs(c - Math.floor(validCols / 2)) <= span;
          }
        }
        break;
    }

    setGrid(newGrid);
  };

  const activeCount = grid.reduce(
    (sum, row) => sum + row.filter((cell) => cell).length,
    0
  );

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const cellSize = Math.min(40, Math.floor(500 / Math.max(validRows, validCols)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          padding: "1rem",
          background: "var(--bg-soft)",
          borderRadius: "12px",
        }}
      >
        <button className="admin-btn admin-btn--secondary admin-btn--small" onClick={clearGrid}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Xóa tất cả
        </button>
        <button className="admin-btn admin-btn--secondary admin-btn--small" onClick={fillAll}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              fill="currentColor"
              opacity="0.3"
            />
          </svg>
          Fill tất cả
        </button>
        <button className="admin-btn admin-btn--secondary admin-btn--small" onClick={invertGrid}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M1 4v6h6M23 20v-6h-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Đảo ngược
        </button>

        <div style={{ borderLeft: "1px solid var(--border-color)", margin: "0 0.25rem" }} />

        <button
          className="admin-btn admin-btn--secondary admin-btn--small"
          onClick={() => fillPattern("checkerboard")}
        >
          Checkerboard
        </button>
        <button
          className="admin-btn admin-btn--secondary admin-btn--small"
          onClick={() => fillPattern("diamond")}
        >
          Diamond
        </button>
        <button
          className="admin-btn admin-btn--secondary admin-btn--small"
          onClick={() => fillPattern("borders")}
        >
          Viền
        </button>
        <button
          className="admin-btn admin-btn--secondary admin-btn--small"
          onClick={() => fillPattern("v-shape")}
        >
          V-Shape
        </button>
      </div>

      {/* Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          background: "var(--bg-soft)",
          borderRadius: "8px",
          fontSize: "0.875rem",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>
          Kích thước: <strong style={{ color: "var(--text-primary)" }}>{validRows} × {validCols}</strong>
        </span>
        <span style={{ color: "var(--text-muted)" }}>
          Ô đã chọn:{" "}
          <strong style={{ color: "var(--accent)" }}>
            {activeCount} / {validRows * validCols}
          </strong>
        </span>
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        style={{
          display: "inline-grid",
          gridTemplateColumns: `repeat(${validCols}, ${cellSize}px)`,
          gap: "2px",
          padding: "1rem",
          background: "var(--bg-panel)",
          borderRadius: "12px",
          justifyContent: "center",
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "none",
        }}
        onMouseLeave={handleMouseUp}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              data-row={rowIndex}
              data-col={colIndex}
              onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
              onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                background: cell ? "var(--accent)" : "var(--bg-soft)",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                border: cell ? "2px solid var(--accent-strong)" : "2px solid var(--border-color)",
                boxShadow: cell ? "0 2px 8px rgba(124, 93, 255, 0.3)" : "none",
              }}
            />
          ))
        )}
      </div>

      {/* Instructions */}
      <div
        style={{
          padding: "1rem",
          background: "var(--bg-soft)",
          borderRadius: "8px",
          fontSize: "0.875rem",
          color: "var(--text-muted)",
        }}
      >
        💡 <strong>Hướng dẫn:</strong> Click hoặc kéo chuột trên các ô để tạo pattern cho kẻ địch. Các ô màu xanh
        đại diện cho vị trí sẽ xuất hiện kẻ địch.
      </div>
    </div>
  );
}
