---
layout: post
title:  "Simple sudoku solver with constraint propagation"
date:   2017-12-11 20:38:41 +0200
categories: jekyll update
---

<script type='text/javascript' src="https://raw.githubusercontent.com/gpicavet/sudoku-solver/master/solver.js"></script>

<textarea id="board" cols="60">
</textarea>
<br>
<textarea id="message" cols="60">
</textarea>
<br>
<button onclick="solve()">SOLVE</button>

<script type='text/javascript'>
  var board=      [
          ["8",".",".",".",".",".",".",".","."],
          [".",".","3","6",".",".",".",".","."],
          [".","7",".",".","9",".","2",".","."],
          [".","5",".",".",".","7",".",".","."],
          [".",".",".",".","4","5","7",".","."],
          [".",".",".","1",".",".",".","3","."],
          [".",".","1",".",".",".",".","6","8"],
          [".",".","8","5",".",".",".","1","."],
          [".","9",".",".",".",".","4",".","."]
        ];
  setTextArea(document.querySelector("#board"), board);
  function setTextArea(o,b) {
    o.value = JSON.stringify(b, null,' ').replace(/\",\n/g,'\",');
    o.style.height = "1px";
    o.style.height = (25+o.scrollHeight)+"px";
  }
  function solve() {
    var t = document.querySelector("#board");
    var b = JSON.parse(t.value);
    try {
      var solver = new SudokuSolver();
      b = solver.solve(b);
      setTextArea(t,b);
      document.querySelector("#message").value= "Resolved in "+solver.stats.time+" ms, "+solver.stats.tests+" tests, "+solver.stats.backtracks+" backtracks";
    } catch (e) {
      if(e === "invalid board")
        document.querySelector("#message").value = "Invalid board!";
      else
        document.querySelector("#message").value = "error : "+e;
    }
  }
</script>