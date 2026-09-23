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

// const App = () => {
//   const [selectedCoords, setSelectedCoords] = useState<CoordType[]>([]);

//   useEffect(() => {
//     const board = JXG.JSXGraph.initBoard("jxgbox", {
//       boundingbox: [-10, 10, 10, -10],
//       axis: true,
//     });

//     board.on("down", (event: PointerEvent) => {
//       const target = board.getAllObjectsUnderMouse(event)[0] as
//         | JXG.GeometryElement
//         | undefined;
//       if (target && target.elType === "point") {
//         const id = target.id;
//         board.removeObject(target);
//         setSelectedCoords((prev) => prev.filter((c) => c.id !== id));
//         return;
//       }

//       const [x, y] = board.getUsrCoordsOfMouse(event);
//       const rounded = {
//         x: Math.round(x * 100) / 100,
//         y: Math.round(y * 100) / 100,
//       };

//       const point = board.create("point", [rounded.x, rounded.y], {
//         size: 3,
//         name: "",
//       });

//       setSelectedCoords((prev) => [...prev, { id: point.id, ...rounded }]);
//     });

//     return () => JXG.JSXGraph.freeBoard(board);
//   }, []);
//   return (
//     <main className="flex justify-center p-5 gap-10">
//       <div
//         id="jxgbox"
//         className="jxgbox"
//         style={{ width: "600px", height: "600px" }}
//       />

//       <div className="w-20">
//         {selectedCoords.map((item) => (
//           <div>
//             {item.x},{item.y}
//           </div>
//         ))}
//       </div>
//     </main>
//   );
// };

const App = () => {
  const boardRef = useRef<JXG.Board | null>(null);
  const curveRef = useRef<JXG.Curve | null>(null);
  const [expr, setExpr] = useState("3x + 1");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const board = JXG.JSXGraph.initBoard("jxgbox", {
      boundingbox: [-10, 10, 10, -10],
      axis: true,
    });
    boardRef.current = board;

    return () => JXG.JSXGraph.freeBoard(board);
  }, []);

  const plot = () => {
    const result = compileExpression(expr);
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

    curveRef.current = board.create("functiongraph", [result.fn, -10, 10], {
      strokeColor: "#0072B2",
      strokeWidth: 2,
    });
  };

  return (
    <div className="flex justify-center p-5 flex-col items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          plot();
        }}
      >
        <label htmlFor="fx">f(x) = </label>
        <input id="fx" value={expr} onChange={(e) => setExpr(e.target.value)} />
        <button type="submit">Plot</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        id="jxgbox"
        className="jxgbox"
        style={{ width: "600px", height: "600px" }}
      />
    </div>
  );
};

export default App;
