import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MappyBoi from './components/DetectiveMap/MappyBoi';
import Grid from './components/Grid';
import Content from './components/layout/Content';
import List from './components/List';
import universe from './data/universe';
import { AllMapLayers, MapLayer } from './util/map-layer';

type Props = {
  className?: React.HTMLAttributes<HTMLElement>['className'];
};

const visibleLayers: MapLayer[] = [
  MapLayer.SUNKEN_MODULE,
  MapLayer.VESSEL,
  MapLayer.QUANTUM_MOON,
  MapLayer.TIME_LOOP,
  MapLayer.INVISIBLE_PLANET,
  MapLayer.OTHER,
];

const App: React.FC<Props> = ({ className }) => {

  const [resetAt, setResetAt] = React.useState<number>();

  return (
    <Router>
      <div
        className={`${
          className ?? ''
        } flex flex-col md:flex-row w-full min-h-screen h-full md:max-h-screen md:h-auto`}
      >
        <div
          className="flex flex-col md:flex-1 overflow-scroll scrollbar-off"
          style={{
            minHeight: 400,
          }}
        >
          <Content>
            <Routes>
              <Route path="/list" element={<List nodes={universe.nodes} />} />
              <Route path="/grid" element={<Grid nodes={universe.nodes} />} />
              <Route
                path="/"
                element={
                  <MappyBoi
                    nodes={universe.nodes}
                    visibleLayers={visibleLayers}
                    resetAt={resetAt}
                  />
                }
              />
            </Routes>
          </Content>
        </div>
      </div>
    </Router>
  );
};

export default App;
