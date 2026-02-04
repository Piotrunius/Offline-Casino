import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { CasinoProvider, useCasino } from '../CasinoContext';

// Helper component to test hook
const TestComponent = () => {
  const { state, placeBet, addWin } = useCasino();
  return (
    <div>
      <div data-testid="balance">{state.balance}</div>
      <button onClick={() => placeBet(100, 'test_game')}>Bet 100</button>
      <button onClick={() => addWin(200, 100, 'test_game', 2)}>Win 200</button>
    </div>
  );
};

describe('CasinoContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides initial state', () => {
    render(
      <CasinoProvider>
        <TestComponent />
      </CasinoProvider>
    );
    
    expect(screen.getByTestId('balance')).toHaveTextContent('1000');
  });

  it('updates balance when betting', async () => {
    render(
      <CasinoProvider>
        <TestComponent />
      </CasinoProvider>
    );

    const betButton = screen.getByText('Bet 100');
    await act(async () => {
        betButton.click();
    });

    expect(screen.getByTestId('balance')).toHaveTextContent('900');
  });

  it('updates balance when winning', async () => {
    render(
      <CasinoProvider>
        <TestComponent />
      </CasinoProvider>
    );

    const betButton = screen.getByText('Bet 100');
    const winButton = screen.getByText('Win 200');

    await act(async () => {
        betButton.click(); // 900
        winButton.click(); // 900 + 200 = 1100
    });

    expect(screen.getByTestId('balance')).toHaveTextContent('1100');
  });
});
