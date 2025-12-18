import React from 'react';
import { render, act } from '@testing-library/react-native';
import SwipeCard from '../src/components/SwipeCard';

test('SwipeCard exposes swipeLeft and swipeRight and calls callbacks', () => {
  const onLeft = jest.fn();
  const onRight = jest.fn();
  const candidate = { user: { id: 1, username: 'u1', city: 'Nowhere' }, theyHaveINeed: [] };

  const ref = React.createRef();
  render(<SwipeCard ref={ref} candidate={candidate} onSwipeLeft={onLeft} onSwipeRight={onRight} />);

  act(() => {
    ref.current.swipeRight();
  });
  expect(onRight).toHaveBeenCalled();

  act(() => {
    ref.current.swipeLeft();
  });
  expect(onLeft).toHaveBeenCalled();
});