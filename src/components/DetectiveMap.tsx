import React from 'react';
import { MapNode } from '../data/universe/types';
import BoundingBox from '../util/bounding-box';
import dimensionsFrom from '../util/dimensions-from';
import notEmpty from '../util/not-empty';
import themeFrom from '../util/theme-from';
import Card from './Card';
import { ReactComponent as LinkChevron } from '../assets/images/link_chevron.svg';

type Size = {
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

class Rect {
  private _centre: Point;
  private _size: Size;

  constructor(centre: Point, size: Size) {
    this._centre = centre;
    this._size = size;
  }

  get centre() {
    return this._centre;
  }

  get size() {
    return this._size;
  }

  get topLeft(): Point {
    return {
      x: this.centre.x - this.size.width / 2,
      y: this.centre.y - this.size.height / 2,
    };
  }

  edgeIntersection(to: Point): Point {
    const sign = (n: number): 1 | -1 => {
      if (n >= 0) {
        return 1;
      }
      return -1;
    };

    const scaled = {
      x: to.x - this.centre.x,
      y: to.y - this.centre.y,
    };
    const magnitude = Math.sqrt(scaled.x * scaled.x + scaled.y * scaled.y);
    const normalised = {
      x: scaled.x / magnitude,
      y: scaled.y / magnitude,
    };

    const num1 = this.size.width * 0.5;
    const num2 = this.size.height * 0.5;

    if (Math.abs(normalised.y / normalised.x) < Math.abs(num2 / num1)) {
      const x = sign(normalised.x) * num1;
      const y = (normalised.y / normalised.x) * x;

      return {
        x: this.centre.x + x,
        y: this.centre.y + y,
      };
    }

    const y = sign(normalised.y) * num2;
    const x = (normalised.x / normalised.y) * y;

    return {
      x: this.centre.x + x,
      y: this.centre.y + y,
    };
  }
}

const pointBetween = (p1: Point, p2: Point, percent = 0.5): Point => ({
  x: percent * p1.x + (1 - percent) * p2.x,
  y: percent * p1.y + (1 - percent) * p2.y,
});

type Props = {
  boundingBox: BoundingBox;
  nodes: MapNode[];
  onSelect: (node: MapNode) => void;
  selected?: MapNode;
};

const DetectiveMap: React.FC<Props> = ({
  boundingBox,
  nodes: unsortedNodes,
  selected,
  onSelect,
}) => {
  const mappableNodes = React.useMemo(() => {
    return unsortedNodes
      .sort((a, b) => {
        const da = dimensionsFrom(a.sizeClass);
        const db = dimensionsFrom(b.sizeClass);

        if (da.width < db.width) {
          return 1;
        } else if (da.width > db.width) {
          return -1;
        }

        const ya = a.location.y;
        const yb = b.location.y;

        if (ya < yb) {
          return -1;
        } else if (ya > yb) {
          return 1;
        }

        return 0;
      })
      .map((node) => ({
        node,
        frame: new Rect(
          boundingBox.pointFor(node.location),
          dimensionsFrom(node.sizeClass)
        ),
      }));
  }, [unsortedNodes, boundingBox]);

  const connections = React.useMemo(() => {
    const findById = (id: string) =>
      mappableNodes.find(({ node }) => node.id === id);

    return mappableNodes.reduce((prev, mappableNode) => {
      const destinations = mappableNode.node.connections
        .map((connection) => findById(connection))
        .filter(notEmpty);

      for (const destination of destinations) {
        const duplicate = prev.find(
          (v) =>
            v.source.node.id === mappableNode.node.id &&
            v.destination.node.id === destination.node.id
        );

        if (duplicate != null) {
          continue;
        }

        const reverse = prev.find(
          (v) =>
            v.source.node.id === destination.node.id &&
            v.destination.node.id === mappableNode.node.id
        );

        if (reverse != null) {
          reverse.offset = 0.65;
        }

        prev.push({
          source: mappableNode,
          destination,
          offset: reverse == null ? 0.5 : reverse.offset,
        });
      }

      return prev;
    }, [] as { source: typeof mappableNodes[0]; destination: typeof mappableNodes[0]; offset: number }[]);
  }, [mappableNodes]);

  // todo: filter out connections that have duplicates!
  // (or handle them better in general)

  const lines = React.useMemo(() => {
    return connections.map(({ source, destination, offset }) => {
      const from = source.frame.edgeIntersection(destination.frame.centre);
      const to = destination.frame.edgeIntersection(source.frame.centre);

      return {
        from,
        to,
        chevronAt: pointBetween(from, to, offset),
        angle: boundingBox.angleBetween(from, to),
      };
    });
  }, [connections, boundingBox]);

  const chevronScale = 0.8;
  const chevronShadowScale = chevronScale * 1.7;
  const chevronSize = { w: 39, h: 29 };

  return (
    <g>
      {lines.map((line, idx) => (
        <g key={`line-${idx}`}>
          <line
            x1={`${line.from.x}`}
            y1={`${line.from.y}`}
            x2={`${line.to.x}`}
            y2={`${line.to.y}`}
            className="stroke-current text-card-grey"
            strokeWidth={8}
            strokeLinecap="square"
          />
        </g>
      ))}
      {lines.map((line, idx) => (
        <g key={`chevron-${idx}`}>
          <g
            transform={`translate(-${
              (chevronSize.w / 2) * chevronShadowScale
            } -${(chevronSize.h / 2) * chevronShadowScale}) translate(${
              line.chevronAt.x
            } ${line.chevronAt.y}) rotate(${line.angle} ${
              (chevronSize.w / 2) * chevronShadowScale
            } ${(chevronSize.h / 2) * chevronShadowScale})`}
          >
            <g
              transform={`translate(5.7 0) scale(${chevronShadowScale})`}
              className="fill-current text-page-bg"
            >
              <LinkChevron />
            </g>
          </g>
          <g
            className="fill-current text-card-grey"
            transform={`translate(-${(chevronSize.w / 2) * chevronScale} -${
              (chevronSize.h / 2) * chevronScale
            }) translate(${line.chevronAt.x} ${line.chevronAt.y}) rotate(${
              line.angle
            } ${(chevronSize.w / 2) * chevronScale} ${
              (chevronSize.h / 2) * chevronScale
            })`}
          >
            <g transform={`scale(${chevronScale})`}>
              <LinkChevron />
            </g>
          </g>
        </g>
      ))}
      {mappableNodes.map(({ node, frame }) => {
        return (
          <foreignObject
            key={node.id}
            x={frame.topLeft.x}
            y={frame.topLeft.y}
            width={frame.size.width}
            height={frame.size.height}
          >
            <div
              // @ts-ignore
              xmlns="http://www.w3.org/1999/xhtml"
            >
              <div>
                <Card
                  node={node}
                  onSelect={onSelect}
                  isSelected={node.id === selected?.id}
                />
              </div>
            </div>
          </foreignObject>
        );
      })}
      {false &&
        mappableNodes.map(({ node }) => {
          const theme = themeFrom(node.colour, node.id === selected?.id);
          const dimensions = dimensionsFrom(node.sizeClass);

          return (
            <circle
              key={node.id}
              className={`fill-current ${theme.bgtext}`}
              cx={boundingBox.pointFor(node.location).x}
              cy={boundingBox.pointFor(node.location).y}
              r={dimensions.width / 4}
            />
          );
        })}
    </g>
  );
};

export default React.memo(DetectiveMap);