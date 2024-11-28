"use client";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import React, { useState } from "react";
import { Emphasis } from "../Text/Text";
import VideoFeed from "../VideoFeed/VideoFeed";
import styles from "./InteractiveGraph.module.scss";
import useWindowDimensions from "@/app/hooks/viewport";
import {
    Connection,
    InteractiveGraphProps,
    PersistentGraphPopoverProps,
    VerticesGroup,
    VerticesInterface,
    ZoneTypes,
} from "./IneractiveGraph.interface";
import { updateVertices } from "./InteractiveGraph.handler";

const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
    vertices,
    setVertices,
}) => {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const [draggedVertex, setDraggedVertex] = useState<number | null>(null);

    const connections: Connection[] = [
        { source: 0, target: 1 },
        { source: 1, target: 2 },
        { source: 2, target: 3 },
        { source: 3, target: 0 },
    ];

    const getMousePosition = (event: React.MouseEvent): DOMPoint => {
        const svg = svgRef.current;
        if (!svg) throw new Error("SVG ref is null");

        const CTM = svg.getScreenCTM();
        if (!CTM) throw new Error("CTM is null");

        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        return point.matrixTransform(CTM.inverse());
    };

    const handleMouseDown = (index: number): void => {
        setDraggedVertex(index);
    };

    const handleMouseMove = (e: React.MouseEvent): void => {
        if (draggedVertex == null) return;

        const point = getMousePosition(e);
        setVertices((vertices: VerticesGroup) =>
            vertices.map((vertex, index) =>
                index === draggedVertex
                    ? { ...vertex, x: point.x, y: point.y }
                    : vertex
            )
        );
    };

    const handleMouseUp = (): void => {
        setDraggedVertex(null);
    };

    const handleMouseLeave = (): void => {
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
                {vertices.map((vertex: VerticesInterface, index: number) => (
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

// Parent component that maintains the state
const PersistentGraphPopover: React.FC<PersistentGraphPopoverProps> = ({
    putInMotionHandler,
    setOpenVertices,
    openVertices,
}) => {
    const { width } = useWindowDimensions();
    const [vertices, setVertices] = useState<VerticesGroup>([
        { id: 1, x: 100, y: 150 },
        { id: 2, x: 200, y: 100 },
        { id: 3, x: 300, y: 150 },
        { id: 4, x: 200, y: 200 },
    ]);
    const [activeVertice, setActiveVertice] = useState<
        "green_zone" | "red_zone" | "traffic_zone"
    >("green_zone");

    return (
        <>
            {width > 700 && (
                <div
                    className={`flex flex-col gap-2 ${styles.verticeController}`}
                >
                    <Emphasis>Think you can improve the zones?</Emphasis>
                    <div className="flex flex-wrap gap-2 mb-2 h-[44px] items-center">
                        <Button
                            onClick={() => {
                                setOpenVertices(!openVertices);
                                putInMotionHandler();
                            }}
                        >
                            Zone Editor
                        </Button>
                        <div className="flex items-center space-x-2">
                            <Select
                                onValueChange={(value: ZoneTypes) => {
                                    setActiveVertice(value);
                                }}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Select Zone" />
                                </SelectTrigger>
                                <SelectContent className="z-[1050]">
                                    <SelectGroup>
                                        <SelectLabel>Zones</SelectLabel>
                                        <SelectItem value="red_zone">
                                            Red Zone
                                        </SelectItem>
                                        <SelectItem value="green_zone">
                                            Green Zone
                                        </SelectItem>
                                        <SelectItem value="traffic_zone">
                                            Traffic Zone
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={() =>
                                updateVertices(vertices, activeVertice)
                            }
                        >
                            Apply Zone
                        </Button>
                    </div>
                </div>
            )}

            <div className="relative">
                {openVertices ? (
                    <div className="absolute top-0 left-0 z-[2542] opacity-50 w-[640px]">
                        <InteractiveGraph
                            activeVertice={activeVertice}
                            vertices={vertices}
                            setVertices={setVertices}
                        />
                    </div>
                ) : (
                    <></>
                )}
                <VideoFeed />
            </div>
        </>
    );
};

export default PersistentGraphPopover;
