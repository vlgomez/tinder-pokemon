import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingMoreIndicator from '../src/components/LoadingMoreIndicator';

test('renders when visible and not when hidden', () => {
  const { getByTestId, queryByTestId, rerender } = render(<LoadingMoreIndicator visible={true} />);
  expect(getByTestId('loading-more')).toBeTruthy();
  rerender(<LoadingMoreIndicator visible={false} />);
  expect(queryByTestId('loading-more')).toBeNull();
});