import { VerticesGroup } from "./IneractiveGraph.interface";

export const updateVertices = (vertices: VerticesGroup, label: string) => {
    fetch("/py/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            vertices: vertices,
            label: label,
        }),
    })
        .then((response) => response.json())
        .then((data) => console.log(data));
};
