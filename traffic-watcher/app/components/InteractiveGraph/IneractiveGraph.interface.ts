import { SetStateAction } from "react";

export interface VerticesInterface {
    id: number;
    x: number;
    y: number;
}

export type ZoneTypes =
    | "green_zone"
    | "green_zone_2"
    | "red_zone"
    | "traffic_zone";

export type VerticesGroup = Array<VerticesInterface>;

export interface PersistentGraphPopoverProps {
    putInMotionHandler: () => void;
    setOpenVertices: React.Dispatch<SetStateAction<boolean>>;
    openVertices: boolean;
}

export interface InteractiveGraphProps {
    vertices: VerticesGroup;
    activeVertice: "red_zone" | "green_zone" | "green_zone_2" | "traffic_zone";
    setVertices: React.Dispatch<React.SetStateAction<VerticesGroup>>;
}

export interface Connection {
    source: number;
    target: number;
}
