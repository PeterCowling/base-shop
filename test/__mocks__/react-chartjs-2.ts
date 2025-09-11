import React from 'react';

function MockComponent() {
  return React.createElement('div');
}

export const Line = MockComponent;
export const Bar = MockComponent;
export const Doughnut = MockComponent;
export const Pie = MockComponent;
export default { Line, Bar, Doughnut, Pie };
