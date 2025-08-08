import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  // 기본적인 렌더링 테스트
  expect(document.body).toBeInTheDocument();
});
