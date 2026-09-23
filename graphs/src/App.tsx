import JXG from "jsxgraph";
import "../node_modules/jsxgraph/distrib/jsxgraph.css";
import { useEffect, useRef, useState } from "react";

type CoordType = {
  id: string;
  x: number;
  y: number;
};

const ALLOWED_TOKEN =
  /^(sin|cos|tan|sqrt|log|ln|abs|pi|e|x|[0-9.+\-*/^(),\s])+$/i;

function compileExpression(
  raw: string,
): { fn: (x: number) => number } | { error: string } {
  const expr = raw.trim();
  if (!expr) return { error: "Enter a function to plot" };
  if (!ALLOWED_TOKEN.test(expr)) {
    return {
      error:
        "Only numbers, x, + - * / ^ ( ) and sin/cos/tan/sqrt/log/abs are allowed",
    };
  }

  const jsBody = expr
    .replace(/\^/g, "**")
    .replace(/(\d)\s*x/gi, "$1*x")
    .replace(/(\d)\s*\(/g, "$1*(")
    .replace(/\)\s*\(/g, ")*(")
    .replace(/\bln\b/gi, "log");

  try {
    const raw_fn = new Function(
      "x",
      "sin",
      "cos",
      "tan",
      "sqrt",
      "log",
      "abs",
      "pi",
      "e",
      `return (${jsBody});`,
    ) as (x: number, ...m: any[]) => number;

    const fn = (x: number) =>
      raw_fn(
        x,
        Math.sin,
        Math.cos,
        Math.tan,
        Math.sqrt,
        Math.log,
        Math.abs,
        Math.PI,
        Math.E,
      );

    if (typeof fn(1) !== "number")
      return { error: "That doesn't evaluate to a number" };
    return { fn };
  } catch {
    return { error: "Couldn't parse that expression" };
  }
}

const App = () => {
  const boardRef = useRef<JXG.Board | null>(null);
  const curveRef = useRef<JXG.Curve | null>(null);
  const [expr, setExpr] = useState("3x + 1");
  const [error, setError] = useState<string | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<CoordType[]>([]);

  const [equ, setEqu] = useState("");

  useEffect(() => {
    const board = JXG.JSXGraph.initBoard("jxgbox", {
      boundingbox: [-10, 10, 10, -10],
      axis: true,
    });
    boardRef.current = board;

    board.on("down", (event: PointerEvent) => {
      const target = board.getAllObjectsUnderMouse(event)[0] as
        | JXG.GeometryElement
        | undefined;
      if (target && target.elType === "point") {
        const id = target.id;
        board.removeObject(target);
        setSelectedCoords((prev) => prev.filter((c) => c.id !== id));
        return;
      }

      const [x, y] = board.getUsrCoordsOfMouse(event);
      const rounded = {
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
      };

      const point = board.create("point", [rounded.x, rounded.y], {
        size: 3,
        name: "",
      });

      setSelectedCoords((prev) => [...prev, { id: point.id, ...rounded }]);
    });

    return () => JXG.JSXGraph.freeBoard(board);
  }, []);

  useEffect(() => {
    if (selectedCoords.length < 2) {
      const board = boardRef.current;
      if (!board) return;
      if (curveRef.current) {
        board.removeObject(curveRef.current);
      }
      return;
    }
    // if (selectedCoords.length === 2) {
    //   // const x1 = selectedCoords[0].x;
    //   // const y1 = selectedCoords[0].y;
    //   // const x2 = selectedCoords[1].x;
    //   // const y2 = selectedCoords[1].y;
    //   // let m = (y1 - y2) / (x1 - x2);
    //   // let b = y1 - x1 * m;
    //   // console.log(`f(x)=${m}x+${b}`);
    //   // plot(`${m}x+${b}`);
    // }
    else {
      let equation = "";
      for (let i = 0; i < selectedCoords.length; i++) {
        let szamlalo = "";
        let nevezo = 1;
        for (let l = 0; l < selectedCoords.length; l++) {
          if (i !== l) {
            szamlalo += `(x-(${selectedCoords[l].x}))`;
            nevezo *= selectedCoords[i].x - selectedCoords[l].x;
          }
        }
        console.log(`(${szamlalo})/(${nevezo})*${selectedCoords[i].y}+`);

        equation += `${szamlalo}/${nevezo}*${selectedCoords[i].y}${i !== selectedCoords.length - 1 ? "+" : ""}`;
      }
      console.log(equation);
      plot(equation);
      setEqu(equation);
    }
  }, [selectedCoords]);

  const plot = (expres: string) => {
    const result = compileExpression(expres);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setError(null);

    const board = boardRef.current;
    if (!board) return;

    // remove the old curve before drawing the new one
    if (curveRef.current) {
      board.removeObject(curveRef.current);
    }

    curveRef.current = board.create("functiongraph", [result.fn, -1000, 1000], {
      strokeColor: "#0072B2",
      strokeWidth: 2,
    });
  };

  return (
    <div className="flex justify-center p-5 gap-10">
      <div className="flex flex-col">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            plot(expr);
          }}
        >
          <label htmlFor="fx">f(x) = </label>
          <input
            id="fx"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
          />
          <button type="submit">Plot</button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div
          id="jxgbox"
          className="jxgbox"
          style={{ width: "600px", height: "600px" }}
        />
      </div>
      <div className="w-20">
        {selectedCoords.map((item) => (
          <div>
            {item.x},{item.y}
          </div>
        ))}
      </div>
      <div className="max-w-20">{equ}</div>
    </div>
  );
};

export default App;
