"use client";

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import React, { useState } from 'react';

interface InteractiveGraphProps {
    vertices: VerticesGroup;
    activeVertice: 'red_zone' | 'green_zone' | 'traffic_zone';
    setVertices: React.Dispatch<React.SetStateAction<VerticesGroup>>;
}
// Separate the graph into its own component that receives state as props
const InteractiveGraph: React.FC<InteractiveGraphProps> = ({ vertices, setVertices }) => {
    const svgRef = React.useRef(null);
    const [draggedVertex, setDraggedVertex] = useState(null);



    const connections = [
        { source: 0, target: 1 },
        { source: 1, target: 2 },
        { source: 2, target: 3 },
        { source: 3, target: 0 },
    ];

    const getMousePosition = (event) => {
        const svg = svgRef.current;
        const CTM = svg.getScreenCTM();
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        return point.matrixTransform(CTM.inverse());
    };

    const handleMouseDown = (index) => {
        setDraggedVertex(index);
    };


    const handleMouseMove = (e) => {

        if (draggedVertex == null) return;

        const point = getMousePosition(e);
        setVertices(vertices.map((vertex, index) =>
            index === draggedVertex
                ? { ...vertex, x: point.x, y: point.y }
                : vertex
        ));
    }

    const handleMouseUp = () => {

        setDraggedVertex(null);
    };

    const handleMouseLeave = () => {

        setDraggedVertex(null);
    };

    return (
        <svg
            ref={svgRef}
            className="w-full border border-slate-200"
            viewBox="0 0 640 640"
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        >
            <g>
                {connections.map((connection, index) => (
                    <line
                        key={index}
                        x1={vertices[connection.source].x}
                        y1={vertices[connection.source].y}
                        x2={vertices[connection.target].x}
                        y2={vertices[connection.target].y}
                        className="stroke-lime-300 stroke-2"
                    />
                ))}
            </g>

            {/* Vertices */}
            <g>
                {vertices.map((vertex, index) => (
                    <circle
                        key={vertex.id}
                        cx={vertex.x}
                        cy={vertex.y}
                        r="4"
                        className="fill-blue-500 stroke-blue-700 stroke-2 cursor-move hover:fill-blue-600"
                        onMouseDown={() => handleMouseDown(index)}
                    />
                ))}
            </g>
        </svg>
    );
};

interface VerticesInterface {
    id: number;
    x: number;
    y: number;
}

type VerticesGroup = Array<VerticesInterface>;

// Parent component that maintains the state
const PersistentGraphPopover = () => {
    // Lift the vertices state up to the parent
    const [vertices, setVertices] = useState<VerticesGroup>([
        { id: 1, x: 100, y: 150 },
        { id: 2, x: 200, y: 100 },
        { id: 3, x: 300, y: 150 },
        { id: 4, x: 200, y: 200 }
    ]);

    const updateVertices = (vertices: VerticesGroup, label: string) => {
        fetch('/py/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vertices: vertices,
                label: label
            }),
        })
            .then(response => response.json())
            .then(data => console.log(data))
    }

    const [openVertices, setOpenVertices] = useState<boolean>(false)
    const [activeVertice, setActiveVertice] = useState<'green_zone' | 'red_zone' | 'traffic_zone'>('green_zone')

    return (

        <>
            <div className="flex gap-2">
                <Button onClick={() => setOpenVertices(!openVertices)}>
                    Open Vertice Editor
                </Button>
                <div className="flex items-center space-x-2">
                    <Select onValueChange={(value) => {
                        console.log(value)
                        setActiveVertice(value)
                    }} >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Vertices Zone" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Zones</SelectLabel>
                                <SelectItem value="red_zone">Red Zone</SelectItem>
                                <SelectItem value="green_zone">Green Zone</SelectItem>
                                <SelectItem value="traffic_zone">Traffic Zone</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => updateVertices(vertices, activeVertice)}>
                    Apply Zone
                </Button>
            </div>
            {openVertices ? <div className='absolute top-[36px] left-0 z-[2542] opacity-50 w-[640px]'>
                <InteractiveGraph
                    activeVertice={activeVertice}
                    vertices={vertices}
                    setVertices={setVertices}
                />
            </div> : <></>}</>


    );
};

export default PersistentGraphPopover;